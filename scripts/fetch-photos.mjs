#!/usr/bin/env node
/**
 * 真实照片抓取器（Wikimedia Commons）
 *
 * I. 这个脚本解决什么问题
 *
 * 1. 顶栏、首页轮播、左右栏横幅、领导活动小图原本是脚本画的几何剪影。矢量徽记与
 *    地图保留矢量更清楚，但"新闻照片位"用剪影会显得像图标，因此换成真实照片。
 * 2. 照片**必须落进仓库**（`public/assets/photos/`），构建过程不联网：
 *    脚本只在人工执行时下载一次，产物随后提交，`pnpm run build` 永远离线可重现。
 *
 * II. 运行模式
 *
 * 1. 默认：为缺失的槽位抓图；已存在的文件跳过，因此重复执行是安全的。
 * 2. `--force`       重新下载（全部，或配合 `--only` 指定槽位）。
 * 3. `--only a,b,c`  只处理列出的槽位。
 * 4. `--candidates`  把候选图拉到临时目录供人工挑选，不写入仓库。
 * 5. `--reindex`     不下载成品图，只把署名补全：对每个"文件在、署名缺"的槽位，
 *                    重新搜索并把候选逐张处理后与仓库里的文件做像素比对，
 *                    命中者即为来源。用于署名清单被误删后的自愈。
 *
 * III. 取图与筛选策略
 *
 * 1. 走 Commons 官方 API 的 `generator=search`，比猜文件名可靠：
 *    搜索 → 取 imageinfo → 按尺寸/长宽比/年份/标题黑名单过滤 → 打分 → 下载最优。
 * 2. 排除 1995 年以前的照片：历史档案照多为黑白或带黑边，与本站红蓝金配色冲突。
 * 3. 每个槽位可以配 `must`（标题必须命中的关键词），否则搜索容易飘到无关题材。
 *
 * IV. 体积与裁切
 *
 * 1. 缩放与重编码交给 Python 的 Pillow（本机已装）。JPEG q82 + 渐进式，
 *    全部照片控制在 3 MB 上下，远低于 8 MB 上限。
 * 2. 一律先按目标长宽比裁切再缩放；`anchor` 控制裁切窗口落在原图的哪个位置，
 *    用于保住构图主体（如顶栏右图要留住火炬与头部）。
 *
 * @module scripts/fetch-photos
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
const REINDEX = argv.includes('--reindex');
const ONLY = (() => {
  const i = argv.indexOf('--only');
  return i >= 0 && argv[i + 1] ? argv[i + 1].split(',').map((s) => s.trim()).filter(Boolean) : null;
})();

/* ================= I. 槽位定义 ================= */

/**
 * 每个槽位描述"要什么图、裁成什么比例、多宽"
 *
 * ratio 为宽/高。anchor 是裁切窗口在原图里的锚点（0=左/上，0.5=居中，1=右/下），
 * 用来在"原图比例与目标比例不一致"时保住主体。
 */
const SLOTS = {
  /* --- 顶栏：Lead 的顶栏结构直接消费这 3 个 key --- */
  'header-capitol': {
    ratio: 680 / 264,
    width: 680,
    orientation: 'landscape',
    // 参考图左侧是"前景大幅星条旗 + 背景国会山"，纯建筑照不够有辨识度
    q: [
      'American flag United States Capitol background',
      'Capitol Hill American flag foreground',
      'flag pole United States Capitol Washington',
      'United States Capitol American flag',
      'Close up of American Flag Waving',
    ],
    anchor: [0.4, 0.5],
  },
  'header-liberty': {
    ratio: 560 / 352,
    width: 560,
    orientation: 'any',
    // 允许竖构图：顶栏这条窄横带只要留住"头冠 + 火炬"就足以辨认，基座可以裁掉
    arRange: [0.6, 2.2],
    q: ['Statue of Liberty front view', 'Statue of Liberty torch', 'Statue of Liberty National Monument statue', 'Liberty Enlightening the World'],
    anchor: [0.5, 0.14],
  },
  'presidential-seal': {
    ratio: 1,
    width: 512,
    orientation: 'any',
    q: ['Seal of the President of the United States'],
    format: 'png',
    allowSvg: true,
    ignoreTitleBlock: true,
    minYear: 0,
    anchor: [0.5, 0.5],
  },

  /* --- 首页轮播 --- */
  'hero-1': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Donald Trump rally podium', 'Trump campaign rally speech podium'] },
  'hero-2': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['United States Capitol west front', 'United States Capitol building'] },
  'hero-3': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['White House north facade', 'White House Washington exterior', 'White House north lawn'] },
  'hero-4': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Donald Trump rally crowd audience', 'Trump rally supporters crowd wide'] },
  'hero-5': { ratio: 16 / 9, width: 1400, orientation: 'landscape', q: ['Trump signing executive order', 'bill signing ceremony White House'] },
  'trump-portrait': { ratio: 1, width: 1000, orientation: 'any', q: ['Donald Trump official portrait', 'Donald Trump portrait photograph'] },
  'veterans': { ratio: 16 / 9, width: 1200, orientation: 'landscape', q: ['US military veteran saluting flag', 'American veteran soldier flag'] },
  'desert': {
    ratio: 16 / 9,
    width: 1200,
    orientation: 'landscape',
    q: ['desert highway road Arizona', 'Route 66 road desert', 'Mojave desert highway'],
    must: /(road|highway|route ?66|freeway|interstate|street)/i,
  },
  'press-1': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Donald Trump Oval Office meeting', 'Donald Trump cabinet meeting White House'] },
  'press-2': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Trump handshake leader', 'presidential handshake White House'] },
  'press-3': { ratio: 3 / 2, width: 600, orientation: 'landscape', q: ['Donald Trump press conference White House', 'White House press briefing podium'] },
};

/**
 * 人工挑选后的固定选片
 *
 * 由 `--candidates` 拉候选、人工比对后回填。钉死后脚本不再依赖搜索排序，
 * 保证任何人任何时间重跑都得到同一张图。
 */
const SELECTION = {
  // 顶栏左图：Commons 上"前景大旗 + 背景国会山"同框的自由许可照片基本不存在，
  // 搜到的同框图几乎全是冲击国会山/抗议题材，不适合本站基调，故按 Lead 认可的
  // 备选方案改用大幅旗面特写——在 340×132 的小尺寸下反而比建筑更醒目。
  'header-capitol': [{ title: 'Close up of American Flag Waving.jpg' }],
  // 人工比对后钉死：完整女神像 + 蓝天，头冠与火炬都不出画
  'header-liberty': [{ title: 'Statue of Liberty National Monument.JPG' }],
  // 用官方 SVG 让 Commons 渲染成透明 PNG：比翻拍照片更锐利，体积也只有三分之一
  'presidential-seal': [{ title: 'Seal of the President of the United States.svg' }],
  // 集会轮播：必须是真的集会人海。搜索容易被个别参会者的特写带偏，故钉死
  'hero-4': [{ title: 'Trump Rally Sheriff Joe Arpaio in crowd, Prescott Valley, Arizona.jpg' }],
};

/* ================= II. Commons 访问 ================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 标题黑名单
 *
 * 1. 非照片类媒体（地图、图表、徽章、版画）混进来会很难看；
 * 2. 群体性冲突事件（冲击国会山、骚乱、抗议）必须排除：本站是善意的官僚系统
 *    调侃，用这类新闻照片既不合基调，也不尊重当事人。
 *
 * 注意不要把 statue / monument 这类词列进来：自由女神本身就是雕像，
 * 关键词一进黑名单会把整个题材的候选全部误杀。
 */
const TITLE_BLOCK = /(map|diagram|logo|coat[_ ]of[_ ]arms|chart|graph|poster|screenshot|icon|\.svg|signature|plaque|stamp|banknote|cartoon|drawing|engraving|lithograph|lccn|storming|stormed|protest|rioter|riot|insurrection|demonstration|tear[_ ]?gas|half[_ ]?mast|mob|20210106)/i;

/** 照片最早年份：历史档案照多为黑白或带黑边，与本站配色不搭 */
const MIN_YEAR = 1995;

/**
 * 搜索 Commons 文件命名空间
 *
 * @param query - 英文关键词
 * @param limit - 返回候选数
 * @returns 候选页面数组
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
function toCandidate(page, wantWidth = 1600) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const em = info.extmetadata ?? {};
  const strip = (html) => String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const rawDate = strip(em.DateTimeOriginal?.value);
  const ym = /(1[89]\d{2}|20\d{2})/.exec(rawDate);
  const title = page.title.replace(/^File:/, '');
  // SVG 走 iiurlwidth 时 thumburl 是服务器渲染好的 PNG，正好省掉本地栅格化
  const thumburl =
    info.thumburl ||
    (info.mime === 'image/svg+xml'
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=${wantWidth}`
      : info.url);
  return {
    title,
    thumburl,
    width: info.width,
    height: info.height,
    mime: info.mime,
    year: ym ? Number(ym[1]) : null,
    author: strip(em.Artist?.value) || '未署名',
    license: strip(em.LicenseShortName?.value) || '见来源页',
    licenseUrl: em.LicenseUrl?.value || '',
    descriptionUrl:
      info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`,
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
  const okMime = slot.allowSvg ? /^image\/(jpeg|png|svg\+xml)$/ : /^image\/(jpeg|png)$/;
  if (!okMime.test(cand.mime ?? '')) return -1;
  if (!cand.width || !cand.height) return -1;
  if (cand.width < 900) return -1;
  if (!slot.ignoreTitleBlock && TITLE_BLOCK.test(cand.title)) return -1;
  const minYear = slot.minYear ?? MIN_YEAR;
  if (minYear && cand.year && cand.year < minYear) return -1;
  if (slot.must && !slot.must.test(cand.title)) return -1;

  const ar = cand.width / cand.height;
  if (slot.orientation === 'landscape' && ar < 1.25) return -1;
  if (slot.orientation === 'portrait' && ar > 0.9) return -1;
  const [arMin, arMax] = slot.arRange ?? [0.55, 2.6];
  if (ar > arMax || ar < arMin) return -1;

  let s = 0;
  s += Math.min(cand.width, 4000) / 1000;
  s += 3 / (1 + Math.abs(ar - slot.ratio) * 4);
  for (const w of slot.q.join(' ').toLowerCase().split(/\s+/)) {
    if (w.length > 3 && cand.title.toLowerCase().includes(w)) s += 0.8;
  }
  return s;
}

/** 候选的下载直链；`SELECTION` 里只钉了标题时按标题拼 Special:FilePath */
function pickUrl(pick, width) {
  if (pick.thumburl) return pick.thumburl;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(pick.title)}?width=${width}`;
}

/**
 * 按标题补全署名元数据
 *
 * 人工钉死的选片往往只有文件名，署名三件套（作者/许可/来源页）要现查一次。
 *
 * @returns 补全后的候选，查询失败时原样返回
 */
async function hydrateByTitle(pick) {
  if (pick.author && pick.descriptionUrl) return pick;
  try {
    const url = `${API}?action=query&titles=File:${encodeURIComponent(pick.title)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1600&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const json = await res.json();
    const page = Object.values(json.query?.pages ?? {})[0];
    const fresh = page ? toCandidate(page) : null;
    return fresh ? { ...fresh, ...pick } : pick;
  } catch {
    return pick;
  }
}

/** 下载二进制并写入文件 */
async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000) throw new Error(`文件过小（${buf.length} B），可能不是图片`);
  writeFileSync(dest, buf);
  return buf.length;
}

/* ================= III. 图像处理（Pillow） ================= */

/**
 * 带锚点裁切到目标比例、缩放、重编码为 JPEG
 *
 * 直接调用 python3 + Pillow：项目禁止新增 npm 依赖，而 Node 侧没有任何可用的
 * 图像编解码能力（sharp 属新依赖，不可引入）。
 *
 * @returns 输出体积（字节）
 */
function processJpeg(src, dst, width, ratio, quality = 82, anchor = [0.5, 0.5]) {
  const py = `
import sys, os
from PIL import Image, ImageOps
src, dst, width, ratio, quality, ax, ay = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7])
im = Image.open(src)
im = ImageOps.exif_transpose(im)
im = im.convert('RGB')
w, h = im.size
if w / h > ratio:
    nw = min(w, max(1, int(round(h * ratio))))
    left = int(round((w - nw) * ax))
    im = im.crop((left, 0, left + nw, h))
else:
    nh = min(h, max(1, int(round(w / ratio))))
    top = int(round((h - nh) * ay))
    im = im.crop((0, top, w, top + nh))
im = im.resize((width, int(round(width / ratio))), Image.LANCZOS)
im.save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)
print(os.path.getsize(dst))
`;
  return Number(
    execFileSync(
      'python3',
      ['-c', py, src, dst, String(width), String(ratio), String(quality), String(anchor[0]), String(anchor[1])],
      { encoding: 'utf8' }
    ).trim()
  );
}

/**
 * 处理成方形透明 PNG（总统徽记用）
 *
 * 两种来源都要能处理：
 * 1. SVG 渲染结果 —— 自带透明通道，按内容外接框裁成方形即可；
 * 2. JPG / 白底 PNG —— 先按"墨迹"外接框裁出徽记，再套圆形蒙版抠掉四角白底。
 * 不能简单地"把白色变透明"：徽记内部本身有大量白色（鹰头、羽毛），那样会把图案挖空。
 *
 * @returns 输出体积（字节）
 */
function processPng(src, dst, size) {
  const py = `
import sys, os
from PIL import Image, ImageOps, ImageDraw
src, dst, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src)
im = ImageOps.exif_transpose(im).convert('RGBA')
w, h = im.size
# 内容外接框：透明像素与近白像素都算背景
a = im.getchannel('A')
lum = im.convert('L')
ink = Image.new('L', (w, h), 0)
ink.paste(Image.new('L', (w, h), 255), (0, 0, w, h), a.point(lambda v: 255 if v < 250 else 0))
inv = lum.point(lambda v: 255 if v < 242 else 0)
ink = Image.composite(Image.new('L', (w, h), 255), ink, inv)
box = ink.getbbox()
if box:
    l, t, r, b = box
    side = max(r - l, b - t)
    cx, cy = (l + r) / 2.0, (t + b) / 2.0
    l2, t2 = int(round(cx - side / 2.0)), int(round(cy - side / 2.0))
    im = im.crop((l2, t2, l2 + side, t2 + side))
else:
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
im = im.resize((size, size), Image.LANCZOS)
# 圆形蒙版（4 倍超采样抗锯齿），保证四角干净透明
mask = Image.new('L', (size * 4, size * 4), 0)
ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
im.putalpha(mask.resize((size, size), Image.LANCZOS))
im.save(dst, 'PNG', optimize=True)
print(os.path.getsize(dst))
`;
  return Number(execFileSync('python3', ['-c', py, src, dst, String(size)], { encoding: 'utf8' }).trim());
}

/** 两张图是否同源：统一降采样后比较平均绝对差（0-255，越小越像） */
function compareImages(a, b) {
  const py = `
import sys
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert('L').resize((64, 64))
b = Image.open(sys.argv[2]).convert('L').resize((64, 64))
diff = ImageChops.difference(a, b)
print(sum(i * n for i, n in enumerate(diff.histogram())) / (64 * 64))
`;
  return Number(execFileSync('python3', ['-c', py, a, b], { encoding: 'utf8' }).trim());
}

/* ================= IV. 抓取流程 ================= */

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
      const c = toCandidate(page, cfg.width);
      if (!c || seen.has(c.title)) continue;
      seen.add(c.title);
      const s = score(c, cfg);
      if (s > 0) all.push({ ...c, score: s });
    }
    await sleep(350); // 对 Commons 保持礼貌的请求间隔
  }
  return all.sort((a, b) => b.score - a.score);
}

/** 槽位对应的输出文件名 */
const outName = (slot) => `${slot}.${SLOTS[slot].format === 'png' ? 'png' : 'jpg'}`;

/** 把一个候选落成仓库里的成品图 */
async function materialize(slot, cand, dest) {
  const cfg = SLOTS[slot];
  const raw = join(TMP_DIR, `${slot}.raw`);
  await download(pickUrl(cand, cfg.width), raw);
  const size =
    cfg.format === 'png'
      ? processPng(raw, dest, cfg.width)
      : processJpeg(raw, dest, cfg.width, cfg.ratio, 82, cfg.anchor ?? [0.5, 0.5]);
  return {
    ...cand,
    output: outName(slot),
    width: cfg.width,
    height: Math.round(cfg.width / cfg.ratio),
    bytes: size,
  };
}

/** 下载并处理单个槽位 */
async function fetchSlot(slot) {
  const dest = join(OUT_DIR, outName(slot));
  if (existsSync(dest) && !FORCE) {
    console.log(`  · ${outName(slot)} 已存在，跳过（--force 可强制重下）`);
    return null;
  }
  const pinned = SELECTION[slot] ?? [];
  const picks = pinned.length ? await Promise.all(pinned.map(hydrateByTitle)) : await gather(slot);
  if (!picks.length) {
    console.warn(`  ! ${slot}：没有找到合格候选，保留原文件`);
    return null;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const pick of picks.slice(0, 8)) {
    try {
      const rec = await materialize(slot, pick, dest);
      console.log(`  ✓ ${rec.output}  ${rec.width}×${rec.height}  ${(rec.bytes / 1024).toFixed(0)} KB  ← ${pick.title}`);
      return rec;
    } catch (err) {
      console.warn(`  ! ${slot}：候选「${pick.title}」失败（${err.message}），换下一个`);
    }
    await sleep(300);
  }
  console.warn(`  ! ${slot}：所有候选都失败`);
  return null;
}

/**
 * 署名自愈：文件在、署名缺时，反向识别来源
 *
 * 把候选逐张按同样参数处理，再与仓库里的成品做像素比对，最接近的那张就是来源。
 * 完全一致时差值通常 < 1，不同图普遍 > 15，阈值取 6 足够安全。
 *
 * @returns 识别出的署名记录，或 null
 */
async function identify(slot) {
  const cfg = SLOTS[slot];
  const dest = join(OUT_DIR, outName(slot));
  if (!existsSync(dest)) return null;
  const picks = await gather(slot);
  let best = null;
  for (const cand of picks.slice(0, 10)) {
    const ext = cfg.format === 'png' ? 'png' : 'jpg';
    const probe = join(TMP_DIR, `${slot}.probe.${ext}`);
    try {
      await download(cand.thumburl, probe);
      if (cfg.format === 'png') processPng(probe, probe, cfg.width);
      else processJpeg(probe, probe, cfg.width, cfg.ratio, 82, cfg.anchor ?? [0.5, 0.5]);
      const diff = compareImages(dest, probe);
      if (!best || diff < best.diff) best = { cand, diff };
      if (diff < 0.5) break; // 像素级一致，不必再试
    } catch {
      /* 单个候选失败不影响识别 */
    }
    await sleep(200);
  }
  if (!best || best.diff > 6) {
    console.warn(`  ? ${slot}：无法可靠识别来源（最佳差值 ${best ? best.diff.toFixed(2) : 'n/a'}）`);
    return null;
  }
  console.log(`  ✓ ${slot} 来源已识别（差值 ${best.diff.toFixed(2)}）：${best.cand.title}`);
  return {
    ...best.cand,
    output: outName(slot),
    width: cfg.width,
    height: Math.round(cfg.width / cfg.ratio),
    bytes: statSync(dest).size,
  };
}

/** 把候选图拉到临时目录供人工挑选 */
async function dumpCandidates() {
  // 不带 --only 时清空重来；带 --only 时保留已有候选，方便逐槽位分批挑图
  if (!ONLY) rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  const slots = ONLY ?? Object.keys(SLOTS);
  for (const slot of slots) {
    const cfg = SLOTS[slot];
    const list = await gather(slot);
    console.log(`\n${slot}（${list.length} 个候选）`);
    for (let i = 0; i < Math.min(list.length, 8); i++) {
      const c = list[i];
      const ext = cfg.format === 'png' ? 'png' : 'jpg';
      const dest = join(TMP_DIR, `${slot}__${String(i).padStart(2, '0')}.${ext}`);
      try {
        await download(c.thumburl, dest);
        if (cfg.format === 'png') processPng(dest, dest, 256);
        else processJpeg(dest, dest, Math.min(cfg.width, 900), cfg.ratio, 82, cfg.anchor ?? [0.5, 0.5]);
        console.log(`  [${i}] ${c.title}  (${c.width}×${c.height}, ${c.year ?? '?'}, ${c.license})`);
      } catch (err) {
        console.log(`  [${i}] ${c.title}  失败：${err.message}`);
      }
      await sleep(300);
    }
  }
  console.log(`\n候选图已写到 ${TMP_DIR}`);
}

/** 生成署名清单 */
function writeCredits(records) {
  const lines = [
    '# 照片署名（Photo Credits）',
    '',
    '本站顶栏、首页轮播、左右栏横幅与领导活动小图使用了 Wikimedia Commons 上的真实照片',
    '（均为公有领域或自由许可）。以下逐条列出来源页面、作者与许可协议，供查阅与合规引用。',
    '',
    '> 其余徽记、地图、二维码中的图形仍为站内自绘矢量图（`public/assets/*.svg`），不在此列。',
    '> `presidential-seal.png` 为美国政府职务作品，依 17 U.S.C. §105 属公有领域。',
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
  const slots = ONLY ?? Object.keys(SLOTS);
  const creditsFile = join(OUT_DIR, 'credits.json');
  const previous = existsSync(creditsFile) ? JSON.parse(String(readFileSync(creditsFile, 'utf8'))) : {};

  // I. 署名自愈模式：只补署名，不碰成品图
  if (REINDEX) {
    console.log(`补全署名：${slots.length} 个槽位\n`);
    const merged = { ...previous };
    for (const slot of slots) {
      if (merged[slot]) {
        console.log(`  · ${slot} 已有署名，跳过`);
        continue;
      }
      const rec = await identify(slot);
      if (rec) merged[slot] = rec;
    }
    writeFileSync(creditsFile, JSON.stringify(merged, null, 2), 'utf8');
    const records = Object.keys(merged).sort().map((k) => merged[k]);
    writeCredits(records);
    console.log(`\n署名已更新：public/assets/CREDITS.md（共 ${records.length} 条）`);
    rmSync(TMP_DIR, { recursive: true, force: true });
    return;
  }

  // II. 常规抓取：以已有记录为底，只覆盖本次处理过的槽位，局部重跑不会丢署名
  console.log(`抓取照片：${slots.length} 个槽位${FORCE ? '（--force 强制重下）' : ''}\n`);
  const merged = { ...previous };
  for (const slot of slots) {
    const rec = await fetchSlot(slot);
    if (rec) merged[slot] = rec;
    else if (!merged[slot]) console.warn(`  ! ${slot}：无记录可写入署名（可用 --reindex 自愈）`);
  }
  const records = Object.keys(merged).sort().map((k) => merged[k]);
  if (records.length) {
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
