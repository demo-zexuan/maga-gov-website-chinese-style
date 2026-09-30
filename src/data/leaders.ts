/**
 * 领导信息与领导活动数据
 *
 * I. 说明
 *
 * 首页「领导活动」列表、政务公开「人事信息」栏目、以及各详情页共用。
 *
 * II. 重要声明
 *
 * 本文件中的全部人物、职务、语录、活动均为虚构角色，属于讽刺文学创作，
 * 与任何真实人物无关。文中出现的"总统""部长"等称谓均为戏剧设定。
 *
 * @module data/leaders
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { ActivityItem, Leader } from './types';

export const LEADERS: Leader[] = [
  {
    id: 'ldr-001',
    name: '唐纳德·J·总统',
    title: '美利坚合众国总统',
    duty: '主持全面工作',
    scope: ['网上便民服务高质量发展', '数字政府建设', '一网通办', '让美国再次伟大'],
    avatar: 'trump',
    quote: '我们正在做一件前所未有的事——把政府的表格，搬到网上去。没有人比我更懂表格。',
  },
  {
    id: 'ldr-002',
    name: '副总统一',
    title: '美利坚合众国副总统',
    duty: '协助总统分管日常事务',
    scope: ['政务服务标准化', '跨州数据共享', '边境便民服务站建设'],
    quote: '我们要让每一位公民都能在家里办成事。当然，前提是他家里有网。',
  },
  {
    id: 'ldr-003',
    name: '联邦便民服务管理局局长',
    title: '联邦便民服务管理局党组书记、局长',
    duty: '主持局全面工作',
    scope: ['办事大厅运营', '服务热线', '群众满意度调查'],
    quote: '群众满意度连续 12 年稳定在 99.8%。这说明我们的调查问卷设计得非常科学。',
  },
  {
    id: 'ldr-004',
    name: '数字政府建设办公室主任',
    title: '白宫数字政府建设办公室主任',
    duty: '分管信息化建设',
    scope: ['政务云', '数据中台', '统一身份认证'],
    quote: '我们上线了 1,024 项在线服务。其中 3 项真的能在线办。',
  },
  {
    id: 'ldr-005',
    name: '联邦社会保障署署长',
    title: '联邦社会保障署署长',
    duty: '分管社会保障工作',
    scope: ['社保查询', '退休金发放', '残障补助'],
    quote: '系统显示您已缴费 4,180 个月。我们不对系统的计算方式负责。',
  },
  {
    id: 'ldr-006',
    name: '联邦国内税务局代局长',
    title: '联邦国内税务局代理局长',
    duty: '主持税务工作',
    scope: ['退税', '税表', '企业税务登记'],
    quote: '退税正在处理中。这句话我说了四年，它依然成立。',
  },
];

/** 首页「领导活动」列表 —— 与参考图 6 条一一对应 */
export const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-001',
    date: '2026-04-12',
    title: '总统在王宫会见各州州长共商便民服务发展',
    leaderId: 'ldr-001',
    location: '华盛顿特区',
  },
  {
    id: 'act-002',
    date: '2026-04-09',
    title: '副总统出席联邦数字政府论坛',
    leaderId: 'ldr-002',
    location: '硅谷',
  },
  {
    id: 'act-003',
    date: '2026-04-07',
    title: '政府效率办公室召开工作会议',
    leaderId: 'ldr-004',
    location: '白宫',
  },
  {
    id: 'act-004',
    date: '2026-04-05',
    title: '商务部部长调研在线服务平台建设',
    leaderId: 'ldr-003',
    location: '芝加哥',
  },
  {
    id: 'act-005',
    date: '2026-04-03',
    title: '社会保障署署长视察地方服务站',
    leaderId: 'ldr-005',
    location: '得克萨斯州',
  },
  {
    id: 'act-006',
    date: '2026-04-01',
    title: '国内税务局启动年度退税专项工作',
    leaderId: 'ldr-006',
    location: '华盛顿特区',
  },
  {
    id: 'act-007',
    date: '2026-03-28',
    title: '总统主持召开全国网上便民服务工作会议',
    leaderId: 'ldr-001',
    location: '白宫东厅',
  },
  {
    id: 'act-008',
    date: '2026-03-25',
    title: '联邦便民服务管理局赴加州开展专题调研',
    leaderId: 'ldr-003',
    location: '加利福尼亚州',
  },
];

/** 按 id 查领导 */
export function findLeader(id: string): Leader | undefined {
  return LEADERS.find((l) => l.id === id);
}
