/**
 * 共享数据类型定义
 *
 * I. 用途
 *
 * 各业务模块（新闻、政务公开、服务、互动等）的数据结构统一在此声明，
 * 避免 Sub 各自定义造成集成时的类型冲突。
 *
 * II. 约定
 *
 * 1. 所有 id 使用字符串，前缀区分模块（nws- / svc- / faq- ...）。
 * 2. 日期一律使用 `YYYY-MM-DD` 字符串，展示层负责格式化。
 *
 * @module data/types
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */

/** 通用文章（新闻 / 政策 / 讲话 / 党建要闻共用） */
export interface Article {
  id: string;
  title: string;
  /** 发布日期 YYYY-MM-DD */
  date: string;
  /** 来源单位 */
  source: string;
  /** 列表角标，如「重磅」「置顶」「新」 */
  badge?: string;
  badgeTone?: 'red' | 'gold' | 'navy' | 'green' | 'outline';
  /** 摘要 / 导语 */
  summary?: string;
  /** 正文段落 */
  body: string[];
  /** 文号，如「美白发〔2026〕17 号」 */
  docNo?: string;
  /** 栏目路径，用于列表过滤 */
  category: string;
  /** 阅读量（虚构） */
  views?: number;
  /** 是否置顶 */
  top?: boolean;
  /** 关联图片 key（对应 public/assets 下的资源名，可选） */
  image?: string;
}

/** 政务服务事项 */
export interface ServiceItem {
  id: string;
  name: string;
  /** 图标 key，对应 ServiceIcons 的键 */
  icon: string;
  /** 所属分类：personal / business */
  scope: 'personal' | 'business';
  /** 主管部门 */
  department: string;
  /** 承诺办结时限 */
  duration: string;
  /** 法定办结时限 */
  legalDuration: string;
  /** 是否需要面签 */
  faceToFace: boolean;
  /** 办理材料 */
  materials: string[];
  /** 办理流程步骤 */
  steps: string[];
  /** 收费标准 */
  fee: string;
  /** 在线办理可达性（用来做"永远差一步"的黑色幽默） */
  online: boolean;
  /** 热门标记 */
  hot?: boolean;
  /** 一句话吐槽 */
  quip?: string;
}

/** 公告公示 */
export interface Notice {
  id: string;
  title: string;
  date: string;
  /** 公告类型标签 */
  tag?: string;
  body: string[];
}

/** 常见问题 */
export interface Faq {
  id: string;
  question: string;
  /** 官方回答 */
  answer: string;
  /** 网友补充（黑色幽默的藏身处） */
  footnote?: string;
  category: string;
}

/** 下载资源 */
export interface DownloadItem {
  id: string;
  name: string;
  /** 文件格式：PDF / XLS / DOC / ZIP / EXE */
  format: string;
  size: string;
  date: string;
  department: string;
  /** 下载次数（虚构） */
  downloads: number;
  /** 表格编号 */
  formNo: string;
  /** 备注 / 吐槽 */
  remark?: string;
}

/** 领导 */
export interface Leader {
  id: string;
  name: string;
  title: string;
  duty: string;
  /** 分管领域 */
  scope: string[];
  /** 头像 key */
  avatar?: string;
  /** 经典语录 */
  quote: string;
}

/** 领导活动条目 */
export interface ActivityItem {
  id: string;
  date: string;
  title: string;
  leaderId: string;
  location: string;
}

/** 留言 / 建言 */
export interface LetterItem {
  id: string;
  title: string;
  date: string;
  /** 写信人（脱敏） */
  author: string;
  /** 状态：已受理 / 办理中 / 已办结 / 已转办 */
  status: '已受理' | '办理中' | '已办结' | '已转办';
  /** 承办单位 */
  department: string;
  body: string;
  /** 官方回复 */
  reply?: string;
  /** 回复日期 */
  replyDate?: string;
  /** 群众评分（只有满分，这是重点） */
  score?: number;
}

/** 美国州（地方频道） */
export interface StateInfo {
  /** 两位邮政缩写 */
  code: string;
  name: string;
  nameEn: string;
  capital: string;
  /** 分站热度（虚构） */
  heat: number;
  /** 一句话介绍（吐槽向） */
  blurb: string;
  /** 该州特色便民服务 */
  feature: string;
  /** 加入联邦年份 */
  admitted: string;
  /** 昵称 */
  nickname: string;
}

/** 统计数据 */
export interface StatEntry {
  label: string;
  value: number;
  unit: string;
  /** 是否为小数展示（满意度 99.8%） */
  decimal?: boolean;
  icon?: string;
}
