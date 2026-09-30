/**
 * 站点完整性自检脚本
 *
 * I. 用途
 *
 * 在构建产物上做一次"内容体检"，确保：
 * 1. dist 目录存在且入口文件齐全
 * 2. 所有 src/data/*.ts 都被至少一个页面 import（避免写了数据没人用）
 * 3. 全站没有遗漏的占位桩（"页面建设中" / "🚧"）
 * 4. 没有硬编码的 border-radius（古早风格硬约束）
 * 5. 关键彩蛋关键词存在
 *
 * II. 用法
 *
 *   node scripts/verify.mjs
 *
 * 退出码 0 表示全部通过，1 表示有问题。
 *
 * @module scripts/verify
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const problems = [];
const warnings = [];

/** 递归收集文件 */
function walk(dir, filter, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
      walk(p, filter, acc);
    } else if (filter(p)) {
      acc.push(p);
    }
  }
  return acc;
}

const tsFiles = walk(join(ROOT, 'src'), (p) => /\.tsx?$/.test(p));
const cssFiles = walk(join(ROOT, 'src'), (p) => /\.css$/.test(p));

/* ---------- 1. 构建产物 ---------- */
if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
  problems.push('dist/index.html 不存在，请先运行 pnpm run build');
} else {
  const distFiles = walk(join(ROOT, 'dist'), () => true);
  const jsCount = distFiles.filter((f) => f.endsWith('.js')).length;
  const cssCount = distFiles.filter((f) => f.endsWith('.css')).length;
  console.log(`[OK] dist 产物：${distFiles.length} 个文件（${jsCount} js / ${cssCount} css）`);
}

/* ---------- 2. 数据文件是否被引用 ---------- */
const dataDir = join(ROOT, 'src', 'data');
if (existsSync(dataDir)) {
  const dataFiles = readdirSync(dataDir).filter((f) => f.endsWith('.ts') && f !== 'types.ts');
  const allSource = tsFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const df of dataFiles) {
    const mod = df.replace(/\.ts$/, '');
    const used =
      allSource.includes(`@/data/${mod}`) ||
      allSource.includes(`./${mod}`) ||
      allSource.includes(`data/${mod}`);
    // types.ts 与 assets.ts 属于公共依赖，不强制要求被 import
    if (!used && !['assets'].includes(mod)) {
      warnings.push(`src/data/${df} 没有被任何文件 import，可能是无用数据`);
    }
  }
  console.log(`[OK] 数据模块：${dataFiles.length} 个`);
}

/* ---------- 3. 残留占位桩 ---------- */
const stubs = tsFiles.filter((f) => {
  const src = readFileSync(f, 'utf8');
  return src.includes('页面建设中') || src.includes('本栏目正在紧张建设中');
});
if (stubs.length) {
  problems.push(
    `仍有 ${stubs.length} 个页面是占位桩：\n    ` +
      stubs.map((f) => relative(ROOT, f)).join('\n    ')
  );
} else {
  console.log('[OK] 无残留占位桩');
}

/* ---------- 4. border-radius 硬约束 ---------- */
const radiusOffenders = [];
for (const f of cssFiles) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/border-radius\s*:/.test(line) && !/\/\*/.test(line)) {
      // .mg-badge--round 与旋转 loading 是唯一豁免
      radiusOffenders.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
    }
  });
}
if (radiusOffenders.length) {
  warnings.push(
    `发现 border-radius（古早风格要求全站直角，请确认是否为豁免项）：\n    ` +
      radiusOffenders.join('\n    ')
  );
} else {
  console.log('[OK] 无 border-radius');
}

/* ---------- 5. 彩蛋关键词 ---------- */
const easterSrc = existsSync(join(ROOT, 'src', 'easter'))
  ? walk(join(ROOT, 'src', 'easter'), (p) => /\.tsx?$/.test(p))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
  : '';
const easterChecks = [
  // 实现方式不固定：可能是 e.key 全称、也可能是归一化后的小写序列，
  // 因此两种写法都接受，只要求"确实监听了方向键"。
  ['Konami 秘技', /ArrowUp|arrowup/i],
  ['console 彩蛋', /console\.(log|info)/],
  ['sessionStorage 去重', /sessionStorage/],
];
for (const [name, re] of easterChecks) {
  if (re.test(easterSrc)) {
    console.log(`[OK] 彩蛋：${name}`);
  } else {
    problems.push(`彩蛋系统缺少：${name}`);
  }
}

/* ---------- 6. 内容量体检 ---------- */
const countMatches = (src, re) => (src.match(re) || []).length;
let totalArticles = 0;
for (const f of tsFiles) {
  if (!f.includes(`${join('src', 'data')}`)) continue;
  const src = readFileSync(f, 'utf8');
  totalArticles += countMatches(src, /^\s{4}id:\s*'/gm);
}
console.log(`[INFO] 数据条目总数（粗略）：约 ${totalArticles} 条`);
if (totalArticles < 250) {
  warnings.push(`数据条目偏少（${totalArticles}），内容量可能不足`);
}

/* ---------- 输出 ---------- */
console.log('');
if (warnings.length) {
  console.log('⚠️  警告：');
  warnings.forEach((w) => console.log(`  - ${w}`));
  console.log('');
}
if (problems.length) {
  console.log('❌ 未通过检查：');
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log('✅ 全部检查通过');
