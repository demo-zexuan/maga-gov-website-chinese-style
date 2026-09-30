/**
 * 便民查询模块数据
 *
 * I. 内容清单
 *
 * 1. QUERY_TOOLS         —— 6 项查询事项清单，供总入口卡片、左栏导航与路由分发共用
 * 2. QUERY_STATES        —— 交通罚单查询的州别选项
 * 3. buildTicketRecords  —— 交通罚单模拟记录（按车牌与州生成）
 * 4. QUERY_FAQS          —— 总入口常见问题
 * 5. QUERY_INSTRUCTIONS / QUERY_NOTICES —— 使用说明与查询须知
 * 6. 各工具的模拟常量（社保、退税、护照、枪支、排队）
 *
 * II. 数据约定
 *
 * 1. 本文件全部数据均为虚构演示数据，不指向任何真实机构、个人或事件。
 * 2. 文案语气统一为公文语气：陈述事实、给出时限、交代办理方式；荒谬之处只藏在
 *    数字与流程的自相矛盾里，不使用感叹号，不使用表情符号。
 * 3. 各工具的结果数值集中在此处声明，便于统一修订，避免散落在组件里。
 *
 * @module data/query-data
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { Faq } from './types';

/* ================= 1. 查询事项清单 ================= */

/** 查询事项 key，与路由 `/query/:tool` 一一对应 */
export type QueryToolKey = 'social' | 'tax-refund' | 'passport' | 'gun' | 'ticket' | 'queue';

export interface QueryTool {
  key: QueryToolKey;
  /** 事项名称 */
  name: string;
  /** 图标 key，对应 ServiceIcon 的 name */
  icon: string;
  /** 主管部门 */
  department: string;
  /** 承诺时限 */
  duration: string;
  /** 法定时限 */
  legalDuration: string;
  /** 入口卡片上的一句话说明 */
  intro: string;
  /** 一句话提示（写在右栏「办理信息」下方） */
  quip: string;
}

/**
 * 6 项便民查询事项
 *
 * 顺序即总入口的卡片顺序，也是左栏导航顺序，不要随意调整。
 */
export const QUERY_TOOLS: QueryTool[] = [
  {
    key: 'social',
    name: '社保查询',
    icon: 'shield',
    department: '联邦社会保障署',
    duration: '即时办结',
    legalDuration: '20 个工作日',
    intro: '查询累计缴费月数、参保状态与预计退休年份。',
    quip: '本事项承诺即时办结。即时办结所需时间为 20 个工作日。',
  },
  {
    key: 'tax-refund',
    name: '退税进度查询',
    icon: 'refund',
    department: '联邦国内税务局',
    duration: '即时查询',
    legalDuration: '21 个工作日',
    intro: '查询退税申报的处理进度与预计到账时间。',
    quip: '当日查询次数不限。次数统计于次日 00:00 清零，清零记录不对外提供。',
  },
  {
    key: 'passport',
    name: '护照办理进度',
    icon: 'passport',
    department: '联邦国务院领事事务局',
    duration: '15 个工作日',
    legalDuration: '8 周',
    intro: '按受理编号查询护照制作与领取环节的当前进展。',
    quip: '查询结果每小时更新一次。上次更新时间为上次更新时间。',
  },
  {
    key: 'gun',
    name: '枪支许可预约',
    icon: 'gun',
    department: '联邦烟酒枪炮及爆炸物管理局',
    duration: '预约后 90 天',
    legalDuration: '不限',
    intro: '选择到访日期与时段，取得预约号或候补号。',
    quip: '预约名额每日 0 至 6 个。名额数量以当日实际放号为准。',
  },
  {
    key: 'ticket',
    name: '交通罚单查询',
    icon: 'car',
    department: '各州机动车管理局',
    duration: '即时办结',
    legalDuration: '30 个工作日',
    intro: '按车牌与州查询罚单记录、应缴金额与缴纳方式。',
    quip: '记录长期保存。本系统自启用以来未删除过任何一条记录。',
  },
  {
    key: 'queue',
    name: '现场排队取号',
    icon: 'license',
    department: '联邦政务服务中心',
    duration: '当日有效',
    legalDuration: '当日有效',
    intro: '取得现场办事排队号，查看前方等待人数与预计等待时间。',
    quip: '号源每日放号。放号数量以叫号数量为准。',
  },
];

/** 判断字符串是否为合法的查询事项 key */
export function isQueryToolKey(value: string): value is QueryToolKey {
  return QUERY_TOOLS.some((t) => t.key === value);
}

/** 按 key 取查询事项 */
export function findQueryTool(key: string): QueryTool | undefined {
  return QUERY_TOOLS.find((t) => t.key === key);
}

/* ================= 2. 州别选项 ================= */

export interface QueryStateOption {
  code: string;
  name: string;
}

/**
 * 交通罚单查询的州别选项
 *
 * 最后一项为「其他地区」，该选项用于呈现"数据尚未接入"的空态，
 * 空态同样是本系统的正式状态之一。
 */
export const QUERY_STATES: QueryStateOption[] = [
  { code: 'CA', name: '加利福尼亚州' },
  { code: 'NY', name: '纽约州' },
  { code: 'TX', name: '得克萨斯州' },
  { code: 'FL', name: '佛罗里达州' },
  { code: 'IL', name: '伊利诺伊州' },
  { code: 'PA', name: '宾夕法尼亚州' },
  { code: 'OH', name: '俄亥俄州' },
  { code: 'GA', name: '佐治亚州' },
  { code: 'NC', name: '北卡罗来纳州' },
  { code: 'MI', name: '密歇根州' },
  { code: 'NJ', name: '新泽西州' },
  { code: 'VA', name: '弗吉尼亚州' },
  { code: 'WA', name: '华盛顿州' },
  { code: 'AZ', name: '亚利桑那州' },
  { code: 'MA', name: '马萨诸塞州' },
  { code: 'TN', name: '田纳西州' },
  { code: 'IN', name: '印第安纳州' },
  { code: 'MD', name: '马里兰州' },
  { code: 'CO', name: '科罗拉多州' },
  { code: 'DC', name: '哥伦比亚特区' },
  { code: 'OTHER', name: '其他地区（尚未接入）' },
];

/* ================= 3. 交通罚单记录 ================= */

export interface TicketRecord {
  id: string;
  date: string;
  reason: string;
  place: string;
  /** 应缴金额（美元） */
  amount: number;
  status: string;
  remark: string;
}

/**
 * 生成罚单记录
 *
 * 记录内容与车牌无关，仅把车牌与州名回填到记录里，以体现"本次查询确实用了
 * 您输入的条件"。其中若干条记录属于本系统的历史遗留数据，不予清理。
 *
 * @param plate    车牌号
 * @param stateName 州名（用于拼接地名）
 * @returns 罚单记录数组
 */
export function buildTicketRecords(plate: string, stateName: string): TicketRecord[] {
  return [
    {
      id: 'T-1974-0811-0007',
      date: '1974-08-11',
      reason: '超速行驶（限速 30 英里，实测 35 英里）',
      place: '马里兰州 355 号公路 12 英里处',
      amount: 15,
      status: '未缴纳',
      remark: '追缴时效已届满 51 年。本系统未设置注销功能，故该记录继续保留。',
    },
    {
      id: 'T-2019-0314-0221',
      date: '2019-03-14',
      reason: '停车超时 12 分钟',
      place: `${stateName} K 街 1200 号公共停车位`,
      amount: 0,
      status: '应缴金额为零',
      remark: '本笔无需缴纳。结案手续须由车辆所有人本人到场办理，办理现场不收取任何费用。',
    },
    {
      id: 'T-2023-0702-1105',
      date: '2023-07-02',
      reason: '未按规定使用安全带',
      place: '弗吉尼亚州 66 号州际公路东行 57 英里处',
      amount: 85,
      status: '已缴纳（系统未记录）',
      remark: '系统未收到该笔款项。请提供缴纳凭证以证明已缴纳；凭证须由本系统出具。',
    },
    {
      id: 'T-2026-0420-3312',
      date: '2026-04-20',
      reason: '未按标志停车',
      place: `${stateName} 第 14 街与宪法大道交叉口`,
      amount: 120,
      status: '处理中',
      remark: `车牌 ${plate} 的处理状态每 30 日更新一次，更新当日不显示更新结果。`,
    },
  ];
}

/* ================= 4. 常见问题 ================= */

/**
 * 总入口常见问题
 *
 * 本文件内的常量不引用其他模块的数据文件，避免并行开发期间产生交叉依赖。
 */
export const QUERY_FAQS: Faq[] = [
  {
    id: 'faq-query-01',
    question: '查询不到结果怎么办',
    answer: '请在查询到结果后重新查询。若重新查询后仍无结果，说明本次查询已结束。',
    footnote: '2026 年 1 月至 9 月，本入口共受理"查询不到结果"类咨询 2,418 件，全部在重新查询后办结。',
    category: '查询',
  },
  {
    id: 'faq-query-02',
    question: '查询结果与实际情况不一致怎么办',
    answer: '以查询结果为准。本系统数据为最终数据，实际情况如与本系统不一致，请以本系统数据为准并更新实际情况。',
    category: '查询',
  },
  {
    id: 'faq-query-03',
    question: '系统显示维护中，是否影响查询',
    answer: '不影响。维护窗口为每日 00:00-24:00，维护期间查询功能正常开放，维护状态按维护状态显示。',
    footnote: '唯一不在维护的时间段为维护时间。',
    category: '系统',
  },
  {
    id: 'faq-query-04',
    question: '热线打不通怎么办',
    answer: '占线时请挂机后重新拨打。本热线不提供回拨服务，也不提供留言服务。',
    footnote: '如需留言，请拨打本热线。',
    category: '系统',
  },
  {
    id: 'faq-query-05',
    question: '查询是否收费',
    answer: '本系统全部查询事项免费。如您被收取费用，说明您使用的不是本系统。',
    category: '收费',
  },
  {
    id: 'faq-query-06',
    question: '能否查询他人的信息',
    answer: '可以查询本人的信息。查询他人信息须经本人书面授权，授权书须由本人到场签署，本人到场须提前预约，预约须由本人办理。',
    category: '查询',
  },
];

/* ================= 5. 使用说明与查询须知 ================= */

/** 总入口「使用说明」条目 */
export const QUERY_INSTRUCTIONS: string[] = [
  '一、请在本页选择查询事项。事项清单以外的查询事项，请在本页选择。',
  '二、请在查询页填写必填项后提交。带星号的项目为必填项，未带星号的项目同样必填。',
  '三、查询结果为系统实时生成。如结果与预期不符，请重新查询，直至结果与预期相符或不再查询。',
  '四、本说明在每次查询前均需阅读。本系统不保存阅读记录，故每次查询前请重新阅读本说明。',
  '五、如需本说明的纸质版，请在下载中心下载后自行打印，下载中心不提供打印服务。',
];

/** 总入口、右栏与查询页共用的查询须知 */
export const QUERY_NOTICES: string[] = [
  '系统维护窗口为每日 00:00-24:00。维护期间查询功能正常，维护状态显示为维护中。',
  '查询结果不作为办事依据。办事依据以办理结果为准，办理结果以查询结果为准。',
  '同一事项重复查询不产生新的结果。如产生新的结果，说明该事项状态已更新。',
];

/* ================= 6. 各工具模拟常量 ================= */

/* ---- 社保查询 ---- */

/** 累计缴费月数（固定值，与缴费年限无关） */
export const SOCIAL_PAID_MONTHS = 4180;
/** 预计退休年份 */
export const SOCIAL_RETIRE_YEAR = 2087;
/** 法定退休年龄 */
export const SOCIAL_RETIRE_AGE = 67;
/** 数据最近一次更新时间 */
export const SOCIAL_DATA_UPDATED = '2019-03-14';

/* ---- 退税进度 ---- */

/** 退税申报受理日期，也是状态冻结日期 */
export const TAX_ACCEPTED_DATE = '2019-03-14';
/** 进度条展示百分比（固定值） */
export const TAX_PROGRESS_PERCENT = 61;
/** 预计到账时间（工作日） */
export const TAX_ETA_WORKDAYS = 21;

/* ---- 护照办理进度 ---- */

/** 时间轴环节 */
export const PASSPORT_STAGES: { key: string; name: string; note: string }[] = [
  { key: 'accepted', name: '已受理', note: '申请材料已接收，编号已生成。' },
  { key: 'reviewing', name: '审核中', note: '材料正在审核。审核期间不提供审核进度。' },
  { key: 'making', name: '制作中', note: '审核通过后进入制作环节。' },
  { key: 'ready', name: '待领取', note: '制作完成后可到受理网点领取。' },
];

/** 允许的受理编号前缀（其余前缀视为未查询到记录） */
export const PASSPORT_PREFIXES = ['PA', 'PB', 'PP', 'PS'];
/** 受理编号长度：2 位字母 + 10 位数字 */
export const PASSPORT_CODE_LENGTH = 12;
/** 当前环节已持续的工作日数 */
export const PASSPORT_STUCK_WORKDAYS = 2431;

/* ---- 枪支许可预约 ---- */

/** 可预约时段（每时段限 1 人） */
export const GUN_SLOTS: string[] = [
  '09:00-09:15',
  '09:30-09:45',
  '10:00-10:15',
  '13:30-13:45',
  '14:00-14:15',
  '14:30-14:45',
];

/** 预约失败提示（前两次提交触发） */
export const GUN_SLOT_TAKEN_TEXT = '所选时段已被他人预约，请重新选择。';
/** 重试次数上限 */
export const GUN_RETRY_LIMIT = 3;
/** 候补号前缀 */
export const GUN_WAITLIST_PREFIX = 'G';

/* ---- 现场排队取号 ---- */

/** 排队号起始序号 */
export const QUEUE_START_NUMBER = 214_882;
/** 当前叫号 */
export const QUEUE_CALLING_NUMBER = 12;
/** 在办窗口数 */
export const QUEUE_WINDOWS = 3;
/** 业务类型选项 */
export const QUEUE_SERVICE_TYPES: string[] = [
  '综合业务（全部事项）',
  '社保与医保事项',
  '证照领取',
  '咨询与投诉',
];
