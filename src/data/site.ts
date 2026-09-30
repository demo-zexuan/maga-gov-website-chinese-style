/**
 * 站点全局配置
 *
 * I. 内容
 *
 * 1. 站点身份信息（中英文名、口号、热线、备案号）
 * 2. 主导航结构（含二级栏目），这是全站路由的唯一真源
 * 3. 页脚链接组
 * 4. 顶部工具条的功能项
 *
 * II. 重要声明
 *
 * 本站为纯娱乐讽刺作品，不包含任何政治倾向。站内全部数据、文号、
 * 人物讲话、统计数字均为虚构，热线电话 1776-2026 并不存在。
 *
 * @module data/site
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */

/* ================= 类型 ================= */

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  /** 栏目名 */
  label: string;
  /** 路由路径（hash 路由下的 path 部分） */
  path: string;
  /** 二级栏目 */
  children?: NavChild[];
  /** 是否首页（渲染小房子图标） */
  isHome?: boolean;
}

/* ================= 站点身份 ================= */

export const SITE = {
  title: '美利坚合众国网上便民服务中心',
  titleEn: 'United States Public Convenience Service Portal',
  shortTitle: '美利坚便民服务中心',
  slogan: ['人民至上', '服务全民', '高效便捷', '让美国更强大'],
  sloganHero: '人民至上 · 服务全民 · 高效便捷 · 让美国更强大',
  claims: ['更便民', '更高效', '更强大的美国'],
  hotline: '1776-2026',
  hotlineNote: '全天候 · 一站式 · 为人民服务',
  /** 虚构备案号：用美国独立年份 1776 与建国纪年混搭，纯搞笑 */
  icp: '美利坚合众国政务服务备案 1776-2026 号',
  /** 虚构公安备案 */
  police: '联邦网络安全备案 US-1776-2026-DC',
  /** 主办单位 */
  organizer: '美利坚合众国联邦便民服务管理局（虚构机构）',
  /** 承办单位 */
  operator: '白宫数字政府建设办公室',
  /** 政府网站标识码 */
  siteCode: 'BM177620260001',
  /** 页脚标语 */
  footerSlogan: '让美国再次伟大',
  /** 版权年份 */
  copyright: '© 1776-2026 美利坚合众国网上便民服务中心 版权所有',
} as const;

/* ================= 主导航 ================= */

/**
 * 主导航结构 —— 全站路由唯一真源
 *
 * 新增页面时必须先在这里登记，再在 src/App.tsx 的路由表中注册组件。
 */
export const NAV_ITEMS: NavItem[] = [
  { label: '首页', path: '/', isHome: true },
  {
    label: '要闻动态',
    path: '/news',
    children: [
      { label: '头条新闻', path: '/news' },
      { label: '总统活动', path: '/news/president' },
      { label: '部委动态', path: '/news/dept' },
      { label: '地方传真', path: '/news/local' },
    ],
  },
  {
    label: '政务公开',
    path: '/gov',
    children: [
      { label: '政策文件', path: '/gov/policy' },
      { label: '规划计划', path: '/gov/plan' },
      { label: '财政信息', path: '/gov/finance' },
      { label: '人事信息', path: '/gov/personnel' },
      { label: '信息公开年报', path: '/gov/report' },
    ],
  },
  {
    label: '政务服务',
    path: '/service',
    children: [
      { label: '办事大厅', path: '/service' },
      { label: '个人办事', path: '/service/personal' },
      { label: '企业办事', path: '/service/business' },
      { label: '办件公示', path: '/service/records' },
      { label: '办事进度查询', path: '/service/track' },
    ],
  },
  {
    label: '党建引领',
    path: '/party',
    children: [
      { label: '党建要闻', path: '/party' },
      { label: '理论学习', path: '/party/study' },
      { label: '先进典型', path: '/party/model' },
      { label: '廉政建设', path: '/party/clean' },
    ],
  },
  {
    label: '总统讲话',
    path: '/speech',
    children: [
      { label: '重要讲话', path: '/speech' },
      { label: '每日推文', path: '/speech/tweets' },
      { label: '记者会实录', path: '/speech/press' },
    ],
  },
  {
    label: '政策法规',
    path: '/law',
    children: [
      { label: '联邦法律', path: '/law' },
      { label: '行政命令', path: '/law/order' },
      { label: '部门规章', path: '/law/rule' },
      { label: '法规解读', path: '/law/interpret' },
    ],
  },
  {
    label: '地方频道',
    path: '/local',
    children: [
      { label: '各州分站', path: '/local' },
      { label: '华盛顿特区', path: '/local/DC' },
      { label: '州长活动', path: '/local/governor' },
    ],
  },
  {
    label: '便民查询',
    path: '/query',
    children: [
      { label: '查询总入口', path: '/query' },
      { label: '社保查询', path: '/query/social' },
      { label: '退税进度', path: '/query/tax-refund' },
      { label: '护照办理进度', path: '/query/passport' },
      { label: '枪支许可预约', path: '/query/gun' },
      { label: '交通罚单查询', path: '/query/ticket' },
    ],
  },
  {
    label: '下载中心',
    path: '/download',
    children: [
      { label: '表格下载', path: '/download' },
      { label: '办事指南', path: '/download/guide' },
      { label: '客户端下载', path: '/download/app' },
    ],
  },
  {
    label: '互动交流',
    path: '/interact',
    children: [
      { label: '我要写信', path: '/interact' },
      { label: '建言献策', path: '/interact/advice' },
      { label: '在线调查', path: '/interact/survey' },
      { label: '常见问题', path: '/interact/faq' },
      { label: '信件选登', path: '/interact/letters' },
    ],
  },
];

/* ================= 顶部工具条 ================= */

export const TOPBAR_LINKS = [
  { label: 'English', path: '/english' },
  { label: '无障碍', path: '/accessibility' },
  { label: '长者模式', path: '/elder' },
  { label: '登录', path: '/login' },
  { label: '注册', path: '/register' },
] as const;

/* ================= 页脚 ================= */

export const FOOTER_LINKS: { label: string; items: NavChild[] }[] = [
  {
    label: '关于本站',
    items: [
      { label: '关于我们', path: '/about' },
      { label: '网站地图', path: '/sitemap' },
      { label: '隐私政策', path: '/privacy' },
      { label: '使用条款', path: '/terms' },
      { label: '联系我们', path: '/contact' },
      { label: '无障碍声明', path: '/accessibility' },
    ],
  },
  {
    label: '友情链接',
    items: [
      { label: '白宫官网', path: '/link/whitehouse' },
      { label: '国会图书馆', path: '/link/loc' },
      { label: '国税局', path: '/link/irs' },
      { label: '社会保障署', path: '/link/ssa' },
      { label: '联邦快递', path: '/link/usps' },
      { label: '美国之音', path: '/link/voa' },
    ],
  },
];

/** 页面底部的固定声明 —— 对"本站为虚构讽刺作品"的免责说明 */
export const DISCLAIMER =
  '本站为纯娱乐讽刺作品，不含任何政治倾向。全部内容、数据、文号、讲话均为虚构，' +
  '与任何真实机构、个人无关。热线 1776-2026 并不存在，请勿拨打。';

/* ================= 工具函数 ================= */

/**
 * 生成"今天"的日期字符串
 *
 * 古早政务网站顶栏永远显示"今天"，这里保持一致；同时提供一个
 * 固定的基准日期用于生成稳定的内容时间线。
 *
 * @returns 形如 "2026年9月30日 星期三" 的字符串
 */
export function todayCn(): string {
  const d = new Date();
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][
    d.getDay()
  ];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${week}`;
}

/** 农历日期（虚构算法：把公历日期映射到一组农历词，纯搞笑，不要当真） */
export function lunarCn(): string {
  const d = new Date();
  const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const days = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ];
  // 用一年中的第几天做一个稳定的偏移，保证同一天多次渲染结果一致
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  const m = months[dayOfYear % 12];
  const day = days[(dayOfYear * 7) % 30];
  return `农历${m}${day}`;
}

/** 华盛顿特区天气（虚构：按小时做一个稳定波动的假天气，永不联网） */
export function dcWeather(): { icon: string; text: string; low: number; high: number } {
  const h = new Date().getHours();
  const seed = new Date().getDate();
  const icons = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌤️'];
  const texts = ['晴', '多云', '阴', '小雨', '雷阵雨', '晴间多云'];
  const i = (seed + h) % icons.length;
  const base = 12 + (seed % 9);
  return { icon: icons[i], text: texts[i], low: base, high: base + 12 };
}
