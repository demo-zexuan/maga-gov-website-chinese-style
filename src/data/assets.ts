/**
 * 站内静态素材索引
 *
 * I. 为什么需要这一层
 *
 * 1. 全站美术资源统一放在 `public/assets/` 下，由 `scripts/gen-assets.mjs`
 *    离线生成（不联网、不加依赖、可重复运行）。
 * 2. 站点使用 hash 路由且 vite `base` 为 `./`：若直接写相对路径 `assets/x.svg`，
 *    在 `/#/news/1` 这类深层路由下浏览器会按当前目录解析，实际请求
 *    `/news/assets/x.svg` 而 404。因此所有对外路径必须是以 `/` 开头的站点根路径。
 * 3. 本模块刻意保持**零依赖、零副作用**，可被任何页面直接导入，也能独立编译。
 *
 * II. 对外 API
 *
 * 1. `ASSETS`     —— 全部资源的路径常量表（`as const`，字面量类型）。
 * 2. `asset(p)`   —— 把任意资源路径规范化为站点根路径。
 * 3. `heroAt(i)`  —— 轮播第 i 张（自动取模，越界不返回 undefined）。
 * 4. `pressAt(i)` —— 领导活动小图第 i 张（同上）。
 *
 * @module data/assets
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */

/* ================= I. 资源常量表 ================= */

/**
 * 全部静态资源路径表
 *
 * I. 为什么分两类
 *
 * 1. 「照片位」——首页轮播、左右栏横幅、领导活动小图 —— 使用 Wikimedia Commons
 *    的真实新闻照片（已下载进仓库 `public/assets/photos/`，构建完全离线可重现）。
 *    这些位置原本是脚本画的几何剪影，观感偏"图标"而非"新闻照片"，因此换成实拍。
 * 2. 「矢量位」——二维码、地图、徽记 —— 保留自绘 SVG：二维码要可扫描，
 *    地图与徽记要清晰可缩放，矢量是更正确的选择。
 *
 * 照片的来源、作者与许可协议见 `public/assets/CREDITS.md`。
 * 重新抓取：`node scripts/fetch-photos.mjs`（默认跳过已存在的文件）。
 *
 * II. 路径约定
 *
 * 路径一律以 `/` 开头（站点根），可直接用于 `<img src>` / CSS `url()`。
 */
export const ASSETS = {
  /** 首页轮播 5 张 16:9 实拍：演讲台 / 国会山 / 白宫 / 集会 / 签令 */
  hero: [
    '/assets/photos/hero-1.jpg',
    '/assets/photos/hero-2.jpg',
    '/assets/photos/hero-3.jpg',
    '/assets/photos/hero-4.jpg',
    '/assets/photos/hero-5.jpg',
  ],
  /** 总统官方肖像（右栏「让美国再次伟大」） */
  trumpPortrait: '/assets/photos/trump-portrait.jpg',
  /** 致敬退伍军人实拍（左栏） */
  veterans: '/assets/photos/veterans.jpg',
  /** 66 号公路沙漠实拍（左栏「团结·创新·服务」） */
  desert: '/assets/photos/desert.jpg',
  /** 移动端 APP 二维码，扫码文本 USPCS-1776-2026（矢量，保证可扫描） */
  appQr: '/assets/app-qr.svg',
  /** 美国本土 48 州轮廓图（矢量） */
  usMap: '/assets/us-map.svg',
  /** 白头海雕徽记（矢量） */
  eagleEmblem: '/assets/eagle-emblem.svg',
  /** 大象徽记（矢量） */
  elephantEmblem: '/assets/elephant-emblem.svg',
  /** 圆形国徽风徽章（矢量） */
  seal: '/assets/seal.svg',
  /** 领导活动小图 3 张（600×400 实拍） */
  press: [
    '/assets/photos/press-1.jpg',
    '/assets/photos/press-2.jpg',
    '/assets/photos/press-3.jpg',
  ],
} as const;

/* ================= II. 辅助函数 ================= */

/**
 * 把资源路径规范化为以 `/` 开头的站点根路径
 *
 * 处理三种输入：
 * 1. 已是根路径（`/assets/a.svg`）—— 原样返回；
 * 2. 相对路径（`assets/a.svg` 或 `./assets/a.svg`）—— 去掉前导 `./` 后补 `/`；
 * 3. 空串 —— 返回空串，方便调用方做「无图」分支。
 *
 * @param p - 资源路径
 * @returns 以 `/` 开头的站点根路径
 *
 * @example
 * ```ts
 * asset('assets/hero-1.svg')   // '/assets/hero-1.svg'
 * asset('./assets/hero-1.svg') // '/assets/hero-1.svg'
 * asset('/assets/hero-1.svg')  // '/assets/hero-1.svg'
 * ```
 */
export function asset(p: string): string {
  // I. 空值保护：调用方可能传入可选字段
  if (!p) return '';

  // II. 已是站点根路径，直接返回，避免出现 `//assets`
  if (p.startsWith('/')) return p;

  // III. 相对路径：剥掉前导 `./` 与多余斜杠后补根前缀
  const normalized = p.replace(/^(\.\/)+/, '').replace(/^\/+/, '');
  return `/${normalized}`;
}

/**
 * 取轮播第 i 张图（下标越界自动回绕，永不返回 undefined）
 *
 * @param i - 下标，可为负数或超出范围
 * @returns 第 i 张 hero 图的站点根路径
 */
export function heroAt(i: number): string {
  // I. 安全下标：先取整，再用取模回绕到 [0, n)
  const n = ASSETS.hero.length;
  const safe = ((Math.trunc(i) % n) + n) % n;
  return ASSETS.hero[safe];
}

/**
 * 取领导活动小图第 i 张（下标越界自动回绕）
 *
 * @param i - 下标，可为负数或超出范围
 * @returns 第 i 张 press 图的站点根路径
 */
export function pressAt(i: number): string {
  // I. 安全下标：同上，保证任意整数都有确定的图
  const n = ASSETS.press.length;
  const safe = ((Math.trunc(i) % n) + n) % n;
  return ASSETS.press[safe];
}

/** 轮播图片总数（供分页点 / 自动播放计数使用） */
export const HERO_COUNT = ASSETS.hero.length;

/** 领导活动小图总数 */
export const PRESS_COUNT = ASSETS.press.length;
