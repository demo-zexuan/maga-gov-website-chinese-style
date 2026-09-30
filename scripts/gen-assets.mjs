#!/usr/bin/env node
/**
 * 站内矢量素材生成器（零依赖、离线可重现）
 *
 * I. 这个脚本干什么
 *
 * 1. 生成 `public/assets/` 下的**矢量**素材：二维码、地图、三个徽记。
 * 2. 生成过程不联网、不读取外部图片、不引入任何 npm 依赖，只写 SVG 文本，
 *    因此构建是可离线重现的（同一份脚本永远产出逐字节相同的文件）。
 *
 * II. 关于照片位
 *
 * 1. 首页轮播、左右栏横幅、领导活动小图已改用真实新闻照片，由
 *    `scripts/fetch-photos.mjs` 抓取到 `public/assets/photos/`。
 *    本脚本**默认不再输出**这些槽位的同名 SVG，以免将来误覆盖照片。
 * 2. 那些场景画法（演讲台 / 国会山 / 白宫 / 集会 / 签令 / 人像 / 退伍军人 / 沙漠 /
 *    领导活动小图）仍完整保留在本文件里，作为断网时的兜底素材：
 *    加 `--with-fallback-svg` 会把它们输出到 `public/assets/fallback/` 子目录，
 *    与照片互不干扰。
 *
 * III. 输出的矢量素材
 *
 * 1. app-qr           —— 真正可扫描的二维码，内容为 USPCS-1776-2026
 * 2. us-map           —— 本土 48 州轮廓图
 * 3. eagle-emblem / elephant-emblem / seal —— 三个徽记
 *
 * IV. 风格约定
 *
 * 1. 平涂色块 + 粗描边 + 高饱和红/蓝/金/白，几何化剪影，刻意"土味矢量"，
 *    与 `src/components/art/index.tsx` 的内联 SVG 保持同一气质。
 * 2. 场景图一律给 `preserveAspectRatio="xMidYMid slice"`，并留出上下各 15% 的
 *    出血区：这样放进任意比例的容器里都自动"填充裁切"，不会变形、不会露白。
 * 3. SVG 内部不写中文。图片作为 `<img>` 引入时用的是浏览器的系统字体，
 *    中文缺字会变成方块；所有中文文案由页面 HTML 浮层承担。
 *
 * V. 二维码实现
 *
 * 1. 脚本内置一个最小但完整的 QR 编码器：字节层面手写 GF(256) 有限域、
 *    Reed-Solomon 纠错、矩阵布点、8 种掩模与惩罚打分，全部按 ISO/IEC 18004 实现。
 * 2. 只用字母数字模式（alphanumeric），容量足够放 17 个字符，
 *    最终通常落在版本 1、纠错等级 L —— 版本越低模块越大，越好扫。
 * 3. 输出保留 4 个模块的静默区，不叠加任何装饰（边框、文字、水印都会降低识别率）。
 *
 * @module scripts/gen-assets
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ================= I. 基础工具 ================= */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'assets');

/** 全站统一色板（与 src/styles/tokens.css 的同名色值保持一致） */
const C = {
  red: '#bd0000',
  redDeep: '#8b0000',
  redBright: '#d5232b',
  redFlag: '#b31942',
  navy: '#0d2a52',
  navyMid: '#1c4b8a',
  navyLight: '#2b6cb0',
  navyPale: '#123a72',
  gold: '#f5c542',
  goldLight: '#ffe9a3',
  goldDark: '#a87d0a',
  white: '#ffffff',
  offWhite: '#eef2f7',
  silver: '#c9d4e2',
  ink: '#071a34',
  dark: '#0b1d33',
  black: '#040d1a',
  canton: '#0a3161',
};

/** 数值统一保留两位小数，避免生成文件里出现一长串浮点噪声 */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * 确定性伪随机数（mulberry32）
 *
 * 素材里的星空、人群等"随机"分布必须每次生成都一致，否则 git 会反复出现无意义 diff。
 *
 * @param seed - 任意整数种子
 * @returns 返回 [0,1) 的随机数函数
 */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 生成五角星（或任意角星）的路径
 *
 * @param cx - 中心 x
 * @param cy - 中心 y
 * @param outer - 外接半径
 * @param inner - 内接半径，默认按正五角星比例 0.382
 * @returns path 的 d 属性字符串
 */
function starPath(cx, cy, outer, inner = outer * 0.382) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? outer : inner;
    pts.push(`${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr)}`);
  }
  return `M${pts.join('L')}Z`;
}

/**
 * 放射光束背景
 *
 * @param cx - 光心 x
 * @param cy - 光心 y
 * @param radius - 光束长度
 * @param count - 光束数量（建议偶数）
 * @param color - 光束颜色
 * @param opacity - 单束透明度，默认 0.08
 * @returns 一组 <path> 字符串
 */
function sunburst(cx, cy, radius, count, color, opacity = 0.08, phase = 0) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a0 = phase + (i / count) * Math.PI * 2;
    const a1 = a0 + Math.PI / count;
    out +=
      `<path d="M${cx} ${cy}L${r2(cx + Math.cos(a0) * radius)} ${r2(cy + Math.sin(a0) * radius)}` +
      `L${r2(cx + Math.cos(a1) * radius)} ${r2(cy + Math.sin(a1) * radius)}Z"` +
      ` fill="${color}" opacity="${opacity}"/>`;
  }
  return out;
}

/**
 * 简化星条旗图形组
 *
 * 坐标原点在旗面左上角，返回 0..w × 0..h 范围内的绘制内容，
 * 外层用 <g transform> 摆放即可。
 *
 * @param w - 旗面宽
 * @param h - 旗面高
 * @returns SVG 片段
 */
function usFlag(w, h) {
  const sh = h / 13;
  let out = '';
  for (let i = 0; i < 13; i++) {
    out += `<rect x="0" y="${r2(i * sh)}" width="${w}" height="${r2(sh + 0.05)}" fill="${i % 2 === 0 ? C.redFlag : C.white}"/>`;
  }
  const cw = w * 0.4;
  const ch = sh * 7;
  out += `<rect x="0" y="0" width="${r2(cw)}" height="${r2(ch)}" fill="${C.canton}"/>`;
  const sr = Math.min(cw / 15, ch / 13);
  for (let row = 0; row < 5; row++) {
    const n = row % 2 === 0 ? 6 : 5;
    for (let c = 0; c < n; c++) {
      const x = (cw / 12) * (2 * c + 1) + (row % 2 ? cw / 12 : 0);
      const y = (ch / 10) * (2 * row + 1);
      out += `<path d="${starPath(x, y, sr)}" fill="${C.white}"/>`;
    }
  }
  out += `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${C.silver}" stroke-width="1.2"/>`;
  return out;
}

/**
 * 旗杆 + 旗面（场景图装饰用）
 *
 * @param px - 旗杆 x
 * @param py - 旗面顶端 y
 * @param poleH - 旗杆长度
 * @param fw - 旗面宽
 * @param fh - 旗面高
 * @param tilt - 旗面倾斜角度
 * @param flip - true 时旗面向左展开
 * @returns SVG 片段
 */
function flagOnPole(px, py, poleH, fw, fh, tilt = 0, flip = false) {
  let out = `<rect x="${r2(px - 3)}" y="${r2(py - 14)}" width="6" height="${r2(poleH)}" fill="${C.gold}"/>`;
  out += `<circle cx="${px}" cy="${r2(py - 22)}" r="9" fill="${C.goldLight}" stroke="${C.goldDark}" stroke-width="2"/>`;
  const t = flip
    ? `translate(${r2(px - 2)} ${py}) scale(-1 1) rotate(${tilt})`
    : `translate(${r2(px + 2)} ${py}) rotate(${tilt})`;
  out += `<g transform="${t}">${usFlag(fw, fh)}</g>`;
  return out;
}

/**
 * 一排观众 / 人群剪影
 *
 * @param rng - 确定性随机函数
 * @param y - 头部中心基准 y
 * @param count - 人数
 * @param r0 - 头部最小半径
 * @param r1 - 头部最大半径
 * @param color - 剪影颜色
 * @returns SVG 片段
 */
function crowdRow(rng, y, count, r0, r1, color) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = -50 + (1060 * (i + 0.5)) / count + (rng() - 0.5) * 14;
    const r = r0 + rng() * (r1 - r0);
    const cy = y + (rng() - 0.5) * 8;
    out += `<circle cx="${r2(x)}" cy="${r2(cy)}" r="${r2(r)}" fill="${color}"/>`;
    out +=
      `<path d="M${r2(x - r * 1.4)} ${r2(cy + r * 4)}` +
      `C${r2(x - r * 1.35)} ${r2(cy + r * 0.9)} ${r2(x - r * 0.8)} ${r2(cy + r * 0.82)} ${r2(x)} ${r2(cy + r * 0.82)}` +
      `C${r2(x + r * 0.8)} ${r2(cy + r * 0.82)} ${r2(x + r * 1.35)} ${r2(cy + r * 0.9)} ${r2(x + r * 1.4)} ${r2(cy + r * 4)}Z"` +
      ` fill="${color}"/>`;
  }
  return out;
}

/**
 * 手持标语牌
 *
 * @param x - 牌面中心 x
 * @param y - 牌面中心 y
 * @param w - 牌宽
 * @param h - 牌高
 * @param rot - 旋转角度
 * @param stickTo - 杆子下端 y
 * @returns SVG 片段
 */
function placard(x, y, w, h, rot, stickTo) {
  let out = `<g transform="rotate(${rot} ${r2(x)} ${r2(y)})">`;
  out += `<rect x="${r2(x - 3)}" y="${r2(y)}" width="6" height="${r2(stickTo - y)}" fill="${C.goldDark}"/>`;
  out += `<rect x="${r2(x - w / 2)}" y="${r2(y - h / 2)}" width="${w}" height="${h}" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  out += `<rect x="${r2(x - w / 2 + 8)}" y="${r2(y - h / 2 + 9)}" width="${r2(w - 16)}" height="7" fill="${C.red}"/>`;
  out += `<rect x="${r2(x - w / 2 + 8)}" y="${r2(y - h / 2 + 21)}" width="${r2((w - 16) * 0.66)}" height="7" fill="${C.navyLight}"/>`;
  out += `</g>`;
  return out;
}

/* ================= II. 二维码编码器 ================= */

/** 字母数字模式可用字符表（索引即编码值） */
const QR_ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * 各版本参数（纠错等级 L）
 *
 * L 级在版本 1-5 都是"单块"，无需处理分块交织，因此这张表就是完整规格。
 * size 为边长，data/ec 分别为数据码字与纠错码字数。
 */
const QR_SPEC = {
  1: { size: 21, data: 19, ec: 7, align: [] },
  2: { size: 25, data: 34, ec: 10, align: [6, 18] },
  3: { size: 29, data: 55, ec: 15, align: [6, 22] },
  4: { size: 33, data: 80, ec: 20, align: [6, 26] },
  5: { size: 37, data: 108, ec: 26, align: [6, 30] },
};

/** GF(256) 指数 / 对数表，本原多项式 0x11d */
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

/** 有限域乘法 */
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);

/**
 * 计算 Reed-Solomon 生成多项式
 *
 * @param degree - 纠错码字数
 * @returns 系数数组，最高次在前，长度 degree + 1
 */
function rsGenPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/**
 * 计算纠错码字（多项式除法取余）
 *
 * @param data - 数据码字
 * @param ecLen - 需要的纠错码字数
 * @returns 纠错码字
 */
function rsEncode(data, ecLen) {
  const gen = rsGenPoly(ecLen);
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return Array.from(res);
}

/** 位缓冲：按位追加，最后打包成字节 */
class BitBuffer {
  constructor() {
    this.bits = [];
  }

  /** 追加 value 的低 len 位（高位在前） */
  push(value, len) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }

  get length() {
    return this.bits.length;
  }

  /** 按 8 位打包成字节数组，不足补零 */
  toBytes() {
    const bytes = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] || 0);
      bytes.push(b);
    }
    return bytes;
  }
}

/**
 * 字母数字模式编码为数据码字
 *
 * @param text - 待编码文本（必须全部落在 QR_ALNUM 里）
 * @param spec - 版本规格
 * @returns 数据码字数组，长度等于 spec.data
 */
function qrEncodeAlnum(text, spec) {
  const buf = new BitBuffer();
  // I. 模式指示符与字符计数（版本 1-9 的字母数字模式计数为 9 位）
  buf.push(0b0010, 4);
  buf.push(text.length, 9);

  // II. 两字符一组打包成 11 位，落单字符占 6 位
  for (let i = 0; i + 1 < text.length; i += 2) {
    buf.push(QR_ALNUM.indexOf(text[i]) * 45 + QR_ALNUM.indexOf(text[i + 1]), 11);
  }
  if (text.length % 2 === 1) buf.push(QR_ALNUM.indexOf(text[text.length - 1]), 6);

  // III. 终止符 + 补零到字节边界
  const capacity = spec.data * 8;
  buf.push(0, Math.min(4, Math.max(0, capacity - buf.length)));
  while (buf.length % 8 !== 0) buf.push(0, 1);

  // IV. 交替填充 0xEC / 0x11 直到填满数据容量
  const bytes = buf.toBytes();
  const pad = [0xec, 0x11];
  let k = 0;
  while (bytes.length < spec.data) bytes.push(pad[k++ % 2]);
  return bytes;
}

/** 按掩模编号判断 (row, col) 是否翻转 */
function qrMaskBit(mask, row, col) {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

/**
 * 构建功能图形层（定位、分隔、定时、校正、格式信息）
 *
 * @param version - 版本号
 * @param mask - 掩模编号（决定格式信息的具体取值）
 * @returns { modules, isFunction } 矩阵与功能图形掩码表
 */
function qrBaseMatrix(version, mask) {
  const spec = QR_SPEC[version];
  const size = spec.size;
  const modules = Array.from({ length: size }, () => new Array(size).fill(0));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (row, col, dark) => {
    modules[row][col] = dark ? 1 : 0;
    isFunction[row][col] = true;
  };

  // I. 三个定位图形（含各自的分隔符）
  const drawFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        // 切比雪夫距离 3 为外圈、2 为白环、0/1 为核心，其余为浅色
        set(rr, cc, inside && Math.max(Math.abs(r - 3), Math.abs(c - 3)) !== 2);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // II. 定时图形：第 6 行与第 6 列交替黑白
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // III. 校正图形：与三个定位图形重叠的角要跳过
  for (const r of spec.align) {
    for (const c of spec.align) {
      const corners = [
        [6, 6],
        [6, size - 7],
        [size - 7, 6],
      ];
      if (corners.some(([cr, cc]) => cr === r && cc === c)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // IV. 格式信息（15 位 BCH + 固定掩码 0x5412），两份冗余副本
  const data = (0b01 << 3) | mask; // 0b01 即纠错等级 L
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i) => (bits >>> i) & 1;

  for (let i = 0; i <= 5; i++) set(i, 8, bit(i) === 1);
  set(7, 8, bit(6) === 1);
  set(8, 8, bit(7) === 1);
  set(8, 7, bit(8) === 1);
  for (let i = 9; i < 15; i++) set(8, 14 - i, bit(i) === 1);
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, bit(i) === 1);
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, bit(i) === 1);
  set(size - 8, 8, true); // 固定深色模块

  return { modules, isFunction };
}

/**
 * 按标准蛇形走线把码字铺进矩阵
 *
 * @param modules - 矩阵
 * @param isFunction - 功能图形掩码表
 * @param version - 版本号
 * @param codewords - 数据码字 + 纠错码字
 */
function qrPlaceData(modules, isFunction, version, codewords) {
  const size = QR_SPEC[version].size;
  const totalBits = codewords.length * 8;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // 第 6 列是纵向定时图形，跳过
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (!isFunction[row][col] && i < totalBits) {
          modules[row][col] = (codewords[i >>> 3] >>> (7 - (i & 7))) & 1;
          i++;
        }
      }
    }
  }
}

/**
 * 掩模惩罚打分（ISO/IEC 18004 四条规则）
 *
 * @param modules - 已套用掩模的矩阵
 * @param size - 边长
 * @returns 惩罚分，越低越好
 */
function qrPenalty(modules, size) {
  let score = 0;

  // I. 规则 1：同行/同列连续 5 个及以上同色模块
  const runScore = (get) => {
    let s = 0;
    let run = 1;
    for (let i = 1; i < size; i++) {
      if (get(i) === get(i - 1)) run++;
      else {
        if (run >= 5) s += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) s += 3 + (run - 5);
    return s;
  };
  for (let row = 0; row < size; row++) score += runScore((c) => modules[row][c]);
  for (let col = 0; col < size; col++) score += runScore((r) => modules[r][col]);

  // II. 规则 2：2×2 同色方块
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const v = modules[row][col];
      if (v === modules[row][col + 1] && v === modules[row + 1][col] && v === modules[row + 1][col + 1]) score += 3;
    }
  }

  // III. 规则 3：形如 1:1:3:1:1 的类定位图形
  const PAT_A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const PAT_B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const hit = (arr, i, pat) => pat.every((v, k) => arr[i + k] === v);
  for (let row = 0; row < size; row++) {
    const arr = Array.from({ length: size }, (_, c) => modules[row][c]);
    for (let i = 0; i + 11 <= size; i++) if (hit(arr, i, PAT_A) || hit(arr, i, PAT_B)) score += 40;
  }
  for (let col = 0; col < size; col++) {
    const arr = Array.from({ length: size }, (_, r) => modules[r][col]);
    for (let i = 0; i + 11 <= size; i++) if (hit(arr, i, PAT_A) || hit(arr, i, PAT_B)) score += 40;
  }

  // IV. 规则 4：深色模块占比偏离 50% 的程度
  let darkCount = 0;
  for (const row of modules) for (const v of row) darkCount += v;
  const percent = (darkCount * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * 生成二维码矩阵
 *
 * @param text - 待编码文本（须为字母数字模式可表示字符）
 * @returns { size, modules, version, mask }
 */
function qrEncode(text) {
  // I. 挑选能装下内容的最小版本
  let version = 0;
  for (const v of [1, 2, 3, 4, 5]) {
    const spec = QR_SPEC[v];
    const need = 4 + 9 + Math.floor(text.length / 2) * 11 + (text.length % 2) * 6 + 4;
    if (need <= spec.data * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error(`内容过长，版本 1-5 装不下：${text}`);

  // II. 生成数据码字与纠错码字
  const spec = QR_SPEC[version];
  const dataCw = qrEncodeAlnum(text, spec);
  const ecCw = rsEncode(dataCw, spec.ec);
  const codewords = [...dataCw, ...ecCw];

  // III. 8 种掩模各算一遍，取惩罚分最低的
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const { modules, isFunction } = qrBaseMatrix(version, mask);
    qrPlaceData(modules, isFunction, version, codewords);
    for (let row = 0; row < spec.size; row++) {
      for (let col = 0; col < spec.size; col++) {
        if (!isFunction[row][col] && qrMaskBit(mask, row, col)) modules[row][col] ^= 1;
      }
    }
    const score = qrPenalty(modules, spec.size);
    if (!best || score < best.score) best = { modules, mask, score };
  }

  return { size: spec.size, modules: best.modules, version, mask: best.mask };
}

/**
 * 二维码矩阵渲染为 SVG
 *
 * 同一行相邻的深色模块合并成一条路径指令，文件体积可压缩到逐格 <rect> 的三分之一。
 * 静默区固定 4 个模块，且不叠加任何装饰——这是扫码成功率的关键。
 *
 * @param qr - qrEncode 的返回值
 * @param quiet - 静默区模块数
 * @param scale - 每个模块的像素边长（决定 width/height 固有尺寸）
 * @returns 完整的 SVG 文本
 */
function qrToSvg(qr, quiet = 4, scale = 4) {
  const n = qr.size;
  const total = n + quiet * 2;
  let d = '';
  for (let row = 0; row < n; row++) {
    let col = 0;
    while (col < n) {
      if (!qr.modules[row][col]) {
        col++;
        continue;
      }
      let end = col;
      while (end + 1 < n && qr.modules[row][end + 1]) end++;
      const len = end - col + 1;
      d += `M${col + quiet} ${row + quiet}h${len}v1h-${len}z`;
      col = end + 1;
    }
  }
  const px = total * scale;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${px}" height="${px}" shape-rendering="crispEdges">
<title>USPCS QR</title>
<rect width="${total}" height="${total}" fill="#ffffff"/>
<path d="${d}" fill="#000000"/>
</svg>
`;
}

/* ================= III. 场景素材 ================= */

/**
 * 组装一个素材 SVG 文档
 *
 * @param w - 视口宽（同时作为固有宽）
 * @param h - 视口高（同时作为固有高）
 * @param body - 绘制内容
 * @param opts - { slice 是否填充裁切, bg 背景色, title 无障碍标题 }
 * @returns SVG 文本
 */
function svgDoc(w, h, body, opts = {}) {
  const { slice = false, bg = null, title = 'asset' } = opts;
  const par = slice ? ' preserveAspectRatio="xMidYMid slice"' : '';
  const back = bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${par}>
<title>${title}</title>
${back}
${body}
</svg>
`;
}

/* ---------- 1. 轮播 hero-1：演讲台 ---------- */

/** 演讲台场景：讲台 + 麦克风 + 人物剪影 + 两侧星条旗 */
function heroPodium() {
  const W = 960;
  const H = 540;
  const rng = makeRng(1776);
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += sunburst(480, 470, 820, 26, C.gold, 0.07);
  for (let i = 0; i < 46; i++) {
    s += `<circle cx="${r2(rng() * W)}" cy="${r2(rng() * 300)}" r="${r2(1.2 + rng() * 1.8)}" fill="${C.goldLight}" opacity="${r2(0.25 + rng() * 0.5)}"/>`;
  }
  s += flagOnPole(104, 112, 350, 176, 99, -3);
  s += flagOnPole(856, 112, 350, 176, 99, 3, true);

  // 人物：头 + 肩，纯剪影
  s += `<circle cx="480" cy="188" r="46" fill="${C.ink}"/>`;
  s += `<rect x="464" y="224" width="32" height="30" fill="${C.ink}"/>`;
  s += `<path d="M396 344C396 282 432 250 480 250C528 250 564 282 564 344Z" fill="${C.ink}"/>`;
  s += `<path d="M480 262l16 26-16 46-16-46z" fill="${C.redBright}"/>`;

  // 讲台台面（斜面）
  s += `<path d="M342 318L618 318L608 342L352 342Z" fill="${C.navyMid}" stroke="${C.gold}" stroke-width="3"/>`;

  // 三支麦克风
  for (const [bx, tx, ty] of [
    [452, 464, 262],
    [480, 480, 248],
    [508, 496, 262],
  ]) {
    s += `<line x1="${bx}" y1="366" x2="${tx}" y2="${ty}" stroke="${C.silver}" stroke-width="4"/>`;
    s += `<rect x="${tx - 7}" y="${ty - 12}" width="14" height="22" fill="${C.ink}" stroke="${C.silver}" stroke-width="2" transform="rotate(12 ${tx} ${ty})"/>`;
  }

  // 讲台正面
  s += `<path d="M352 342L608 342L582 488L378 488Z" fill="${C.ink}" stroke="${C.gold}" stroke-width="4"/>`;
  s += `<line x1="366" y1="392" x2="594" y2="392" stroke="${C.gold}" stroke-width="2" opacity="0.75"/>`;
  s += `<line x1="371" y1="440" x2="589" y2="440" stroke="${C.gold}" stroke-width="2" opacity="0.75"/>`;
  s += `<path d="${starPath(480, 414, 30)}" fill="${C.white}" stroke="${C.gold}" stroke-width="2"/>`;
  s += `<rect x="452" y="456" width="56" height="18" fill="${C.red}" stroke="${C.gold}" stroke-width="2"/>`;

  // 前景红条 + 五角星
  s += `<rect x="0" y="452" width="${W}" height="88" fill="${C.red}"/>`;
  s += `<rect x="0" y="452" width="${W}" height="5" fill="${C.gold}"/>`;
  for (let i = 0; i < 20; i++) {
    s += `<path d="${starPath(24 + i * 48, 496, 11)}" fill="${C.white}" opacity="0.9"/>`;
  }
  return s;
}

/* ---------- 2. 轮播 hero-2：国会山 ---------- */

/** 国会山场景：金色落日 + 圆顶剪影 + 倒影池 */
function heroCapitol() {
  const W = 960;
  const H = 540;
  const rng = makeRng(2076);
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += `<circle cx="480" cy="330" r="236" fill="${C.gold}" opacity="0.22"/>`;
  s += `<circle cx="480" cy="330" r="182" fill="${C.gold}" opacity="0.34"/>`;
  s += `<circle cx="480" cy="330" r="132" fill="${C.goldLight}" opacity="0.9"/>`;
  s += sunburst(480, 330, 900, 32, C.gold, 0.05);
  for (let i = 0; i < 54; i++) {
    const x = rng() * W;
    const y = rng() * 300;
    if (Math.hypot(x - 480, y - 330) < 250) continue;
    s += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(1 + rng() * 1.7)}" fill="${C.white}" opacity="${r2(0.25 + rng() * 0.55)}"/>`;
  }

  // 国会山剪影
  s += `<g fill="${C.black}">`;
  s += `<rect x="120" y="404" width="720" height="34"/>`;
  s += `<rect x="150" y="352" width="200" height="52"/>`;
  s += `<rect x="610" y="352" width="200" height="52"/>`;
  s += `<rect x="356" y="326" width="248" height="78"/>`;
  s += `<rect x="392" y="300" width="176" height="26"/>`;
  s += `<rect x="428" y="244" width="104" height="56"/>`;
  s += `<path d="M424 246C424 190 448 162 480 162C512 162 536 190 536 246Z"/>`;
  s += `<rect x="466" y="128" width="28" height="36"/>`;
  s += `<path d="M462 130C462 114 470 104 480 104C490 104 498 114 498 130Z"/>`;
  s += `<rect x="476" y="86" width="8" height="20"/>`;
  s += `<circle cx="480" cy="80" r="9"/>`;
  s += `<path d="M480 62l7 10h-14z"/>`;
  s += `</g>`;

  // 圆顶左侧金色受光边
  s += `<path d="M424 246C424 190 448 162 480 162" fill="none" stroke="${C.gold}" stroke-width="5" opacity="0.85"/>`;
  s += `<rect x="428" y="244" width="6" height="56" fill="${C.gold}" opacity="0.85"/>`;

  // 窗户（金色小方块）
  let win = '';
  for (let i = 0; i < 9; i++) win += `<rect x="${164 + i * 21}" y="366" width="11" height="22" fill="${C.gold}" opacity="0.8"/>`;
  for (let i = 0; i < 9; i++) win += `<rect x="${624 + i * 21}" y="366" width="11" height="22" fill="${C.gold}" opacity="0.8"/>`;
  for (let i = 0; i < 7; i++) win += `<rect x="${372 + i * 34}" y="344" width="16" height="34" fill="${C.gold}" opacity="0.75"/>`;
  for (let i = 0; i < 5; i++) win += `<rect x="${438 + i * 21}" y="258" width="9" height="28" fill="${C.gold}" opacity="0.7"/>`;
  s += win;

  // 台阶
  s += `<rect x="300" y="438" width="360" height="10" fill="${C.ink}"/>`;
  s += `<rect x="280" y="448" width="400" height="10" fill="${C.ink}"/>`;

  // 倒影池
  s += `<rect x="0" y="458" width="${W}" height="82" fill="#0a2340"/>`;
  s += `<rect x="0" y="458" width="${W}" height="4" fill="${C.gold}" opacity="0.6"/>`;
  for (let i = 0; i < 9; i++) {
    s += `<rect x="${120 + i * 82}" y="${470 + (i % 3) * 18}" width="${r2(40 + (i % 4) * 22)}" height="4" fill="${C.navyLight}" opacity="0.55"/>`;
  }
  return s;
}

/* ---------- 3. 轮播 hero-3：白宫 ---------- */

/** 白宫场景：柱廊 + 三角山花 + 云 + 旗 */
function heroWhiteHouse() {
  const W = 960;
  const H = 540;
  const rng = makeRng(1812);
  let s = `<rect width="${W}" height="${H}" fill="${C.navyPale}"/>`;
  s += sunburst(480, 250, 860, 24, C.goldLight, 0.06);
  for (let i = 0; i < 5; i++) {
    const cx = 30 + i * 200 + rng() * 50;
    const cy = 56 + rng() * 80;
    const cw = 120 + rng() * 70;
    s += `<g>`;
    s += `<rect x="${r2(cx)}" y="${r2(cy)}" width="${r2(cw)}" height="22" fill="${C.white}" fill-opacity="0.22"/>`;
    s += `<rect x="${r2(cx + 16)}" y="${r2(cy - 16)}" width="${r2(cw * 0.6)}" height="22" fill="${C.white}" fill-opacity="0.22"/>`;
    s += `<rect x="${r2(cx)}" y="${r2(cy + 22)}" width="${r2(cw * 0.8)}" height="4" fill="${C.gold}" fill-opacity="0.4"/>`;
    s += `</g>`;
  }

  // 主体
  s += `<rect x="176" y="300" width="608" height="96" fill="${C.offWhite}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<rect x="300" y="248" width="360" height="52" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<path d="M336 250L480 186L624 250Z" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<path d="${starPath(480, 232, 12)}" fill="${C.gold}"/>`;

  // 柱廊：先铺深色内凹，再立柱，柱子右侧加一道暗面，避免白墙上的柱子糊成一片
  s += `<rect x="330" y="256" width="300" height="92" fill="#0d2a52"/>`;
  for (let i = 0; i < 6; i++) {
    const x = 336 + i * 58;
    s += `<rect x="${x}" y="262" width="24" height="86" fill="${C.white}" stroke="${C.navy}" stroke-width="2.5"/>`;
    s += `<rect x="${x + 15}" y="263" width="8" height="84" fill="${C.silver}"/>`;
    s += `<rect x="${x - 5}" y="252" width="34" height="12" fill="${C.offWhite}" stroke="${C.navy}" stroke-width="2"/>`;
  }
  s += `<rect x="326" y="344" width="308" height="12" fill="${C.offWhite}" stroke="${C.navy}" stroke-width="2.5"/>`;

  // 两翼窗户
  let win = '';
  for (let i = 0; i < 5; i++) {
    win += `<rect x="${196 + i * 22}" y="318" width="13" height="28" fill="${C.navy}" stroke="${C.gold}" stroke-width="2"/>`;
    win += `<rect x="${700 + i * 22}" y="318" width="13" height="28" fill="${C.navy}" stroke="${C.gold}" stroke-width="2"/>`;
  }
  for (let i = 0; i < 5; i++) {
    win += `<rect x="${316 + i * 68}" y="268" width="16" height="30" fill="${C.navy}" opacity="0.85"/>`;
  }
  s += win;

  // 围栏 + 屋顶旗
  s += `<rect x="470" y="118" width="6" height="72" fill="${C.silver}"/>`;
  s += `<g transform="translate(478 122)">${usFlag(74, 44)}</g>`;

  // 地面与红毯
  s += `<rect x="0" y="396" width="${W}" height="144" fill="${C.navy}"/>`;
  s += `<rect x="0" y="396" width="${W}" height="5" fill="${C.gold}"/>`;
  s += `<path d="M436 396L524 396L604 540L360 540Z" fill="${C.red}"/>`;
  s += `<path d="M436 396L524 396L604 540L360 540Z" fill="none" stroke="${C.gold}" stroke-width="3"/>`;
  s += `<path d="M480 396L480 540" stroke="${C.gold}" stroke-width="3" stroke-dasharray="18 14"/>`;
  // 草坪分格与栅栏
  for (let i = 0; i < 14; i++) {
    s += `<rect x="${i * 70}" y="424" width="40" height="7" fill="${C.ink}" opacity="0.55"/>`;
    s += `<rect x="${i * 70 + 30}" y="452" width="40" height="7" fill="${C.ink}" opacity="0.4"/>`;
  }
  s += `<g stroke="${C.silver}" stroke-width="2" opacity="0.65">`;
  for (let i = 0; i < 32; i++) s += `<line x1="${i * 30 + 8}" y1="404" x2="${i * 30 + 8}" y2="420"/>`;
  s += `<line x1="0" y1="404" x2="${W}" y2="404"/><line x1="0" y1="420" x2="${W}" y2="420"/>`;
  s += `</g>`;
  return s;
}

/* ---------- 4. 轮播 hero-4：集会 ---------- */

/** 集会场景：人海剪影 + 标语牌 + 星条旗 */
function heroRally() {
  const W = 960;
  const H = 540;
  const rng = makeRng(2024);
  let s = `<rect width="${W}" height="${H}" fill="${C.redDeep}"/>`;
  s += sunburst(480, 200, 900, 28, C.gold, 0.09);
  for (let i = 0; i < 30; i++) {
    s += `<path d="${starPath(r2(rng() * W), r2(rng() * 260), r2(6 + rng() * 10))}" fill="${C.white}" opacity="${r2(0.2 + rng() * 0.4)}"/>`;
  }

  // 主席台横幅
  s += `<path d="M60 118C300 92 660 92 900 118L900 176C660 150 300 150 60 176Z" fill="${C.navy}" stroke="${C.gold}" stroke-width="5"/>`;
  s += `<rect x="180" y="126" width="600" height="12" fill="${C.gold}" opacity="0.9"/>`;
  s += `<rect x="240" y="148" width="480" height="9" fill="${C.white}" opacity="0.7"/>`;

  // 标语牌与旗
  s += placard(200, 246, 120, 78, -8, 500);
  s += placard(360, 214, 132, 84, 5, 500);
  s += placard(620, 222, 126, 80, -5, 500);
  s += placard(790, 252, 112, 74, 9, 500);
  s += flagOnPole(500, 232, 268, 130, 74, 2);
  s += flagOnPole(96, 262, 238, 116, 66, -4);

  // 四层人海，越靠前越大越深
  s += crowdRow(rng, 322, 16, 15, 20, '#8f1d1d');
  s += crowdRow(rng, 372, 13, 19, 25, '#6d1414');
  s += crowdRow(rng, 434, 10, 24, 31, C.redDeep);
  s += crowdRow(rng, 502, 8, 29, 37, C.ink);

  // 飘落纸屑
  for (let i = 0; i < 40; i++) {
    const x = rng() * W;
    const y = 250 + rng() * 240;
    const c = [C.gold, C.white, C.goldLight][i % 3];
    s += `<rect x="${r2(x)}" y="${r2(y)}" width="7" height="7" fill="${c}" opacity="0.75" transform="rotate(${r2(rng() * 60 - 30)} ${r2(x)} ${r2(y)})"/>`;
  }
  return s;
}

/* ---------- 5. 轮播 hero-5：签令 ---------- */

/** 签令场景：办公桌 + 文件 + 签字人物 + 交叉国旗 */
function heroSigning() {
  const W = 960;
  const H = 540;
  const rng = makeRng(1789);
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += sunburst(480, 250, 880, 30, C.gold, 0.07);
  // 两侧红色幕布
  s += `<rect x="0" y="0" width="132" height="${H}" fill="${C.redDeep}"/>`;
  s += `<rect x="${W - 132}" y="0" width="132" height="${H}" fill="${C.redDeep}"/>`;
  for (let i = 0; i < 5; i++) {
    s += `<rect x="${12 + i * 26}" y="0" width="9" height="${H}" fill="${C.red}" opacity="0.7"/>`;
    s += `<rect x="${W - 120 + i * 26}" y="0" width="9" height="${H}" fill="${C.red}" opacity="0.7"/>`;
  }
  for (let i = 0; i < 34; i++) {
    s += `<circle cx="${r2(rng() * W)}" cy="${r2(rng() * 280)}" r="${r2(1.2 + rng() * 1.6)}" fill="${C.goldLight}" opacity="${r2(0.25 + rng() * 0.5)}"/>`;
  }

  // 交叉国旗
  s += `<g transform="rotate(-16 480 268)"><g transform="translate(300 176)">${usFlag(168, 96)}</g></g>`;
  s += `<g transform="rotate(16 480 268)"><g transform="translate(492 176)">${usFlag(168, 96)}</g></g>`;

  // 签字人物
  s += `<circle cx="480" cy="196" r="44" fill="${C.ink}"/>`;
  s += `<rect x="464" y="230" width="32" height="28" fill="${C.ink}"/>`;
  s += `<path d="M392 336C392 280 428 252 480 252C532 252 568 280 568 336Z" fill="${C.ink}"/>`;
  s += `<path d="M480 264l15 24-15 44-15-44z" fill="${C.redBright}"/>`;
  // 右臂执笔
  s += `<path d="M552 296L640 330L634 348L546 314Z" fill="${C.ink}"/>`;
  s += `<circle cx="640" cy="336" r="13" fill="${C.ink}"/>`;
  s += `<rect x="644" y="330" width="46" height="8" fill="${C.gold}" transform="rotate(14 644 330)"/>`;
  s += `<path d="M688 338l16 6-14 6z" fill="${C.goldDark}"/>`;

  // 办公桌
  s += `<rect x="196" y="348" width="568" height="22" fill="${C.ink}" stroke="${C.gold}" stroke-width="3"/>`;
  s += `<rect x="216" y="370" width="528" height="102" fill="#0f2744" stroke="${C.gold}" stroke-width="2"/>`;
  // 抽屉分格与金色拉手
  for (const dx of [236, 356, 596]) {
    s += `<rect x="${dx}" y="382" width="102" height="78" fill="none" stroke="${C.gold}" stroke-width="2" opacity="0.7"/>`;
    s += `<rect x="${dx + 36}" y="398" width="30" height="6" fill="${C.gold}"/>`;
    s += `<rect x="${dx + 36}" y="436" width="30" height="6" fill="${C.gold}"/>`;
  }
  // 正中徽牌
  s += `<rect x="454" y="384" width="52" height="74" fill="${C.red}" stroke="${C.gold}" stroke-width="2.5"/>`;
  s += `<path d="${starPath(480, 410, 16)}" fill="${C.goldLight}"/>`;
  s += `<text x="480" y="450" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="14" font-weight="bold" fill="${C.goldLight}">1776</text>`;

  // 文件与印章
  s += `<g transform="rotate(-5 640 344)">`;
  s += `<rect x="588" y="318" width="112" height="62" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<rect x="600" y="330" width="88" height="6" fill="${C.silver}"/>`;
  s += `<rect x="600" y="342" width="72" height="6" fill="${C.silver}"/>`;
  s += `<rect x="600" y="354" width="80" height="6" fill="${C.silver}"/>`;
  s += `<circle cx="676" cy="362" r="12" fill="${C.red}" stroke="${C.goldDark}" stroke-width="2"/>`;
  s += `<path d="${starPath(676, 362, 6)}" fill="${C.goldLight}"/>`;
  s += `</g>`;

  // 前景台阶与金色星条
  s += `<rect x="0" y="472" width="${W}" height="68" fill="${C.red}"/>`;
  s += `<rect x="0" y="472" width="${W}" height="5" fill="${C.gold}"/>`;
  for (let i = 0; i < 16; i++) {
    s += `<path d="${starPath(30 + i * 60, 508, 13)}" fill="${C.white}" opacity="0.92"/>`;
  }
  return s;
}

/* ---------- 6. 金发人物剪影头像 ---------- */

/**
 * 画像构图刻意把头顶放在 30% 高度、面部中心放在 46% 高度：
 * 这样竖着当头像用是标准半身像，横着裁成横幅也能落在脸的下半部。
 */
function portraitTrump() {
  const W = 300;
  const H = 360;
  const rng = makeRng(1946);
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += sunburst(150, 178, 420, 28, C.gold, 0.09);
  for (let i = 0; i < 22; i++) {
    s += `<circle cx="${r2(rng() * W)}" cy="${r2(rng() * 300)}" r="${r2(1 + rng() * 1.6)}" fill="${C.goldLight}" opacity="${r2(0.2 + rng() * 0.5)}"/>`;
  }
  // 底部红条
  s += `<rect x="0" y="300" width="${W}" height="60" fill="${C.red}"/>`;
  s += `<rect x="0" y="300" width="${W}" height="4" fill="${C.gold}"/>`;
  for (let i = 0; i < 7; i++) {
    s += `<path d="${starPath(26 + i * 42, 330, 10)}" fill="${C.white}" opacity="0.9"/>`;
  }

  // 肩与西装
  s += `<path d="M28 360C28 292 78 262 150 262C222 262 272 292 272 360Z" fill="${C.ink}" stroke="#1c4b8a" stroke-width="2.5"/>`;
  s += `<path d="M110 264L150 322L190 264L172 258L150 296L128 258Z" fill="${C.white}"/>`;
  s += `<path d="M150 300L164 320L156 360H144L136 320Z" fill="${C.redBright}"/>`;
  s += `<path d="M110 264L150 322L128 360H96Z" fill="#0f2744"/>`;
  s += `<path d="M190 264L150 322L172 360H204Z" fill="#0f2744"/>`;

  // 头与颈
  s += `<rect x="132" y="222" width="36" height="46" fill="${C.ink}"/>`;
  s += `<ellipse cx="150" cy="180" rx="56" ry="62" fill="${C.ink}" stroke="#1c4b8a" stroke-width="2.5"/>`;
  // 金发：一块只在"发际线以上"的实心发型，向后上方扫出体积。
  // 关键是内缘不能描着整颗头的轮廓走，否则会读成头盔或光环。
  s += `<path d="M100 166C92 124 116 92 152 92C190 92 212 118 214 152C206 138 196 130 184 126C188 138 188 150 184 160C180 142 170 132 156 130C136 128 122 138 118 158C112 152 108 144 106 134C102 144 100 154 100 166Z" fill="${C.gold}"/>`;
  // 前额上方的一撮飞发，做出"发型"而不是"帽檐"
  s += `<path d="M104 132C104 108 124 94 148 96C168 98 182 108 188 122C176 108 158 100 140 102C124 104 112 114 104 132Z" fill="${C.goldLight}"/>`;
  // 面部侧光（不做写实五官，只留一道轮廓光）
  s += `<path d="M114 172C114 150 128 138 142 136C130 144 122 158 122 176C122 198 132 214 146 222C126 216 114 198 114 172Z" fill="#1c4b8a"/>`;
  return s;
}

/* ---------- 7. 退伍军人 ---------- */

/** 致敬退伍军人：黄昏、敬礼剪影、墓园十字架、星条旗 */
function veteransScene() {
  const W = 320;
  const H = 180;
  const rng = makeRng(1918);
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += `<circle cx="244" cy="104" r="38" fill="${C.gold}" opacity="0.2"/>`;
  s += `<circle cx="244" cy="104" r="22" fill="${C.goldLight}" opacity="0.55"/>`;
  s += `<circle cx="244" cy="104" r="12" fill="${C.goldLight}"/>`;
  s += sunburst(244, 104, 320, 20, C.gold, 0.06);
  for (let i = 0; i < 26; i++) {
    s += `<circle cx="${r2(rng() * W)}" cy="${r2(rng() * 90)}" r="${r2(0.8 + rng() * 1.2)}" fill="${C.white}" opacity="${r2(0.25 + rng() * 0.5)}"/>`;
  }
  // 远景山脊
  s += `<path d="M0 132L44 118L86 128L134 112L182 124L228 114L272 126L320 116V180H0Z" fill="#12335c"/>`;
  // 墓园十字架
  for (let i = 0; i < 11; i++) {
    const x = 14 + i * 28;
    const y = 140 + (i % 3) * 5;
    s += `<g fill="${C.silver}" opacity="0.5">`;
    s += `<rect x="${x}" y="${y}" width="4" height="18"/>`;
    s += `<rect x="${x - 4}" y="${y + 5}" width="12" height="4"/>`;
    s += `</g>`;
  }
  // 地面
  s += `<rect x="0" y="158" width="${W}" height="22" fill="${C.ink}"/>`;
  s += `<rect x="0" y="158" width="${W}" height="3" fill="${C.gold}" opacity="0.6"/>`;

  // 敬礼剪影
  s += `<g fill="${C.black}">`;
  s += `<ellipse cx="112" cy="66" rx="17" ry="15"/>`;
  s += `<path d="M92 62c0-11 9-19 20-19s20 8 20 19l-6 2H98Z"/>`; // 军帽
  s += `<rect x="90" y="46" width="46" height="7"/>`; // 帽檐
  s += `<path d="M96 82h32c10 0 16 6 16 16v60H80V98c0-10 6-16 16-16Z"/>`; // 躯干
  s += `<path d="M126 88l26-26 8 8-24 26Z"/>`; // 抬起的右臂
  s += `<circle cx="158" cy="60" r="8"/>`; // 手
  s += `<path d="M80 96l-14 34 10 5 16-32Z"/>`; // 左臂
  s += `</g>`;
  // 旗杆与旗
  s += `<rect x="272" y="30" width="4" height="130" fill="${C.silver}"/>`;
  s += `<g transform="translate(212 34) rotate(-4)">${usFlag(60, 36)}</g>`;
  return s;
}

/* ---------- 8. 沙漠公路 ---------- */

/** 团结·创新·服务：沙漠公路 + 仙人掌 + 台地 */
function desertScene() {
  const W = 320;
  const H = 180;
  const horizon = 108;
  let s = `<rect width="${W}" height="${H}" fill="${C.navyPale}"/>`;
  // I. 天空：自深蓝向地平线渐亮
  s += `<rect x="0" y="0" width="${W}" height="40" fill="#0d2a52"/>`;
  s += `<rect x="0" y="40" width="${W}" height="34" fill="#1c4b8a"/>`;
  s += `<rect x="0" y="74" width="${W}" height="24" fill="#2b6cb0"/>`;
  s += `<rect x="0" y="98" width="${W}" height="10" fill="${C.gold}" opacity="0.5"/>`;
  // II. 太阳：完整位于地平线之上
  s += `<circle cx="252" cy="72" r="30" fill="${C.gold}" opacity="0.3"/>`;
  s += `<circle cx="252" cy="72" r="20" fill="${C.gold}" opacity="0.55"/>`;
  s += `<circle cx="252" cy="72" r="13" fill="${C.goldLight}"/>`;

  // III. 远景台地：平顶、斜壁，典型西南地貌剪影
  s += `<path d="M0 108V88h30l8-14h34l8 14h30l10-18h40l10 18h150v20Z" fill="#7a2f14"/>`;
  s += `<path d="M0 108V92h26l8-12h30l8 12h28l10-16h36l10 16h164v16Z" fill="${C.navy}"/>`;
  s += `<path d="M0 108V98h22l7-8h26l7 8h24l9-10h30l9 10h187v10Z" fill="${C.red}" opacity="0.5"/>`;

  // IV. 沙漠地面：用旗金家族的暗金做沙地，仙人掌才有对比度可言
  s += `<rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="${C.goldDark}"/>`;
  s += `<rect x="0" y="${horizon}" width="${W}" height="5" fill="${C.goldLight}"/>`;
  s += `<rect x="0" y="${horizon + 5}" width="${W}" height="14" fill="#8a6208" opacity="0.45"/>`;

  // V. 公路：地平线处收成一点，向画面下方张开
  const vpx = 160;
  s += `<path d="M${vpx - 5} ${horizon}H${vpx + 5}L266 180H54Z" fill="#3a3f47"/>`;
  s += `<path d="M${vpx - 5} ${horizon}H${vpx + 2}L170 180H118Z" fill="#c9c9c9" opacity="0.22"/>`;
  // 中央虚线：宽度随透视放大
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const y = horizon + 5 + t * 66;
    const w = 3 + t * 12;
    const h = 5 + t * 14;
    s += `<rect x="${r2(vpx - w / 2)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${C.gold}"/>`;
  }
  s += `<path d="M${vpx - 5} ${horizon}H${vpx + 5}L266 180H54Z" fill="none" stroke="${C.goldLight}" stroke-width="1.5" opacity="0.5"/>`;

  // VI. 前景仙人掌：巨人柱造型（主干 + 两条上弯的臂），画在公路两侧
  const saguaro = (x, baseY, sc) =>
    `<g transform="translate(${x} ${baseY}) scale(${sc})" fill="${C.ink}">` +
    `<rect x="-7" y="-72" width="14" height="72" rx="7"/>` +
    `<rect x="-30" y="-58" width="11" height="30" rx="5.5"/>` +
    `<rect x="-30" y="-38" width="26" height="11" rx="5.5"/>` +
    `<rect x="19" y="-66" width="11" height="30" rx="5.5"/>` +
    `<rect x="4" y="-46" width="26" height="11" rx="5.5"/>` +
    `</g>`;
  s += saguaro(40, 174, 1.0);
  s += saguaro(292, 180, 1.25);
  s += saguaro(88, 164, 0.5);
  // VII. 路面碎石点缀
  s += `<rect x="0" y="176" width="${W}" height="4" fill="${C.gold}" opacity="0.6"/>`;
  return s;
}

/* ---------- 9. 美国本土 48 州轮廓图 ---------- */

/**
 * 本土 48 州简化轮廓（顺时针）
 *
 * 顶点由真实经纬度换算而来：x = 40 + (125°W − 经度) × 9.66，y = 60 + (49°N − 纬度) × 12.9，
 * 再做几何化取整。这样海岸线与国界的比例是对的，不会画成"一团土豆"。
 */
const US_OUTLINE = [
  [43, 68],   // 华盛顿州西北角
  [52, 60],   // 49°N 国界起点
  [328, 60],  // 明尼苏达（49°N 国界东端）
  [352, 86],  // 苏必利尔湖西岸
  [420, 96],  // 苏必利尔湖东段
  [448, 120], // 密歇根湖西岸
  [452, 146], // 密歇根湖南端
  [472, 150], // 伊利湖南岸
  [492, 134], // 安大略湖
  [520, 118], // 圣劳伦斯河谷
  [548, 108], // 佛蒙特北界
  [579, 84],  // 缅因州北端
  [600, 112], // 缅因州东端
  [586, 128], // 缅因海岸
  [568, 134],
  [571, 152], // 科德角
  [548, 162], // 长岛
  [533, 168], // 纽约港
  [524, 188], // 特拉华湾
  [516, 206], // 切萨皮克湾口
  [522, 224], // 哈特拉斯角
  [500, 240], // 北卡海岸
  [478, 262], // 南卡
  [468, 280], // 佐治亚
  [466, 298], // 佛罗里达北界
  [474, 320], // 卡纳维拉尔
  [480, 348], // 迈阿密
  [468, 368], // 佛罗里达南端
  [452, 352], // 那不勒斯
  [446, 330], // 坦帕
  [432, 306], // 阿巴拉契科拉
  [414, 302], // 佛州狭地
  [398, 296], // 莫比尔
  [382, 306], // 新奥尔良
  [360, 312], // 路易斯安那
  [334, 314], // 加尔维斯顿
  [310, 336], // 科珀斯克里斯蒂
  [310, 358], // 布朗斯维尔（德州南端）
  [288, 338], // 拉雷多
  [274, 314], // 德尔里奥
  [254, 316], // 大弯
  [220, 282], // 埃尔帕索
  [202, 282], // 新墨西哥
  [176, 288], // 亚利桑那
  [140, 270], // 尤马
  [118, 274], // 圣迭戈
  [106, 258], // 洛杉矶
  [84, 248],  // 康塞普申角
  [64, 204],  // 旧金山
  [46, 172],  // 门多西诺角
  [48, 150],  // 俄勒冈南界
  [50, 96],   // 华盛顿海岸
];

/**
 * 用轴对齐直线裁剪简单多边形，得到直线在图形内部的若干区间
 *
 * 西部各州本来就是矩形拼接，用"直线裁到国界上"的画法既省事又比手描更像地图。
 *
 * @param poly - 多边形顶点数组
 * @param axis - 'x' 表示竖线，'y' 表示横线
 * @param c - 直线坐标
 * @returns 区间数组 [[起, 止], ...]
 */
function clipPolygon(poly, axis, c) {
  const hits = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const av = axis === 'x' ? a[0] : a[1];
    const bv = axis === 'x' ? b[0] : b[1];
    if ((av - c) * (bv - c) < 0) {
      const t = (c - av) / (bv - av);
      hits.push(axis === 'x' ? a[1] + t * (b[1] - a[1]) : a[0] + t * (b[0] - a[0]));
    }
  }
  hits.sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i + 1 < hits.length; i += 2) {
    if (hits[i + 1] - hits[i] > 8) out.push([hits[i], hits[i + 1]]);
  }
  return out;
}

/** 本土 48 州轮廓图：底色平涂 + 州界 + 重点州标记 */
function usMap() {
  const W = 640;
  const H = 400;
  let s = `<rect width="${W}" height="${H}" fill="${C.offWhite}"/>`;
  s += `<rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="${C.gold}" stroke-width="4"/>`;
  const d = `M${US_OUTLINE.map((p) => p.join(' ')).join('L')}Z`;
  s += `<g transform="translate(4 10)">`;
  s += `<path d="${d}" fill="${C.ink}" opacity="0.32" transform="translate(6 6)"/>`;
  s += `<path d="${d}" fill="${C.navyLight}" stroke="${C.navy}" stroke-width="4"/>`;

  // I. 州界：西部与中西部本来就是矩形拼接，用"直线裁到国界上"的画法既省事又忠于实际
  let lines = '';
  for (const x of [88, 117, 146, 175, 195, 243, 262, 282, 315, 334, 351]) {
    for (const [y0, y1] of clipPolygon(US_OUTLINE, 'x', x)) {
      lines += `<line x1="${x}" y1="${r2(y0)}" x2="${x}" y2="${r2(y1)}"/>`;
    }
  }
  for (const y of [112, 150, 176, 215, 240, 262, 296]) {
    for (const [x0, x1] of clipPolygon(US_OUTLINE, 'y', y)) {
      lines += `<line x1="${r2(x0)}" y1="${y}" x2="${r2(x1)}" y2="${y}"/>`;
    }
  }
  s += `<g stroke="${C.white}" stroke-width="1.5" opacity="0.8">${lines}</g>`;
  // II. 密西西比河：手绘折线，打破纯网格感
  s += `<path d="M320 62C314 100 330 130 322 164C314 196 330 222 322 252C316 276 326 296 320 314" fill="none" stroke="${C.white}" stroke-width="1.8" opacity="0.75"/>`;
  // III. 大陆分水岭
  s += `<path d="M175 62C186 110 166 156 180 206C192 248 174 288 186 336" fill="none" stroke="${C.white}" stroke-width="1.2" opacity="0.45" stroke-dasharray="7 6"/>`;
  s += `</g>`;

  // IV. 重点州标记（与首页「地方分站」的 6 个州一致；side 决定标签挡在哪一侧，避免压到海岸线）
  const marks = [
    ['CA', 93, 221, 1],
    ['TX', 276, 290, -1],
    ['FL', 452, 326, -1],
    ['NY', 500, 126, 1],
    ['OH', 440, 170, -1],
    ['DC', 498, 194, -1],
  ];
  for (const [code, mx, my, side] of marks) {
    const x = mx + 4;
    const y = my + 10;
    s += `<rect x="${r2(x - 10)}" y="${r2(y - 10)}" width="20" height="20" fill="${C.red}" stroke="${C.gold}" stroke-width="2"/>`;
    s += `<path d="${starPath(x, y, 6.5)}" fill="${C.white}"/>`;
    s += `<text x="${r2(x + side * 15)}" y="${r2(y + 5)}" text-anchor="${side > 0 ? 'start' : 'end'}" font-family="Times New Roman, Georgia, serif" font-size="14" font-weight="bold" fill="${C.navy}" stroke="${C.white}" stroke-width="3" paint-order="stroke">${code}</text>`;
  }

  // V. 标题条
  s += `<rect x="24" y="22" width="196" height="30" fill="${C.red}"/>`;
  s += `<text x="122" y="43" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="17" font-weight="bold" fill="${C.white}" letter-spacing="2">48 STATES MAP</text>`;
  s += `<rect x="24" y="52" width="196" height="4" fill="${C.gold}"/>`;
  return s;
}

/* ---------- 10. 徽记 ---------- */

/**
 * 白头海雕图形（展翅 + 星条盾 + 尾羽）
 *
 * 设计视图框 200×200：翼展 x∈[4,196]、图案中心约在 (100,102)。
 * 各徽记按需 `translate + scale` 复用同一份造型，保证全站雕的形象一致。
 *
 * @returns SVG 片段
 */
function eagleFigure() {
  let s = '<g>';
  // I. 尾羽（画在最底层）
  s += `<path d="M80 160L100 196L120 160C114 168 107 172 100 172C93 172 86 168 80 160Z" fill="${C.offWhite}" stroke="${C.navy}" stroke-width="3"/>`;

  // II. 双翼：以 x=100 为轴镜像
  const wing = 'M100 100C128 90 160 72 194 40C178 80 152 108 118 128C110 122 104 110 100 100Z';
  s += `<path d="${wing}" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<g transform="translate(200 0) scale(-1 1)"><path d="${wing}" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/></g>`;

  // III. 翼羽分隔线：从肩部向翼尖放射
  s += `<g stroke="${C.navy}" stroke-width="2.2" fill="none" opacity="0.7">`;
  for (const d of ['M104 106C128 98 156 82 188 52', 'M107 114C128 108 150 96 172 78', 'M110 122C126 118 142 110 156 100']) {
    s += `<path d="${d}"/>`;
    s += `<g transform="translate(200 0) scale(-1 1)"><path d="${d}"/></g>`;
  }
  s += `</g>`;

  // IV. 躯干
  s += `<path d="M100 84C117 84 128 102 128 124C128 148 117 170 100 182C83 170 72 148 72 124C72 102 83 84 100 84Z" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;

  // V. 头与喙
  s += `<circle cx="100" cy="62" r="23" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<path d="M121 58L154 69L121 80Z" fill="${C.gold}" stroke="${C.navy}" stroke-width="2.5"/>`;
  s += `<circle cx="109" cy="58" r="3.6" fill="${C.ink}"/>`;

  // VI. 胸前星条盾
  s += `<path d="M100 100L126 110V134C126 152 113 166 100 174C87 166 74 152 74 134V110Z" fill="${C.red}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<path d="M74 110L100 100L126 110V122H74Z" fill="${C.canton}"/>`;
  s += `<rect x="74" y="128" width="52" height="7" fill="${C.white}"/>`;
  s += `<rect x="76" y="142" width="48" height="7" fill="${C.white}"/>`;
  s += `<rect x="74" y="128" width="52" height="21" fill="none" stroke="${C.navy}" stroke-width="1.5" opacity="0.5"/>`;
  s += '</g>';
  return s;
}

/** 白头海雕徽记：展翅白雕 + 星条盾 + 缎带 */
function eagleEmblem() {
  const W = 240;
  const H = 220;
  let s = `<circle cx="120" cy="110" r="104" fill="${C.navy}" stroke="${C.gold}" stroke-width="8"/>`;
  s += `<circle cx="120" cy="110" r="89" fill="none" stroke="${C.gold}" stroke-width="2.5"/>`;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    s += `<path d="${starPath(r2(120 + Math.cos(a) * 96.5), r2(110 + Math.sin(a) * 96.5), 5)}" fill="${C.goldLight}"/>`;
  }
  s += `<g transform="translate(42 30) scale(0.78)">${eagleFigure()}</g>`;
  // 缎带（压在圆环下沿之上）
  s += `<path d="M30 176H210L192 206L120 194L48 206Z" fill="${C.red}" stroke="${C.navy}" stroke-width="3"/>`;
  s += `<text x="120" y="196" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="16" font-weight="bold" fill="${C.goldLight}" letter-spacing="1.5">LIBERTY</text>`;
  return s;
}

/**
 * 大象徽记：红底金环 + 白象侧面剪影
 *
 * 侧面剪影（头、耳、长鼻、象牙、四条腿）比正面对称画法更容易一眼认出是象。
 */
function elephantEmblem() {
  let s = `<circle cx="100" cy="100" r="96" fill="${C.red}" stroke="${C.redDeep}" stroke-width="6"/>`;
  s += `<circle cx="100" cy="100" r="85" fill="none" stroke="${C.gold}" stroke-width="4"/>`;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 - Math.PI / 2;
    s += `<path d="${starPath(r2(100 + Math.cos(a) * 91), r2(100 + Math.sin(a) * 91), 5.5)}" fill="${C.goldLight}"/>`;
  }

  // I. 白色象身（侧面朝右）
  s += `<g fill="${C.white}">`;
  s += `<ellipse cx="86" cy="106" rx="48" ry="38"/>`;
  s += `<circle cx="132" cy="94" r="32"/>`;
  s += `<path d="M150 108C168 112 178 130 176 150C174 168 164 178 152 176C162 168 166 156 164 142C162 126 156 116 148 112Z"/>`;
  s += `<rect x="52" y="134" width="21" height="44"/>`;
  s += `<rect x="80" y="138" width="21" height="40"/>`;
  s += `<rect x="108" y="138" width="21" height="40"/>`;
  s += `<rect x="136" y="132" width="20" height="46"/>`;
  s += `</g>`;

  // II. 耳朵与眼睛用底色挖空，形成剪影内部结构
  s += `<ellipse cx="120" cy="88" rx="20" ry="24" fill="${C.red}" stroke="${C.goldLight}" stroke-width="3"/>`;
  s += `<circle cx="146" cy="80" r="5.5" fill="${C.red}"/>`;

  // III. 象拔（金色象牙）与鼻纹
  s += `<path d="M150 112C162 118 168 130 168 142" fill="none" stroke="${C.goldLight}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M156 120C164 128 168 140 166 154" fill="none" stroke="${C.red}" stroke-width="2.5" opacity="0.5"/>`;
  s += `<path d="M92 68C92 56 108 50 122 54" fill="none" stroke="${C.red}" stroke-width="2.5" opacity="0.4"/>`;

  // IV. 顶部金星 + 底部标签条
  s += `<path d="${starPath(100, 40, 15)}" fill="${C.goldLight}" stroke="${C.goldDark}" stroke-width="2"/>`;
  s += `<rect x="38" y="178" width="124" height="15" fill="${C.navy}"/>`;
  s += `<text x="100" y="190" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="11" font-weight="bold" fill="${C.goldLight}" letter-spacing="1">REPUBLIC</text>`;
  return s;
}

/** 圆形国徽风徽章：环形文字 + 中央白雕 + 星环 */
function sealEmblem() {
  const W = 240;
  const H = 240;
  const cx = 120;
  const cy = 120;
  let s = `<circle cx="${cx}" cy="${cy}" r="117" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="3"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="108" fill="${C.navy}" stroke="${C.ink}" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="${C.gold}" stroke-width="2.5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="80" fill="#0f3565" stroke="${C.gold}" stroke-width="1.5"/>`;
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 - Math.PI / 2;
    s += `<path d="${starPath(r2(cx + Math.cos(a) * 98), r2(cy + Math.sin(a) * 98), 5.5)}" fill="${C.goldLight}"/>`;
  }
  // 环形文字
  s += `<defs>`;
  s += `<path id="seal-top" d="M40 ${cy}A80 80 0 0 1 200 ${cy}"/>`;
  s += `<path id="seal-bottom" d="M40 ${cy}A80 80 0 0 0 200 ${cy}"/>`;
  s += `</defs>`;
  const ringFont = 'font-family="Times New Roman, Georgia, serif" font-size="15" font-weight="bold" fill="#ffffff" letter-spacing="1"';
  s += `<text ${ringFont}><textPath xlink:href="#seal-top" href="#seal-top" startOffset="50%" text-anchor="middle">UNITED STATES OF AMERICA</textPath></text>`;
  s += `<text ${ringFont}><textPath xlink:href="#seal-bottom" href="#seal-bottom" startOffset="50%" text-anchor="middle">PUBLIC CONVENIENCE SERVICE</textPath></text>`;
  s += `<path d="${starPath(40, cy, 9)}" fill="${C.goldLight}"/>`;
  s += `<path d="${starPath(200, cy, 9)}" fill="${C.goldLight}"/>`;
  // 中央白雕：与 eagle-emblem 复用同一造型，缩到内圆里
  s += `<g transform="translate(54 38) scale(0.66)">${eagleFigure()}</g>`;
  s += `<text x="${cx}" y="182" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="17" font-weight="bold" fill="${C.goldLight}">1776</text>`;
  return s;
}

/* ---------- 11. 领导活动小图（120×80） ---------- */

/** 小图 1：主席台讲话 */
function pressSpeech() {
  const W = 120;
  const H = 80;
  let s = `<rect width="${W}" height="${H}" fill="${C.navy}"/>`;
  s += sunburst(60, 62, 120, 16, C.gold, 0.09);
  s += `<g transform="translate(8 8)">${usFlag(30, 18)}</g>`;
  s += `<circle cx="60" cy="28" r="11" fill="${C.ink}"/>`;
  s += `<path d="M46 54C46 42 52 37 60 37C68 37 74 42 74 54Z" fill="${C.ink}"/>`;
  s += `<path d="M40 52H80L77 74H43Z" fill="#0f2744" stroke="${C.gold}" stroke-width="2"/>`;
  s += `<path d="${starPath(60, 64, 7)}" fill="${C.white}"/>`;
  s += `<line x1="55" y1="52" x2="52" y2="34" stroke="${C.silver}" stroke-width="2"/>`;
  s += `<line x1="65" y1="52" x2="68" y2="34" stroke="${C.silver}" stroke-width="2"/>`;
  s += `<rect x="0" y="72" width="${W}" height="8" fill="${C.red}"/>`;
  s += `<rect x="0" y="72" width="${W}" height="2" fill="${C.gold}"/>`;
  return s;
}

/** 小图 2：会谈握手 */
function pressMeeting() {
  const W = 120;
  const H = 80;
  let s = `<rect width="${W}" height="${H}" fill="#0f3565"/>`;
  s += `<rect x="0" y="0" width="${W}" height="14" fill="${C.red}"/>`;
  s += `<rect x="0" y="14" width="${W}" height="3" fill="${C.gold}"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="${starPath(14 + i * 23, 7, 4)}" fill="${C.white}"/>`;
  s += `<circle cx="34" cy="34" r="10" fill="${C.ink}"/>`;
  s += `<path d="M20 60C20 48 26 43 34 43C42 43 48 48 48 60Z" fill="${C.ink}"/>`;
  s += `<circle cx="86" cy="34" r="10" fill="#1c4b8a"/>`;
  s += `<path d="M72 60C72 48 78 43 86 43C94 43 100 48 100 60Z" fill="#1c4b8a"/>`;
  s += `<rect x="40" y="46" width="40" height="9" fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1.5"/>`;
  s += `<rect x="8" y="60" width="104" height="8" fill="${C.navy}"/>`;
  s += `<rect x="0" y="68" width="${W}" height="12" fill="#071a34"/>`;
  return s;
}

/** 小图 3：记者会剪彩 */
function pressRibbon() {
  const W = 120;
  const H = 80;
  let s = `<rect width="${W}" height="${H}" fill="${C.redDeep}"/>`;
  s += sunburst(60, 22, 130, 18, C.gold, 0.08);
  // 背景板：深蓝底 + 金色饰条 + 白色标题条
  s += `<rect x="10" y="6" width="100" height="20" fill="${C.navy}"/>`;
  s += `<rect x="16" y="11" width="52" height="5" fill="${C.white}" opacity="0.85"/>`;
  s += `<rect x="16" y="19" width="34" height="4" fill="${C.gold}"/>`;
  s += `<path d="${starPath(96, 16, 6)}" fill="${C.goldLight}"/>`;
  s += `<rect x="10" y="26" width="100" height="3" fill="${C.gold}"/>`;
  // 三个人物剪影
  for (const [x, r] of [[28, 9], [60, 10], [92, 9]]) {
    s += `<circle cx="${x}" cy="${52}" r="${r}" fill="${C.ink}"/>`;
    s += `<path d="M${x - r - 8} 76C${x - r - 8} ${52 + r} ${x - r} ${50 + r} ${x} ${50 + r}C${x + r} ${50 + r} ${x + r + 8} ${52 + r} ${x + r + 8} 76Z" fill="${C.ink}"/>`;
  }
  // 剪彩绸带与金色蝴蝶结
  s += `<path d="M0 40H120V49H0Z" fill="${C.gold}"/>`;
  s += `<path d="M52 40h16l-8 22z" fill="${C.goldLight}"/>`;
  s += `<circle cx="60" cy="44" r="5" fill="${C.goldDark}"/>`;
  s += `<rect x="0" y="74" width="${W}" height="6" fill="${C.navy}"/>`;
  return s;
}

/* ================= IV. 主流程 ================= */

/**
 * 断网兜底素材：这些槽位正式版用 `scripts/fetch-photos.mjs` 抓来的照片，
 * 只有在拿不到照片时才会用到这套几何剪影，因此默认不输出，
 * 需要时用 `--with-fallback-svg` 输出到 public/assets/fallback/。
 */
function fallbackFiles() {
  return [
    ['hero-1.svg', svgDoc(960, 540, heroPodium(), { slice: true, title: 'Podium' })],
    ['hero-2.svg', svgDoc(960, 540, heroCapitol(), { slice: true, title: 'Capitol' })],
    ['hero-3.svg', svgDoc(960, 540, heroWhiteHouse(), { slice: true, title: 'White House' })],
    ['hero-4.svg', svgDoc(960, 540, heroRally(), { slice: true, title: 'Rally' })],
    ['hero-5.svg', svgDoc(960, 540, heroSigning(), { slice: true, title: 'Signing' })],
    ['trump-portrait.svg', svgDoc(300, 360, portraitTrump(), { slice: true, bg: C.navy, title: 'Portrait' })],
    ['veterans.svg', svgDoc(320, 180, veteransScene(), { slice: true, title: 'Veterans' })],
    ['desert.svg', svgDoc(320, 180, desertScene(), { slice: true, title: 'Desert Highway' })],
    ['press-1.svg', svgDoc(120, 80, pressSpeech(), { title: 'Press 1' })],
    ['press-2.svg', svgDoc(120, 80, pressMeeting(), { title: 'Press 2' })],
    ['press-3.svg', svgDoc(120, 80, pressRibbon(), { title: 'Press 3' })],
  ];
}

/**
 * 正式输出的矢量素材清单
 *
 * 这些位置用矢量比用照片更合适：二维码要可扫描，地图要清楚，徽记要锐利。
 *
 * @returns { files, qr }
 */
function buildAll() {
  const files = [];

  // 二维码：内容固定，尺寸与版本由编码器自行选择
  const qr = qrEncode('USPCS-1776-2026');
  files.push(['app-qr.svg', qrToSvg(qr, 4, 4)]);

  files.push(['us-map.svg', svgDoc(640, 400, usMap(), { title: 'US Map' })]);
  files.push(['eagle-emblem.svg', svgDoc(240, 220, eagleEmblem(), { title: 'Eagle Emblem' })]);
  files.push(['elephant-emblem.svg', svgDoc(200, 200, elephantEmblem(), { title: 'Elephant Emblem' })]);
  files.push(['seal.svg', svgDoc(240, 240, sealEmblem(), { title: 'Seal' })]);

  return { files, qr };
}

/** 把清单写到指定目录，返回总字节数 */
function emit(dir, files) {
  mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const [name, content] of files) {
    writeFileSync(join(dir, name), content, 'utf8');
    const size = Buffer.byteLength(content, 'utf8');
    bytes += size;
    console.log(`  ✓ ${dir.slice(ROOT.length + 1)}/${name}  ${(size / 1024).toFixed(1)} KB`);
  }
  return bytes;
}

function main() {
  const withFallback = process.argv.includes('--with-fallback-svg');

  const { files, qr } = buildAll();
  const bytes = emit(OUT_DIR, files);
  console.log('');
  console.log(`矢量素材：${files.length} 个文件，共 ${(bytes / 1024).toFixed(1)} KB`);
  console.log(`二维码：版本 ${qr.version} / 纠错等级 L / 掩模 ${qr.mask} / 矩阵 ${qr.size}×${qr.size}`);

  // 照片位已由 fetch-photos.mjs 负责；默认不动它们，避免覆盖真实照片
  if (withFallback) {
    const fb = fallbackFiles();
    console.log('');
    console.log('输出断网兜底剪影（不影响 photos/ 下的照片）：');
    const fbBytes = emit(join(OUT_DIR, 'fallback'), fb);
    console.log(`兜底素材：${fb.length} 个文件，共 ${(fbBytes / 1024).toFixed(1)} KB`);
  } else {
    console.log('');
    console.log('提示：照片位（hero / portrait / veterans / desert / press）由 scripts/fetch-photos.mjs 管理，本次未触碰。');
    console.log('      需要断网兜底的几何剪影时加 --with-fallback-svg。');
  }
}

main();
