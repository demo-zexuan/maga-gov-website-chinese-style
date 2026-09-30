/**
 * 常见问题（公共导入入口）
 *
 * I. 为什么单独建这个文件
 *
 * 常见问题的数据实体在 `@/data/interact`（互动交流模块维护），但「常见问题」是全站
 * 多个模块的公共依赖：下载中心（表格相关）、政务服务（办事相关）、便民查询（查询相关）
 * 都要在自己的页面上挂一份。若各模块直接 import `@/data/interact`，会造成
 * 「下载中心依赖互动交流」的反向耦合，也会让日后的数据搬迁变成多点改动。
 *
 * 因此约定：**任何模块引用常见问题，一律走 `@/data/faqs`**。
 * 本文件只做转发，不存放数据。
 *
 * II. 对外契约（其他模块请勿改动签名）
 *
 * 1. `FAQS`             —— 全部常见问题
 * 2. `findFaq(id)`      —— 按 id 取单条
 * 3. `faqsByCategory(c)` —— 按分类取一组
 * 4. `FAQ_CATEGORIES`   —— 分类取值与中文名（用于筛选下拉、标签页）
 *
 * III. category 取值
 *
 * download / service / interact / gov / law / query / general
 *
 * @module data/faqs
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { Faq } from './types';
import { FAQS as RAW_FAQS, FAQ_CATEGORIES, faqsByCategory, findFaq } from './interact';

/** 全部常见问题 */
export const FAQS: Faq[] = RAW_FAQS;

export { FAQ_CATEGORIES, faqsByCategory, findFaq };
