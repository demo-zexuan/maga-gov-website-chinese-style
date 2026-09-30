/**
 * 办事统计与排行榜数据
 *
 * I. 说明
 *
 * 首页右栏「办事统计」、底部「下载排行」以及各内页侧栏的榜单都从这里取数。
 * 数字遵循参考图：今日受理 8,888,888 / 累计下载 177,600,000 / 注册用户 66,666,666
 * / 群众满意度 99.8%。
 *
 * II. 写作约定
 *
 * 榜单条目的 `remark` 是黑色幽默的落点：用最平静的公文语气说出最离谱的事。
 * 不要用网络梗，不要用表情符号，不要用感叹号。
 *
 * @module data/stats
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { StatEntry } from './types';

/** 首页右栏「办事统计」四项 —— 数值与参考图完全一致 */
export const HOME_STATS: StatEntry[] = [
  { label: '今日受理', value: 8_888_888, unit: '件', icon: 'shield' },
  { label: '累计下载表格', value: 177_600_000, unit: '次', icon: 'tax' },
  { label: '注册用户', value: 66_666_666, unit: '人', icon: 'passport' },
  { label: '群众满意度', value: 99.8, unit: '%', decimal: true, icon: 'medicare' },
];

/** 底部「办事统计」补充指标 */
export const EXTRA_STATS: StatEntry[] = [
  { label: '平均办结时长', value: 3.2, unit: '个工作日', decimal: true },
  { label: '一次办结率', value: 96.4, unit: '%', decimal: true },
  { label: '最多跑一次达成率', value: 99.1, unit: '%', decimal: true },
  { label: '群众投诉量', value: 0, unit: '件' },
];

/** 下载排行条目 */
export interface RankingItem {
  id: string;
  title: string;
  /** 数值（下载次数 / 办件量） */
  value: number;
  unit: string;
  remark?: string;
}

/** 首页「下载排行」—— 与参考图 5 条一致 */
export const DOWNLOAD_RANKING: RankingItem[] = [
  {
    id: 'rk-1',
    title: '个人所得税申报表（1040）',
    value: 42_180_000,
    unit: '次',
    remark: '下载量表。填完量表。',
  },
  {
    id: 'rk-2',
    title: '联邦医疗保险申请表',
    value: 28_640_000,
    unit: '次',
    remark: '表格共 4 页，第 3 页需向保险公司索取。',
  },
  {
    id: 'rk-3',
    title: '驾照更换申报表',
    value: 19_300_000,
    unit: '次',
    remark: '需用黑色签字笔填写。蓝色签字笔的申请将被退回。',
  },
  {
    id: 'rk-4',
    title: '枪支许可申请表（ATF-1）',
    value: 16_720_000,
    unit: '次',
    remark: '表中"是否需要枪支"一栏为必填项。',
  },
  {
    id: 'rk-5',
    title: '联邦补贴申请表',
    value: 12_050_000,
    unit: '次',
    remark: '本表每年 1 月 1 日开放，1 月 2 日额度用尽。',
  },
];

/** 办件量排行（用于政务服务「办件公示」页） */
export const CASE_RANKING: RankingItem[] = [
  { id: 'cr-1', title: '社保参保证明打印', value: 6_420_000, unit: '件' },
  { id: 'cr-2', title: '无犯罪记录证明', value: 5_180_000, unit: '件' },
  { id: 'cr-3', title: '税表更正申报', value: 4_030_000, unit: '件' },
  { id: 'cr-4', title: '护照加急预约', value: 2_960_000, unit: '件' },
  { id: 'cr-5', title: '企业名称查重', value: 2_110_000, unit: '件' },
  { id: 'cr-6', title: '住房轮候登记', value: 1_870_000, unit: '件' },
  { id: 'cr-7', title: '退役军人优待申请', value: 940_000, unit: '件' },
  { id: 'cr-8', title: '结婚许可证申请', value: 620_000, unit: '件' },
];

/**
 * 数字格式化
 *
 * @param n        - 原始数字
 * @param decimal  - 是否保留一位小数
 * @returns 带千分位（或定点小数）的展示字符串
 */
export function formatNumber(n: number, decimal = false): string {
  if (decimal) return n.toFixed(1);
  return n.toLocaleString('en-US');
}

/**
 * 把大数字压缩成「万 / 亿」中文单位
 *
 * 古早政务网站非常喜欢这种写法，例如「1.78 亿次」。
 *
 * @param n - 原始数字
 * @returns 中文单位字符串
 */
export function formatCn(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)} 亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)} 万`;
  return String(n);
}
