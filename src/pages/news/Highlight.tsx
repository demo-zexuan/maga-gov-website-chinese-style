/**
 * 检索关键词高亮
 *
 * I. 用途
 *
 * 1. 要闻列表页的 ?q= 过滤结果、全站搜索结果页共用同一套高亮逻辑。
 * 2. 命中片段过长时按 clip 参数截取上下文，避免列表被长正文撑开。
 *
 * II. 约定
 *
 * 1. 匹配大小写不敏感，但保留原文大小写。
 * 2. 单条文本最多高亮 12 处，防止恶意关键词导致渲染量爆炸。
 * 3. 高亮底色一律使用设计令牌，禁止硬编码色值。
 *
 * @module pages/news/Highlight
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React from 'react';

export interface HighlightProps {
  /** 原始文本 */
  text: string;
  /** 关键词，空串时原样返回 */
  keyword: string;
  /** 截取长度：设置后仅保留命中位置前后共 2×clip 个字符 */
  clip?: number;
}

/** 命中位置两侧留出的字符数 */
const CONTEXT = 12;

/**
 * 生成片段窗口
 *
 * @param text     - 原始文本
 * @param hitIndex - 首次命中的下标，未命中传 -1
 * @param clip     - 窗口长度
 */
function makeWindow(text: string, hitIndex: number, clip: number): { window: string; offset: number } {
  if (text.length <= clip * 2) return { window: text, offset: 0 };
  const start = hitIndex < 0 ? 0 : Math.max(0, hitIndex - CONTEXT);
  const end = Math.min(text.length, start + clip * 2);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return { window: `${prefix}${text.slice(start, end)}${suffix}`, offset: start - prefix.length };
}

/** 关键词高亮组件：命中片段使用旗金底色 + 政务红文字 */
export function Highlight({ text, keyword, clip }: HighlightProps): React.ReactElement {
  const key = keyword.trim();
  const lower = text.toLowerCase();

  // I. 无关键词：仅按需截断
  if (!key) {
    if (!clip) return <>{text}</>;
    return <>{makeWindow(text, -1, clip).window}</>;
  }

  // II. 计算窗口
  const hitIndex = lower.indexOf(key.toLowerCase());
  const size = clip ?? text.length;
  const { window: view, offset } = makeWindow(text, hitIndex, size);

  // III. 逐段切分并包裹 <mark>
  const parts: React.ReactNode[] = [];
  const viewLower = view.toLowerCase();
  const needle = key.toLowerCase();
  let cursor = 0;
  let markIndex = 0;
  let at = viewLower.indexOf(needle);

  while (at >= 0 && markIndex < 12) {
    if (at > cursor) parts.push(view.slice(cursor, at));
    parts.push(
      <mark
        key={`${offset}-${markIndex}`}
        style={{ background: 'var(--c-gold-light)', color: 'var(--c-red)', padding: '0 1px' }}
      >
        {view.slice(at, at + key.length)}
      </mark>
    );
    cursor = at + key.length;
    markIndex += 1;
    at = viewLower.indexOf(needle, cursor);
  }
  parts.push(view.slice(cursor));

  return <>{parts}</>;
}

export default Highlight;
