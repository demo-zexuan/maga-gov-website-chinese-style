/**
 * 首页专用数据
 *
 * I. 说明
 *
 * 1. 本文件只服务首页（`src/pages/home/**`），其他模块请勿依赖，
 *    以免首页改版时产生跨模块耦合。
 * 2. 跨模块共享的数据仍然从各自的真源取：
 *    (1) 办事统计 / 下载排行 —— `@/data/stats`
 *    (2) 公告公示 —— `@/data/notices`
 *    (3) 领导活动 —— `@/data/leaders`
 *    (4) 热门服务 —— `@/data/services`
 *    本文件只做「首页视角的二次编排」（截取条数、换算日期格式、补一句备注）。
 * 3. 公告的链接一律指向公告详情页 `/notice/:id`，与 `MARQUEE_NOTICES` 保持一致；
 *    页脚上方的走马灯由 `HomePage` 直接消费 `MARQUEE_NOTICES`，本文件不再另建别名，
 *    避免同一份公告出现两个可漂移的 href 真源。
 *
 * II. 黑色幽默的埋点位置
 *
 * 1. 页面上一共埋了 12 处，落点分别是：
 *    (1) `TOP_STORY.footnote` —— 重磅新闻的版面说明
 *    (2) `LATEST_DOCS` 第 1、2、8 条 —— 文号链式转发
 *    (3) `NEWS_DYNAMICS` 的 `remark` —— 视察当天的系统表现
 *    (4) `CABINET_DYNAMICS` 的 `remark` —— 零投诉与会议筹备
 *    (5) `GOV_TABS` 政策文件 / 规划计划 —— 任务要点与数据开放
 *    (6) `POLICY_READS` 第 1 条 —— 政策解读的阅读门槛
 *    (7) `FAQ_ROWS` 第 1 条 —— 加急的前提
 *    (8) `LOCAL_STATIONS.note` —— 分站建设进度
 *    (9) `HOT_SERVICES_NOTE` —— 未上榜服务的入口说明
 *    (10) `STAT_NOTE` —— 只增不减的统计口径
 *    (11) `SURVEY` —— 四个选项全是正面表述，且都是 100%
 *    (12) `VISITOR_COUNTER` —— 计数器早已不再接线，数字却依然精确
 * 2. 写法要求：公文语气、具体数字、不带感叹号、不带网络用语。
 *
 * @module data/home
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { ACTIVITIES } from './leaders';
import { NOTICES } from './notices';
import { DOWNLOAD_RANKING, formatNumber } from './stats';

/* ================= I. 通用行类型 ================= */

/**
 * 首页列表行
 *
 * 首页所有「圆点 + 标题 + 右对齐日期」的列表共用这个结构，
 * 便于统一交给 `NewsList` 渲染，也保证全站列表节奏一致。
 */
export interface HomeRow {
  id: string;
  title: string;
  /** 展示用日期，已按各栏目习惯格式化（YYYY-MM-DD 或 MM-DD） */
  date?: string;
  href?: string;
  /** 行下小字备注，黑色幽默的落点 */
  remark?: string;
}

/** 带选项卡的列表分组 */
export interface HomeTabGroup {
  key: string;
  label: string;
  rows: HomeRow[];
}

/* ================= II. 轮播 ================= */

/** 轮播条目（图片沿用 `heroAt(i)` 的顺序，不在此处存路径） */
export interface HomeSlide {
  id: string;
  title: string;
  sub: string;
  href: string;
}

/**
 * 首页轮播 5 张
 *
 * 第 2、4、5 条的副标题是笑点所在：全部为可核实的、自相矛盾的事实陈述。
 */
export const HERO_SLIDES: HomeSlide[] = [
  {
    id: 'hero-1',
    title: '特朗普总统出席全国政务数字化建设推进会',
    sub: '加快推进网上便民服务高质量发展 让政府更高效 让人民更满意',
    href: '/news',
  },
  {
    id: 'hero-2',
    title: '总统视察联邦便民服务大厅并现场体验网上办事',
    sub: '视察当日系统平均响应时间 0.2 秒，次日恢复至 4.8 秒',
    href: '/news/president',
  },
  {
    id: 'hero-3',
    title: '全国"一网通办"专题工作会议在华盛顿召开',
    sub: '会议要求各部门于 2026 年底前完成 2025 年尚未完成的 2024 年任务',
    href: '/news',
  },
  {
    id: 'hero-4',
    title: '联邦政务云平台（代号"鹰眼"）正式上线运行',
    sub: '新旧平台账号不互通，办件数据不互认，进度需分别查询',
    href: '/news/dept',
  },
  {
    id: 'hero-5',
    title: '全国政务服务满意度调查结果公布',
    sub: '连续 12 年保持 99.8%，是该指标唯一未出现过波动的年份区间',
    href: '/notice/ntc-003',
  },
];

/* ================= III. 头条区 ================= */

/** 头条区（轮播右侧）：红色方块角标 + 大标题 + 副链接 + 版面说明 */
export const TOP_STORY = {
  badge: '重磅',
  title: '特朗普总统主持召开全国网上便民服务高质量发展工作会议',
  links: [
    { label: '深化数字政府建设', to: '/news' },
    { label: '推进"一网通办"', to: '/service' },
    { label: '提升全民服务体验', to: '/query' },
    { label: '为更强大的美国而努力奋斗', to: '/party' },
  ],
  /** 黑色幽默 1：版面从来不够用（长度控制在一行内，避免出现孤字） */
  footnote: '本条为今日第 1 条重磅。今日共安排重磅 11 条，其余未予显示。',
};

/* ================= IV. 中部选项卡列表 ================= */

/** 「最新文件」8 条 —— 文号链式转发是本节的主笑点 */
export const LATEST_DOCS: HomeRow[] = [
  {
    id: 'doc-01',
    title: '关于转发《关于贯彻落实〈关于进一步深化"一网通办"改革的通知〉的通知》的通知',
    date: '2026-04-12',
    href: '/gov/policy',
  },
  {
    id: 'doc-02',
    title: '关于转发《关于印发〈全国电子表格规范填报工作方案〉的通知》的通知',
    date: '2026-04-11',
    href: '/gov/policy',
  },
  {
    id: 'doc-03',
    title: '关于切实加强联邦便民事项层层报送工作的指导意见（试行）',
    date: '2026-04-10',
    href: '/gov/policy',
  },
  {
    id: 'doc-04',
    title: '关于进一步优化跨州盖章审批流程的若干措施',
    date: '2026-04-09',
    href: '/gov/policy',
  },
  {
    id: 'doc-05',
    title: '关于深入推进"一网通办、一表多填、反复核验"的通知',
    date: '2026-04-08',
    href: '/gov/policy',
  },
  {
    id: 'doc-06',
    title: '关于开展 2026 年度网上服务满意度自查自评工作的通知',
    date: '2026-04-07',
    href: '/gov/policy',
  },
  {
    id: 'doc-07',
    title: '关于联邦与各州协同推进表格统一编号改革的通报',
    date: '2026-04-06',
    href: '/gov/policy',
  },
  {
    id: 'doc-08',
    title: '关于印发《2026 年联邦便民服务工作要点》的通知',
    date: '2026-04-05',
    href: '/gov/policy',
    remark: '要点共 4 项，其中 3 项为"进一步"，1 项为"深入进一步"。',
  },
];

/** 「要闻动态」8 条 */
export const NEWS_DYNAMICS: HomeRow[] = [
  {
    id: 'nws-01',
    title: '总统视察联邦便民服务大厅 现场办结一件 2019 年提交的事项',
    date: '2026-04-12',
    href: '/news',
    remark: '该事项已于视察结束后第 2 个工作日退回重办。',
  },
  { id: 'nws-02', title: '副总统出席联邦数字政府论坛并发表主旨演讲', date: '2026-04-11', href: '/news' },
  {
    id: 'nws-03',
    title: '联邦便民服务管理局部署 2026 年度重点任务',
    date: '2026-04-10',
    href: '/news/dept',
    remark: '重点任务共 12 项，其中 11 项的工作要求为"持续推进"。',
  },
  { id: 'nws-04', title: '全国政务服务事项标准化培训在芝加哥举行', date: '2026-04-09', href: '/news/dept' },
  {
    id: 'nws-05',
    title: '"鹰眼"政务服务平台完成第 4 次试点验收',
    date: '2026-04-08',
    href: '/news/dept',
    remark: '本次验收未发现问题。反馈问题的入口已于上月关闭。',
  },
  {
    id: 'nws-06',
    title: '联邦与各州签署政务数据共享合作备忘录',
    date: '2026-04-07',
    href: '/news/dept',
    remark: '备忘录全文 84 页，实际共享字段共 3 个。',
  },
  {
    id: 'nws-07',
    title: '便民服务热线完成年度话务量统计',
    date: '2026-04-06',
    href: '/news/dept',
    remark: '全年人工接通率 12%，其余为占线。占线部分不计入统计。',
  },
  { id: 'nws-08', title: '网上办事大厅新增上线事项 1,024 项', date: '2026-04-05', href: '/news' },
];

/** 「国务院动态」8 条 */
export const CABINET_DYNAMICS: HomeRow[] = [
  { id: 'cab-01', title: '联邦政府效率办公室召开全体会议 部署精简办事流程工作', date: '2026-04-12', href: '/news/dept' },
  {
    id: 'cab-02',
    title: '关于在全国推广"零投诉"经验做法的通知',
    date: '2026-04-11',
    href: '/news/dept',
    remark: '推广方式为取消投诉入口。首批试点单位已实现连续 14 个月零投诉。',
  },
  { id: 'cab-03', title: '联邦总务署启动 2026 年度办公用品集中采购', date: '2026-04-10', href: '/news/dept' },
  {
    id: 'cab-04',
    title: '国务院办公厅印发《政务数据共享管理办法》',
    date: '2026-04-09',
    href: '/news/dept',
    remark: '办法共 6 章 48 条，其中 47 条为保密条款。',
  },
  { id: 'cab-05', title: '联邦人事管理局开展公务员表格填写能力专项培训', date: '2026-04-08', href: '/news/dept' },
  {
    id: 'cab-06',
    title: '全国政务服务标准化技术委员会成立',
    date: '2026-04-07',
    href: '/news/dept',
    remark: '委员会第一次全体会议决定：于本月内确定本次会议的召开时间。',
  },
  {
    id: 'cab-07',
    title: '联邦审计署发布 2025 年度政务信息系统审计报告',
    date: '2026-04-06',
    href: '/news/dept',
    remark: '报告结论为"基本符合"，附注部分共 218 页。',
  },
  { id: 'cab-08', title: '国务院要求各部门于 2026 年 6 月前完成 2024 年度整改任务', date: '2026-04-05', href: '/news/dept' },
];

/** 中部选项卡列表：三个 tab，各 8 条 */
export const CENTER_TABS: HomeTabGroup[] = [
  { key: 'docs', label: '最新文件', rows: LATEST_DOCS },
  { key: 'news', label: '要闻动态', rows: NEWS_DYNAMICS },
  { key: 'cabinet', label: '国务院动态', rows: CABINET_DYNAMICS },
];

/* ================= V. 右栏 ================= */

/** 「公告公示」5 条 —— 取自全站公告真源，点击进入公告详情页 `/notice/:id` */
export const NOTICE_ROWS: HomeRow[] = NOTICES.slice(0, 5).map((n) => ({
  id: n.id,
  title: n.title,
  date: n.date,
  href: `/notice/${n.id}`,
}));

/**
 * 「办事统计」四行的口径说明
 *
 * 黑色幽默 10：把"只增不减"写成一项统计制度。
 */
export const STAT_NOTE = '本数字自 2019 年上线以来未出现过回落。若出现下降，属显示错误，页面将于次日恢复。';

/** 办事统计的实时展示值：今日受理绑定全局 `todayCount`，其余为常量 */
export const STAT_TICKER_BASE = 8_888_888;

/** 把今日受理量格式化为千分位字符串 */
export function formatTodayCount(n: number): string {
  return formatNumber(Math.max(n, STAT_TICKER_BASE));
}

/* ================= VI. 底部面板 ================= */

/** 「政务公开」4 个 tab，各 5 条 */
export const GOV_TABS: HomeTabGroup[] = [
  {
    key: 'policy',
    label: '政策文件',
    rows: [
      { id: 'gp-01', title: '2025 年联邦便民服务工作任务要点', date: '2026-04-12' },
      { id: 'gp-02', title: '关于推进政务服务数据开放共享的实施方案', date: '2026-04-10' },
      { id: 'gp-03', title: '2025 年政府服务能力建设年度报告', date: '2026-04-08' },
      { id: 'gp-04', title: '联邦便民服务平台运营情况通报', date: '2026-04-06' },
      { id: 'gp-05', title: '关于加强数据安全与个人隐私保护的意见', date: '2026-04-03' },
    ],
  },
  {
    key: 'plan',
    label: '规划计划',
    rows: [
      { id: 'gn-01', title: '"数字政府 2026"专项规划（征求意见稿）', date: '2026-04-12' },
      { id: 'gn-02', title: '联邦便民服务设施三年建设计划', date: '2026-04-09' },
      {
        id: 'gn-03',
        title: '政务数据开放年度计划',
        date: '2026-04-07',
        remark: '开放时间另行通知。本计划自 2021 年起每年照此表述。',
      },
      { id: 'gn-04', title: '各州政务服务标准化推进计划', date: '2026-04-05' },
      { id: 'gn-05', title: '联邦政务云资源使用规划（2026—2028）', date: '2026-04-02' },
    ],
  },
  {
    key: 'finance',
    label: '财政信息',
    rows: [
      { id: 'gf-01', title: '2025 年度联邦政务服务经费决算', date: '2026-04-12' },
      { id: 'gf-02', title: '2026 年度政务信息化预算安排', date: '2026-04-10' },
      {
        id: 'gf-03',
        title: '政务云资源采购与使用情况',
        date: '2026-04-07',
        remark: '云资源年度使用率 3%，费用按 100% 结算。',
      },
      { id: 'gf-04', title: '便民服务热线话务外包费用明细', date: '2026-04-04' },
      { id: 'gf-05', title: '政务服务满意度调查专项经费说明', date: '2026-04-01' },
    ],
  },
  {
    key: 'personnel',
    label: '人事信息',
    rows: [
      { id: 'gh-01', title: '关于联邦便民服务管理局局长任职的通知', date: '2026-04-12' },
      { id: 'gh-02', title: '关于数字政府建设办公室主任免职的通知', date: '2026-04-09' },
      {
        id: 'gh-03',
        title: '联邦社会保障署领导班子分工调整',
        date: '2026-04-06',
        remark: '分管工作共 4 项，其中 1 项已列入下年度计划。',
      },
      { id: 'gh-04', title: '2026 年度公务员招录结果公示', date: '2026-04-03' },
      { id: 'gh-05', title: '关于表彰政务服务标兵的通报', date: '2026-03-31' },
    ],
  },
];

/** 「党建引领」4 条理念 */
export const PARTY_LINES: string[] = [
  '坚定自由市场信念 提升政府服务效率',
  '发扬个人责任精神 建设高效服务型政府',
  '以实干推动美国梦 用服务凝聚全国力量',
  '不忘建国初心 牢记为民服务使命',
];

/** 「党建引领」导语两行 */
export const PARTY_LEAD = ['坚持以共和党先进治理理念', '引领便民服务工作'];

/** 「地方分站」6 个州/特区 */
export const LOCAL_STATIONS: { code: string; label: string }[] = [
  { code: 'DC', label: '华盛顿特区' },
  { code: 'TX', label: '德克萨斯州' },
  { code: 'FL', label: '佛罗里达州' },
  { code: 'CA', label: '加利福尼亚州' },
  { code: 'NY', label: '纽约州' },
  { code: 'OH', label: '俄亥俄州' },
];

/** 地方分站栏目的说明（黑色幽默 8） */
export const LOCAL_STATIONS_NOTE = '本栏目收录全部 50 个州。其中 44 个州的分站正在建设中，开通时间以各州通知为准。';

/** 「领导活动」6 条，日期用 MM-DD 短格式 */
export const ACTIVITY_ROWS: HomeRow[] = ACTIVITIES.slice(0, 6).map((a) => ({
  id: a.id,
  title: a.title,
  date: a.date.slice(5),
  href: `/local/governor`,
}));

/** 「政策解读」4 条 */
export const POLICY_READS: HomeRow[] = [
  {
    id: 'pr-01',
    title: '《一网通办》政策解读',
    date: '04-12',
    href: '/law/interpret',
    remark: '解读全文 1.2 万字，要点见第 3 页。第 3 页需另行索取。',
  },
  { id: 'pr-02', title: '联邦补贴申请常见问题解答', date: '04-10', href: '/law/interpret' },
  {
    id: 'pr-03',
    title: '电子表格规范填报指南',
    date: '04-08',
    href: '/law/interpret',
    remark: '指南共 96 页，其中 92 页为表格样式示例。',
  },
  { id: 'pr-04', title: '跨州业务办理流程详解', date: '04-06', href: '/law/interpret' },
];

/** 「常见问题」4 条 */
export const FAQ_ROWS: HomeRow[] = [
  {
    id: 'fq-01',
    title: '护照办理需要多长时间？',
    date: '04-12',
    href: '/query',
    remark: '标准时限 8 周，加急 12 个工作日。前提是您不需要加急。',
  },
  {
    id: 'fq-02',
    title: '如何预约枪支许可？',
    date: '04-10',
    href: '/query',
    remark: '本页面的预约按钮为展示用途，真实预约请咨询当地枪店。',
  },
  { id: 'fq-03', title: '退税进度如何查询？', date: '04-08', href: '/query', remark: '您的退税正在处理中。' },
  { id: 'fq-04', title: '更换驾照需要哪些材料？', date: '04-06', href: '/query' },
  { id: 'fq-05', title: '外籍人士如何在美国办理社保？', date: '04-04', href: '/query' },
];

/** 「下载排行」5 条，取自全站排行真源，日期按榜单顺序倒排 */
export const DOWNLOAD_ROWS: HomeRow[] = DOWNLOAD_RANKING.map((r, i) => ({
  id: r.id,
  title: r.title,
  date: `04-${String(12 - i * 2).padStart(2, '0')}`,
  href: '/download',
  remark: r.remark,
}));

/* ================= VII. 左栏 ================= */

/** 「伟大的美国梦」4 条 —— 与参考图顺序严格一致 */
export const DREAM_ITEMS: { icon: string; text: string }[] = [
  { icon: 'shield', text: '让办事更简单' },
  { icon: 'passport', text: '让数据多跑路' },
  { icon: 'subsidy', text: '让民众少跑腿' },
  { icon: 'veteran', text: '让美国更强大' },
];

/** 移动端 APP 卡片文案 */
export const APP_CARD = {
  title: '联邦便民服务',
  title2: '移动端 APP',
  slogan: '随人随身 办事不排队',
  /** 扫码说明（黑色幽默：两端不互通） */
  note: '扫码下载。iOS 版与 Android 版账号不互通，办件记录需分别查询，互相不认。',
  qrCaption: '扫码即用',
};

/** 移动端 APP 下方两条小横幅 */
export const APP_CHIPS = ['随人随身', '办事不排队'];

/** 图片横幅（团结 · 创新 · 服务） */
export const UNITY_BANNER = {
  title: '团结 · 创新 · 服务',
  sub: '共建更美好的美国',
};

/** 退伍军人横幅 */
export const VETERAN_BANNER = {
  title: '致敬我们的退伍军人',
  sub: '服务 · 尊重 · 关爱',
  note: '本栏目配图摄于 2019 年。图中退役军人已于 2021 年再次提交服役证明。',
};

/* ================= VIII. 热门服务 ================= */

/** 热门服务面板底部说明（黑色幽默 9） */
export const HOT_SERVICES_NOTE = '以上 8 项为热门服务。其余 1,139 项服务因不够热门，暂不提供入口。';

/* ================= IX. 中栏补充模块 ================= */

/**
 * 「网上调查」
 *
 * 黑色幽默 11：四个选项全是正面表述，且每一项都是 100%。
 * 老政务网站的调查问卷从来不会出现负面选项，这是本项目最想留存的一个细节。
 */
export const SURVEY = {
  question: '您对本站网上办事服务的总体评价是（单选）：',
  options: [
    { label: '非常满意', percent: 100 },
    { label: '满意', percent: 100 },
    { label: '基本满意', percent: 100 },
    { label: '极其满意', percent: 100 },
  ],
  note: '本次调查已收到 128,406 份问卷，满意度 100%。问卷共 1 题，为单选题。',
};

/** 「便民服务直通车」10 个快捷入口，两行排布 */
export const DIRECT_LINKS: { label: string; to: string }[] = [
  { label: '社保卡挂失', to: '/service' },
  { label: '电子证照', to: '/query' },
  { label: '跨州通办', to: '/service' },
  { label: '无障碍服务', to: '/accessibility' },
  { label: '长者助手', to: '/elder' },
  { label: '企业开办', to: '/service/business' },
  { label: '住房公积金', to: '/service' },
  { label: '出入境预约', to: '/service' },
  { label: '办件进度查询', to: '/service/track' },
  { label: '表格下载中心', to: '/download' },
];

/**
 * 右栏「访问量计数器」
 *
 * 黑色幽默 12：计数器早就不再接线，但数字依然精确。
 */
export const VISITOR_COUNTER = {
  label: '您是第',
  unit: '位访问者',
  /** 逐位渲染成老式里程表数字格 */
  digits: '177600000',
  note: '计数器自 2019 年起未再接线，当前数值为估计值。',
};
