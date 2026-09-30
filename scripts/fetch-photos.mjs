#!/usr/bin/env node
/**
 * 真实新闻照片抓取器（Wikimedia Commons）
 *
 * I. 这个脚本解决什么问题
 *
 * 1. 首页轮播、左右栏横幅、领导活动小图原本是脚本画的几何剪影。矢量徽记与地图
 *    保留矢量更清楚，但"新闻照片位"用剪影会显得像图标，因此换成真实照片。
 * 2. 照片**必须落进仓库**（`public/assets/photos/`），构建过程不联网：
 *    脚本只在人工执行时下载一次，产物随后提交，`pnpm run build` 永远离线可重现。
 *
 * II. 取图与筛选策略
 *
 * 1. 走 Commons 官方 API 的 `generator=search`，比猜文件名可靠：
 *    搜索 → 取 imageinfo → 按尺寸/长宽比/标题黑名单过滤 → 打分 → 下载最优。
 * 2. 每个槽位可以在 `SELECTION` 里钉死具体文件名。钉死后即使断网，只要照片已在
 *    仓库里，脚本也什么都不会做（默认跳过已存在的文件）。
 * 3. `--force` 才重新下载；`--candidates` 只把候选图拉到临时目录供人工挑选，
 *    不写入仓库。
 *
 * III. 体积控制
 *
 * 1. 缩放与重编码交给 Python 的 Pillow（本机已装）。JPEG q82 + 渐进式，
 *    单张 hero 约 300 KB，全部照片控制在 3 MB 上下，远低于 8 MB 上限。
 * 2. 一律先按目标长宽比居中裁切再缩放，保证同组图比例一致，页面里不会跳动。
 *
 * @module scripts/fetch-photos
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'photos');
const TMP_DIR = join(ROOT, '.tmp', 'photo-candidates');

const UA = 'maga-gov-parody-site/1.0 (offline reproducible build; pengzexuan2001@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const CANDIDATES = argv.includes('--candidates');
const ONLY = (() => {
  const i = argv.indexOf('--only');
  return i >= 0 ? argv[i + 1] : null;
})();

/* ================= I. 槽位定义 ================= */

/**
 * 每个槽位描述"要什么图、裁成什么比例、多宽"
 *
 * ratio 为宽/高：hero 与横幅用 16:9，领导活动小图与页面显示尺寸一致用 3:2，
 * 人像用 1:1（横幅容器是扁的，方形裁切在横竖两个方向都不会丢主体）。
 */
const SLOTS = {
  'hero-1': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Donald Trump rally podium', 'Trump campaign rally speech podium'] },
  'hero-2': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['United States Capitol west front', 'United States Capitol building'] },
  'hero-3': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['White House north facade', 'White House Washington exterior', 'White House north lawn'] },
  'hero-4': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Donald Trump rally crowd audience', 'Trump rally supporters crowd wide'] },
  'hero-5': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Trump signing executive order', 'bill signing ceremony White House'] },
  'trump-portrait': { ratio: 1, width: 1000, orientation: 'any', q: ['Donald Trump official portrait', 'Donald Trump portrait photograph'] },
  'veterans': { ratio: 16 / 9, width: 1200, orientation: 'landscape', q: ['US military veteran saluting flag', 'American veteran soldier flag'] },
  'desert': { ratio: 16 / 9, width: 1200, orientation: 'landscape', q: ['desert highway road Arizona', 'Route 66 road desert', 'Mojave desert highway'], must: /(road|highway|route ?66|freeway|interstate|street)/i },
  'press-1': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Donald Trump Oval Office meeting', 'Donald Trump cabinet meeting White House'] },
  'press-2': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Trump handshake leader', 'presidential handshake White House'] },
  'press-3': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Donald Trump press conference White House', 'White House press briefing podium'] },
};

/**
 * 人工挑选后的固定选片
 *
 * 由 `--candidates` 拉取候选、人工比对后回填。钉死后脚本不再依赖搜索排序，
 * 保证任何人任何时间重跑都得到同一张图。
 * 形状：slot → [{ title, author, license, licenseUrl }]
 */
const SELECTION = {
  'hero-1': [],
  'hero-2': [],
  'hero-3': [],
  'hero-4': [],
  'hero-5': [],
  'trump-portrait': [],
  veterans: [],
  desert: [],
  'press-1': [],
  'press-2': [],
  'press-3': [],
};

/* ================= II. Commons 访问 ================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 标题黑名单：地图、徽章、图表、签名之类不是照片，混进来会很难看 */
const TITLE_BLOCK = /(map|diagram|logo|coat[_ ]of[_ ]arms|seal[_ ]of|chart|graph|poster|screenshot|icon|\.svg|signature|plaque|monument|stamp|banknote|cartoon|drawing|engraving|painting|statue|lccn)/i;

/** 照片最早年份：历史档案照多为黑白或带黑边，与本站配色不搭，一律排除 */
const MIN_YEAR = 1995;

/**
 * 搜索 Commons 文件命名空间
 *
 * @param query - 英文关键词
 * @param limit - 返回候选数
 * @returns 候选数组，含缩略图直链与署名元数据
 */
async function search(query, limit = 24) {
  const url =
    `${API}?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}` +
    `&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600&format=json&origin=*`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons 搜索失败 HTTP ${res.status}`);
  const json = await res.json();
  return Object.values(json.query?.pages ?? {});
}

/** 把 API 结果规整成候选对象 */
function toCandidate(page) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const em = info.extmetadata ?? {};
  const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  // 拍摄年份：Commons 的 DateTimeOriginal 形如 "2018-03-25 14:22:01"，取前四位即可
  const rawDate = strip(em.DateTimeOriginal?.value);
  const year = /(1[89]\d{2}|20\d{2})/.test(rawDate) ? Number(/(1[89]\d{2}|20\d{2})/.exec(rawDate)[1]) : null;
  return {
    title: page.title.replace(/^File:/, ''),
    thumburl: info.thumburl || info.url,
    width: info.width,
    height: info.height,
    mime: info.mime,
    year,
    author: strip(em.Artist?.value) || '未署名',
    license: strip(em.LicenseShortName?.value) || '见来源页',
    licenseUrl: em.LicenseUrl?.value || '',
    descriptionUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.title.replace(/^File:/, ''))}`,
  };
}

/**
 * 候选过滤与打分
 *
 * @param cand - 候选
 * @param slot - 槽位配置
 * @returns 分数，负分表示不合格
 */
function score(cand, slot) {
  if (!cand || !cand.thumburl) return -1;
  if (!/^image\/(jpeg|png)$/.test(cand.mime ?? '')) return -1;
  if (!cand.width || !cand.height) return -1;
  if (cand.width < 900) return -1;
  if (TITLE_BLOCK.test(cand.title)) return -1;
  // 历史档案照（黑白、带黑边）与本站配色冲突，直接排除
  if (cand.year && cand.year < MIN_YEAR) return -1;
  // 某些槽位需要标题里必须出现关键词，否则搜索会飘到完全不相关的题材
  if (slot.must && !slot.must.test(cand.title)) return -1;
  const ar = cand.width / cand.height;
  if (slot.orientation === 'landscape' && ar < 1.25) return -1;
  if (slot.orientation === 'portrait' && ar > 0.9) return -1;
  // 太极端的长条图裁出来会很难看
  if (ar > 2.6 || ar < 0.55) return -1;

  let s = 0;
  // 分辨率越高越好，但超过 4000px 之后收益递减
  s += Math.min(cand.width, 4000) / 1000;
  // 宽高比越接近目标越好（省得裁掉太多）
  s += 3 / (1 + Math.abs(ar - slot.ratio) * 4);
  // 标题命中关键词的优先
  for (const w of slot.q.join(' ').toLowerCase().split(/\s+/)) {
    if (w.length > 3 && cand.title.toLowerCase().includes(w)) s += 0.8;
  }
  return s;
}

/** 下载二进制并写入文件 */
async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`文件过小（${buf.length} B），可能不是图片`);
  writeFileSync(dest, buf);
  return buf.length;
}

/* ================= III. 图像处理（Pillow） ================= */

/**
 * 居中裁切到目标比例、缩放、重编码为 JPEG
 *
 * 直接调用 python3 + Pillow：项目禁止新增 npm 依赖，而 Node 侧没有任何可用的
 * 图像编解码能力（sharp 属新依赖，不可引入）。
 *
 * @param src - 原始文件
 * @param dst - 输出 jpg
 * @param width - 目标宽度
 * @param ratio - 目标宽高比
 * @param quality - JPEG 质量
 * @returns 输出体积（字节）
 */
function processImage(src, dst, width, ratio, quality = 82) {
  const py = `
import sys, os
from PIL import Image, ImageOps
src, dst, width, ratio, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])
im = Image.open(src)
im = ImageOps.exif_transpose(im)          # 按 EXIF 摆正，否则竖拍照片会躺着
im = im.convert('RGB')
w, h = im.size
target_h = int(round(width / ratio))
if w / h > ratio:
    new_w = int(round(h * ratio))         # 原图更宽 -> 裁两侧
    left = (w - new_w) // 2
    im = im.crop((left, 0, left + new_w, h))
else:
    new_h = int(round(w / ratio))         # 原图更高 -> 裁上下
    top = (h - new_h) // 2
    im = im.crop((0, top, w, top + new_h))
im = im.resize((width, target_h), Image.LANCZOS)
im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
print(os.path.getsize(dst))
`;
  const out = execFileSync('python3', ['-c', py, src, dst, String(width), String(ratio), String(quality)], {
    encoding: 'utf8',
  });
  return Number(out.trim());
}

/* ================= IV. 主流程 ================= */

/** 依据槽位拉取候选并按分数排序 */
async function gather(slot) {
  const cfg = SLOTS[slot];
  const seen = new Set();
  const all = [];
  for (const q of cfg.q) {
    let pages;
    try {
      pages = await search(q);
    } catch (err) {
      console.warn(`  ! 搜索失败（${q}）：${err.message}`);
      continue;
    }
    for (const page of pages) {
      const c = toCandidate(page);
      if (!c || seen.has(c.title)) continue;
      seen.add(c.title);
      const s = score(c, cfg);
      if (s > 0) all.push({ ...c, score: s });
    }
    await sleep(350); // 对 Commons 保持礼貌的请求间隔
  }
  return all.sort((a, b) => b.score - a.score);
}

/** 下载并处理单个槽位 */
async function fetchSlot(slot) {
  const cfg = SLOTS[slot];
  const dest = join(OUT_DIR, `${slot}.jpg`);
  if (existsSync(dest) && !FORCE) {
    console.log(`  · ${slot}.jpg 已存在，跳过（--force 可强制重下）`);
    return null;
  }
  const pinned = SELECTION[slot] ?? [];
  const picks = pinned.length ? pinned : await gather(slot);
  if (!picks.length) {
    console.warn(`  ! ${slot}：没有找到合格候选，保留原 SVG 兜底`);
    return null;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const raw = join(TMP_DIR, `${slot}.raw`);
  for (const pick of picks.slice(0, 6)) {
    try {
      const url = pick.thumburl || `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(pick.title)}?width=1600`;
      const bytes = await download(url, raw);
      const size = processImage(raw, dest, cfg.width, cfg.ratio);
      const w = cfg.width;
      const h = Math.round(cfg.width / cfg.ratio);
      console.log(`  ✓ ${slot}.jpg  ${w}×${h}  ${(size / 1024).toFixed(0)} KB  ← ${pick.title}（原始 ${(bytes / 1024).toFixed(0)} KB）`);
      return { ...pick, output: `${slot}.jpg`, width: w, height: h, bytes: size };
    } catch (err) {
      console.warn(`  ! ${slot}：候选「${pick.title}」失败（${err.message}），换下一个`);
    }
    await sleep(350);
  }
  console.warn(`  ! ${slot}：所有候选都下载失败`);
  return null;
}

/** 把候选图拉到临时目录供人工挑选 */
async function dumpCandidates() {
  // 不带 --only 时清空重来；带 --only 时保留已有候选，方便逐槽位分批挑图
  if (!ONLY) rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  const slots = ONLY ? [ONLY] : Object.keys(SLOTS);
  for (const slot of slots) {
    const cfg = SLOTS[slot];
    const list = await gather(slot);
    console.log(`\n${slot}（${list.length} 个候选）`);
    for (let i = 0; i < Math.min(list.length, 8); i++) {
      const c = list[i];
      const dest = join(TMP_DIR, `${slot}__${String(i).padStart(2, '0')}.jpg`);
      try {
        await download(c.thumburl, dest);
        processImage(dest, dest, Math.min(cfg.width, 900), cfg.ratio);
        console.log(`  [${i}] ${c.title}  (${c.width}×${c.height}, ${c.license})`);
      } catch (err) {
        console.log(`  [${i}] ${c.title}  下载失败：${err.message}`);
      }
      await sleep(300);
    }
  }
  console.log(`\n候选图已写到 ${TMP_DIR}`);
}

/**
 * 生成署名清单
 *
 * 只覆盖本次真正处理过的槽位，其余沿用已存在的记录：否则 `--only <槽位>`
 * 这样的局部重跑会把整份 CREDITS.md 冲成一行。
 */
function writeCredits(records) {
  const lines = [
    '# 照片署名（Photo Credits）',
    '',
    '本站首页轮播、左右栏横幅与领导活动小图使用了 Wikimedia Commons 上的真实照片。',
    '以下逐条列出来源页面、作者与许可协议，供查阅与合规引用。',
    '',
    '> 徽记、地图、二维码仍为站内自绘矢量图（`public/assets/*.svg`），不在此列。',
    '',
    '| 文件 | 来源页面 | 作者 | 许可协议 |',
    '| --- | --- | --- | --- |',
  ];
  for (const r of records) {
    const title = r.title.replace(/\|/g, '\\|');
    const author = (r.author || '未署名').replace(/\|/g, '\\|').slice(0, 90);
    const lic = r.licenseUrl ? `[${r.license}](${r.licenseUrl})` : r.license || '见来源页';
    lines.push(`| \`${r.output}\` | [${title}](${r.descriptionUrl}) | ${author} | ${lic} |`);
  }
  lines.push('');
  lines.push('重新下载：`node scripts/fetch-photos.mjs --force`（全部）或 `--force --only <槽位>`（单张）。');
  lines.push('');
  writeFileSync(join(ROOT, 'public', 'assets', 'CREDITS.md'), lines.join('\n'), 'utf8');
}

async function main() {
  if (CANDIDATES) {
    await dumpCandidates();
    return;
  }
  mkdirSync(TMP_DIR, { recursive: true });
  const slots = ONLY ? [ONLY] : Object.keys(SLOTS);
  console.log(`抓取照片：${slots.length} 个槽位${FORCE ? '（--force 强制重下）' : ''}\n`);
  const creditsFile = join(OUT_DIR, 'credits.json');
  const previous = existsSync(creditsFile) ? JSON.parse(String(readFileSync(creditsFile, 'utf8'))) : {};

  // 以已有记录为底，只覆盖本次处理过的槽位，保证局部重跑不会丢署名
  const merged = { ...previous };
  for (const slot of slots) {
    const rec = await fetchSlot(slot);
    if (rec) merged[slot] = rec;
    else if (!merged[slot]) console.warn(`  ! ${slot}：无记录可写入署名`);
  }
  const records = Object.keys(merged)
    .sort()
    .map((k) => merged[k]);
  if (records.length) {
    mkdirSync(dirname(creditsFile), { recursive: true });
    writeFileSync(creditsFile, JSON.stringify(merged, null, 2), 'utf8');
    writeCredits(records);
    console.log(`\n署名已更新：public/assets/CREDITS.md（共 ${records.length} 条）`);
  }
  rmSync(TMP_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('抓取失败：', err);
  process.exit(1);
});
