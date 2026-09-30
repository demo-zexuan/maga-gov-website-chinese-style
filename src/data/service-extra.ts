/**
 * 政务服务补充数据
 *
 * I. 为什么单独建这个文件
 *
 * `@/data/services` 是首页「热门服务」与全站共享的事项真源，改动它会波及其他模块，
 * 因此政务服务模块自有的展示型数据（办件公示、窗口、网点）统一放在这里，
 * 只做单向依赖：`service-extra → services`，绝不反向引用。
 *
 * II. 内容清单
 *
 * 1. CASE_RECORDS —— 办件公示记录（36 条，含编号 / 事项 / 脱敏申请人 / 状态 / 承办窗口）
 * 2. WINDOWS      —— 大厅窗口信息（含排队人数与开放时间）
 * 3. OFFICES      —— 办事网点（含排队人数与平均等待）
 *
 * III. 写作约定
 *
 * 1. 所有数据均为虚构，仅用于演示；日期以 SERVICE_TODAY 为基准日。
 * 2. 荒谬之处必须落在具体数字与具体事实里，语气保持标准公文腔，不使用感叹号。
 * 3. 群众评分字段恒为 5.0 —— 这不是数据缺失，这是公示范围的定义（见 `@/data/faqs`）。
 *
 * @module data/service-extra
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { findService } from './services';

/* ================= I. 常量 ================= */

/** 演示基准日：办件公示的「今日」以该日期为准，保证静态站点展示稳定 */
export const SERVICE_TODAY = '2026-09-30';

/* ================= II. 办件公示 ================= */

/** 办件状态 */
export type CaseStatus = '已办结' | '办理中' | '已受理' | '已退回' | '待补正';

/** 办件公示记录 */
export interface CaseRecord {
  /** 受理编号，形如 USPCS-2026-104271 */
  id: string;
  /** 关联事项 id */
  serviceId: string;
  /** 事项名称（由 serviceId 解析） */
  serviceName: string;
  /** 申请人（脱敏） */
  applicant: string;
  /** 受理日期 YYYY-MM-DD */
  applyDate: string;
  /** 办结日期；未办结时为空 */
  finishDate?: string;
  status: CaseStatus;
  /** 承办窗口 */
  window: string;
  /** 群众评分，恒为 5 */
  score: number;
  /** 公示备注 */
  remark?: string;
}

/**
 * 办件公示原始元组
 *
 * 元组顺序：受理编号尾号 / 事项 id / 申请人 / 受理日期 / 办结日期（空串表示未办结）
 *          / 状态 / 承办窗口 / 备注（空串表示无）
 */
type CaseTuple = [string, string, string, string, string, CaseStatus, string, string];

const CASE_TUPLES: CaseTuple[] = [
  /* ---------- 今日（2026-09-30）办结 ---------- */
  ['104271', 'svc-social', '张*明', '2026-09-30', '2026-09-30', '已办结', 'A-03 社保专窗', '即时办结，用时 11 分钟。其中排队 42 分钟，不计入办结用时。'],
  ['104272', 'svc-refund', '李*华', '2026-09-30', '2026-09-30', '已办结', 'E-01 网上办件核验', '本办件全程在线办理，申请人到场 1 次。'],
  ['104273', 'svc-tax-form', '王*', '2026-09-30', '2026-09-30', '已办结', 'E-01 网上办件核验', '申请人仅下载表格、未提交材料，系统判定为办结。'],
  ['104274', 'svc-pet', '（姓名含特殊字符，未能显示）', '2026-09-30', '2026-09-30', '已办结', 'D-02 民政事务', '宠物未到场，已按容缺受理办理。'],
  ['104275', 'svc-license', 'J***n S***h', '2026-09-28', '2026-09-30', '已办结', 'C-04 车驾管', ''],
  ['104276', 'svc-medicare', '陈*芳', '2026-09-29', '2026-09-30', '已办结', 'A-03 社保专窗', ''],
  ['104277', 'svc-baby', '刘*涛', '2026-09-24', '2026-09-30', '已办结', 'D-02 民政事务', '姓名栏已确认，不可修改。'],
  ['104278', 'biz-employee', '赵*（企业经办人）', '2026-09-30', '2026-09-30', '已办结', 'B-02 企业登记', '即时备案。备案内容有误的，更正经 90 个工作日。'],
  ['104279', 'svc-school', '孙*丽', '2026-09-25', '2026-09-30', '已办结', 'D-02 民政事务', '学区归属经现场抽签确定。'],
  ['104280', 'svc-car', '周*', '2026-09-22', '2026-09-30', '已办结', 'C-04 车驾管', '尾气检测点周二下午不营业，本件顺延 7 日。'],
  ['104281', 'svc-veteran', 'R***t M***s', '2026-09-11', '2026-09-30', '已办结', 'D-06 退役军人', '档案缺失部分由申请人自行补充。'],
  ['104282', 'svc-social', '吴*兰', '2026-09-29', '2026-09-30', '已办结', 'A-03 社保专窗', '缴费月数已达 4,180 个月，申请人年龄 34 岁。'],

  /* ---------- 近期办结 ---------- */
  ['104201', 'svc-passport', '郑*', '2026-09-02', '2026-09-26', '已办结', 'C-01 出入境', '加急服务未生效，因申请人不需要加急。'],
  ['104202', 'svc-gun', 'M***l B***n', '2026-06-11', '2026-09-25', '已办结', 'A-07 临时窗口', '背景调查用时 106 日，属正常范围。'],
  ['104203', 'svc-subsidy', '冯*', '2026-08-05', '2026-09-24', '已办结', 'B-05 税务联办', '核定补贴标准：每月 0 美元。'],
  ['104204', 'biz-register', '何*（经办人）', '2026-08-20', '2026-09-20', '已办结', 'B-02 企业登记', ''],
  ['104205', 'svc-house', '许*', '2026-05-26', '2026-09-18', '已办结', 'D-02 民政事务', '轮候序号 214,882。本件为资格确认，非配租。'],
  ['104206', 'svc-marriage', '林*、黄*', '2026-09-15', '2026-09-18', '已办结', 'D-02 民政事务', '登记当日生效。'],
  ['104207', 'biz-tax', '徐*（经办人）', '2026-09-08', '2026-09-17', '已办结', 'B-05 税务联办', '在线通道开放时段 06:00-06:15，申请人于 06:14 提交。'],
  ['104208', 'svc-medicare', '马*', '2026-09-03', '2026-09-16', '已办结', 'A-03 社保专窗', ''],
  ['104209', 'svc-tax-form', '朱*', '2026-09-15', '2026-09-15', '已办结', 'E-01 网上办件核验', '所需表格尚未被发明，已办结。'],
  ['104210', 'biz-contract', '胡*（经办人）', '2026-07-29', '2026-09-12', '已办结', 'B-02 企业登记', '供应商账号已开通。'],
  ['104211', 'svc-refund', 'T***s W***t', '2026-09-01', '2026-09-10', '已办结', 'E-01 网上办件核验', '退税状态与上次查询一致。'],
  ['104212', 'svc-pet', '高*', '2026-09-08', '2026-09-09', '已办结', 'D-02 民政事务', ''],

  /* ---------- 办理中 ---------- */
  ['104301', 'svc-passport', '罗*', '2026-09-18', '', '办理中', 'C-01 出入境', '当前环节：制证。预约面签排队序号 1,204。'],
  ['104302', 'svc-house', '梁*', '2026-06-30', '', '办理中', 'D-02 民政事务', '预计轮候至 2173 年。'],
  ['104303', 'biz-permit', '宋*（经办人）', '2026-07-16', '', '办理中', 'B-02 企业登记', '7 个部门已盖章 6 个。'],
  ['104304', 'svc-subsidy', '谢*', '2026-08-28', '', '办理中', 'B-05 税务联办', '入户核查将于近期安排，请保持在家。'],
  ['104305', 'biz-export', '唐*（经办人）', '2026-08-12', '', '办理中', 'B-05 税务联办', '国务院会签已完成，国防部会签排队中。'],
  ['104306', 'svc-gun', 'K***n D***s', '2026-09-11', '', '办理中', 'A-07 临时窗口', '本件由临时窗口承办，该窗口位置请咨询服务台。'],
  ['104307', 'svc-school', '钱*', '2026-09-24', '', '办理中', 'D-02 民政事务', '学区抽签定于开学当日进行。'],
  ['104308', 'svc-refund', '韩*', '2026-09-30', '', '办理中', 'E-01 网上办件核验', '此状态自 2019 年起未发生变化。'],

  /* ---------- 已受理 / 待补正 / 已退回 ---------- */
  ['104401', 'svc-license', '曹*', '2026-09-30', '', '已受理', 'C-04 车驾管', '线上更新已开通，请到现场办理。'],
  ['104402', 'svc-medicare', '彭*', '2026-09-29', '', '已受理', 'A-03 社保专窗', ''],
  ['104403', 'svc-veteran', 'A***w K***y', '2026-09-28', '', '待补正', 'D-06 退役军人', '缺服役证明。档案受损情况说明需由出具单位盖章。'],
  ['104404', 'biz-contract', '董*（经办人）', '2026-09-26', '', '待补正', 'B-02 企业登记', '缺无欠税证明。该证明需先办理本项登记后方可开具。'],
  ['104405', 'svc-baby', '袁*', '2026-09-22', '', '已退回', 'D-02 民政事务', '退回原因：材料第 3 页未提供。'],
  ['104406', 'svc-marriage', '邓*、蒋*', '2026-09-19', '', '已退回', 'D-02 民政事务', '退回原因：结婚许可证尚未取得。建议先申请结婚许可证。'],
  ['104407', 'biz-register', '石*（经办人）', '2026-09-16', '', '已退回', 'B-02 企业登记', '退回原因：公司名称与现有 4,182 家企业近似。'],
  ['104408', 'svc-car', '崔*', '2026-09-12', '', '待补正', 'C-04 车驾管', '缺尾气检测报告。检测点周二下午不营业。'],
];

/**
 * 办件公示记录
 *
 * 群众评分统一为 5.0：本栏目只公示评价为「非常满意」的办件，
 * 其余评价不在公示范围内，因此也不会出现在本表中。
 */
export const CASE_RECORDS: CaseRecord[] = CASE_TUPLES.map(
  ([no, serviceId, applicant, applyDate, finishDate, status, window, remark]) => ({
    id: `USPCS-2026-${no}`,
    serviceId,
    serviceName: findService(serviceId)?.name ?? '综合受理事项',
    applicant,
    applyDate,
    finishDate: finishDate || undefined,
    status,
    window,
    score: 5,
    remark: remark || undefined,
  })
);

/** 按受理编号查办件 */
export function findCaseRecord(id: string): CaseRecord | undefined {
  return CASE_RECORDS.find((c) => c.id === id);
}

/** 办件公示中出现的全部状态（用于筛选下拉框） */
export const CASE_STATUSES: CaseStatus[] = ['已办结', '办理中', '已受理', '待补正', '已退回'];

/* ================= III. 大厅窗口 ================= */

/** 窗口信息 */
export interface WindowInfo {
  id: string;
  /** 窗口号 */
  code: string;
  /** 窗口名称 */
  name: string;
  /** 可办事项 id */
  serviceIds: string[];
  /** 受理员工号 */
  staff: string;
  /** 开放时间 */
  openHours: string;
  /** 当前排队人数 */
  queue: number;
  status: '办理中' | '暂停服务' | '已满号';
  remark?: string;
}

export const WINDOWS: WindowInfo[] = [
  {
    id: 'win-a01',
    code: 'A-01',
    name: '综合受理',
    serviceIds: ['svc-social', 'svc-medicare', 'svc-subsidy'],
    staff: '工号 0421',
    openHours: '工作日 09:00-12:00、13:00-17:00；周六 09:00-11:30（仅咨询）',
    queue: 47,
    status: '办理中',
    remark: '午间 12:00-13:00 为系统维护时段，窗口照常开放，但系统不开放。',
  },
  {
    id: 'win-a03',
    code: 'A-03',
    name: '社保专窗',
    serviceIds: ['svc-social', 'svc-medicare'],
    staff: '工号 0431',
    openHours: '工作日 09:00-17:00',
    queue: 23,
    status: '办理中',
    remark: '工号 0431 已于 2021 年离职，系统未更新该用工信息。',
  },
  {
    id: 'win-a07',
    code: 'A-07',
    name: '临时窗口',
    serviceIds: ['svc-gun', 'svc-passport'],
    staff: '工号 1088',
    openHours: '不定时开放，开放情况以现场公告为准',
    queue: 9,
    status: '办理中',
    remark: '本窗口办公地点在立柱后侧。立柱共 4 根，请逐根确认。',
  },
  {
    id: 'win-b02',
    code: 'B-02',
    name: '企业登记',
    serviceIds: ['biz-register', 'biz-contract', 'biz-permit'],
    staff: '工号 2210',
    openHours: '工作日 09:00-11:30、14:00-16:30',
    queue: 31,
    status: '办理中',
    remark: '每日受理 30 个号，第 31 位起的办件顺延至次日。',
  },
  {
    id: 'win-c01',
    code: 'C-01',
    name: '出入境',
    serviceIds: ['svc-passport'],
    staff: '工号 3305',
    openHours: '工作日 09:00-16:00（须预约）',
    queue: 0,
    status: '已满号',
    remark: '今日号源已于 00:03 发放完毕。',
  },
  {
    id: 'win-d02',
    code: 'D-02',
    name: '民政事务',
    serviceIds: ['svc-baby', 'svc-marriage', 'svc-pet', 'svc-school', 'svc-house'],
    staff: '工号 4012',
    openHours: '工作日 09:00-17:00',
    queue: 15,
    status: '办理中',
    remark: '结婚登记当日生效；离婚预约最早可约至 14 个月后。',
  },
  {
    id: 'win-e01',
    code: 'E-01',
    name: '网上办件核验',
    serviceIds: ['svc-refund', 'svc-tax-form'],
    staff: '系统自动受理',
    openHours: '每日 00:00-24:00（维护时段见维护公告）',
    queue: 0,
    status: '暂停服务',
    remark: '本窗口以线下方式核验线上办件，今日线下核验号已发完。',
  },
];

/* ================= IV. 办事网点 ================= */

/** 办事网点 */
export interface Office {
  id: string;
  name: string;
  address: string;
  phone: string;
  /** 开放窗口数 */
  windows: number;
  /** 当前排队人数 */
  queue: number;
  /** 预计等待分钟数 */
  waitMinutes: number;
  status: '正常' | '拥挤' | '暂停对外办公';
  remark?: string;
}

export const OFFICES: Office[] = [
  {
    id: 'off-main',
    name: '联邦便民服务中心（主楼大厅）',
    address: '宪法大道 1600 号 主楼一层（自东门进入，东门因维修封闭）',
    phone: '(202) 555-0100 转 0（转接键已于 2019 年停用）',
    windows: 12,
    queue: 47,
    waitMinutes: 68,
    status: '拥挤',
    remark: '建议错峰办理。错峰时段为 09:00-17:00 之外的时段。',
  },
  {
    id: 'off-west',
    name: '西区分中心',
    address: '宾夕法尼亚大道 2100 号 B 座二层',
    phone: '(202) 555-0121',
    windows: 6,
    queue: 12,
    waitMinutes: 21,
    status: '正常',
    remark: '本网点仅受理预约办件，预约号源每日 00:00 发放。',
  },
  {
    id: 'off-east',
    name: '东区政务服务点',
    address: '独立大道 300 号 社区中心旁',
    phone: '(202) 555-0133',
    windows: 0,
    queue: 0,
    waitMinutes: 0,
    status: '暂停对外办公',
    remark: '本网点窗口已全部改为自助终端。自助终端维修中，请前往人工窗口；本网点无人工窗口。',
  },
  {
    id: 'off-north',
    name: '北区代办点',
    address: '康涅狄格大道 4500 号 邮局二层（无电梯）',
    phone: '(202) 555-0158',
    windows: 2,
    queue: 3,
    waitMinutes: 9,
    status: '正常',
    remark: '每日限号 20 个，今日号源已于 00:03 发放完毕。',
  },
  {
    id: 'off-south',
    name: '南部便民服务点',
    address: 'M 街 900 号 一站式大厅西侧',
    phone: '(202) 555-0177',
    windows: 5,
    queue: 26,
    waitMinutes: 44,
    status: '正常',
    remark: '上午暂停对外办公（迎接上级检查），下午照常开放至 12:00。',
  },
];

/** 全部网点的平均等待分钟数（保留一位小数） */
export function averageWaitMinutes(): number {
  if (OFFICES.length === 0) return 0;
  const sum = OFFICES.reduce((acc, o) => acc + o.waitMinutes, 0);
  return Math.round((sum / OFFICES.length) * 10) / 10;
}

/* ================= V. 常见问题 ================= */

/**
 * 右栏「常见问题」已改为消费公共入口 `@/data/faqs`（数据实体在 `@/data/interact`）。
 * 原先放在本文件的 SERVICE_FAQS 兜底常量已删除，避免同一批问题出现两份副本后漂移。
 * 页面侧调用：`faqsByCategory('service')`。
 */
