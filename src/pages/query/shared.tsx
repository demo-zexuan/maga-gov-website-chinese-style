/**
 * 便民查询模块共享部件
 *
 * I. 内容清单
 *
 * 1. useSimulatedQuery —— 模拟异步查询的状态机（idle / loading / done / error）
 * 2. ResultPanel / ResultRow —— 基于 .mg-result 的结果面板与结果行
 * 3. useOnlyIncreasing —— 只增不减的实时数字（排队人数看板用）
 * 4. 文本与数字格式化工具：formatSsn / maskSsn / formatInt / formatMoney / daysSince 等
 *
 * II. 设计说明
 *
 * 1. 查询工具均为前端模拟：提交后进入加载态，延时结束后返回结果或错误。
 *    状态机统一放在本文件，避免 6 个工具各写一套 setTimeout 造成行为不一致。
 * 2. 结果面板复用 pages.css 中已提供的 .mg-result / .mg-result__row /
 *    .mg-result__label / .mg-result__value，仅补充标题与按钮行。
 *
 * @module pages/query/shared
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/* ================= 1. 模拟查询状态机 ================= */

export type QueryStatus = 'idle' | 'loading' | 'done' | 'error';

/** 查询产物：成功带数据，失败带一句公文口吻的说明 */
export type QueryOutcome<T> = { ok: true; data: T } | { ok: false; message: string };

export interface SimulatedQuery<T> {
  status: QueryStatus;
  data: T | null;
  error: string | null;
  /** 是否处于加载态，用于禁用提交按钮 */
  busy: boolean;
  /** 发起一次查询；produce 在延时结束后执行 */
  run: (produce: () => QueryOutcome<T>) => void;
  /** 不经过延时直接进入错误态（用于页内的次级操作，如下载失败） */
  fail: (message: string) => void;
  /** 回到初始态 */
  reset: () => void;
}

/**
 * 模拟异步查询
 *
 * @param delay - 模拟的网络延时（毫秒），默认 1200
 * @returns 查询状态与操作方法
 */
export function useSimulatedQuery<T>(delay = 1200): SimulatedQuery<T> {
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // 组件卸载时清掉未完成的定时器，避免在已卸载组件上写状态
  useEffect(() => clearTimer, [clearTimer]);

  const run = useCallback(
    (produce: () => QueryOutcome<T>) => {
      clearTimer();
      setStatus('loading');
      setData(null);
      setError(null);
      timer.current = window.setTimeout(() => {
        timer.current = null;
        const outcome = produce();
        if (outcome.ok) {
          setData(outcome.data);
          setStatus('done');
        } else {
          setError(outcome.message);
          setStatus('error');
        }
      }, delay);
    },
    [clearTimer, delay]
  );

  const fail = useCallback(
    (message: string) => {
      clearTimer();
      setData(null);
      setError(message);
      setStatus('error');
    },
    [clearTimer]
  );

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setData(null);
    setError(null);
  }, [clearTimer]);

  return { status, data, error, busy: status === 'loading', run, fail, reset };
}

/* ================= 2. 结果面板 ================= */

/** 结果行：左侧灰色标签，右侧加粗值 */
export function ResultRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="mg-result__row">
      <div className="mg-result__label">{label}</div>
      <div className="mg-result__value">{value}</div>
    </div>
  );
}

export interface ResultPanelProps {
  /** 结果面板标题 */
  title?: string;
  /** 结果行 */
  children: ReactNode;
  /** 页脚说明（小字，用于放"备注"类文案） */
  footnote?: ReactNode;
  /** 页脚按钮行 */
  actions?: ReactNode;
}

/** 查询结果面板：标题 + 结果行 + 备注 + 操作按钮 */
export function ResultPanel({ title = '查询结果', children, footnote, actions }: ResultPanelProps) {
  return (
    <div className="mg-result">
      <div className="mg-q-result__title">{title}</div>
      {children}
      {footnote && <div className="mg-q-result__foot">{footnote}</div>}
      {actions && <div className="mg-q-result__actions">{actions}</div>}
    </div>
  );
}

/** 查询前的占位说明：一本正经地交代"请先提交" */
export function QueryIdle({ text }: { text: string }) {
  return (
    <div className="mg-q-idle">
      <span className="mg-q-idle__mark">待查询</span>
      <span>{text}</span>
    </div>
  );
}

/* ================= 3. 只增不减的数字 ================= */

/**
 * 只增不减的实时数字
 *
 * @param start   - 初始值
 * @param stepMs  - 每次增长的时间间隔（毫秒）
 * @param maxStep - 单次最大增量
 * @returns 当前数值
 */
export function useOnlyIncreasing(start: number, stepMs = 1800, maxStep = 3): number {
  const [value, setValue] = useState(start);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((v) => v + 1 + Math.floor(Math.random() * maxStep));
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [stepMs, maxStep]);
  return value;
}

/* ================= 4. 格式化工具 ================= */

/** 当前公历年份 */
export const CURRENT_YEAR = new Date().getFullYear();

/** 今天，格式 YYYY-MM-DD */
export function todayIso(): string {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 把 YYYY-MM-DD 显示为「2026 年 9 月 30 日」 */
export function formatDateCn(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

/** 从 YYYY-MM-DD 到今天的天数（不早于 0） */
export function daysSince(iso: string): number {
  const t = new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

/** 千分位整数 */
export function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

/** 金额，保留两位小数 */
export function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 社会保障号输入掩码：随输入自动补连字符，最多 9 位数字 */
export function formatSsn(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/** 社会保障号脱敏：只保留末 4 位 */
export function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  return `***-**-${digits.slice(-4)}`;
}

/** 社会保障号格式：XXX-XX-XXXX */
export const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/;

/** 校验社会保障号，返回错误文案（通过时返回 null） */
export function validateSsn(ssn: string): string | null {
  if (!ssn.trim()) return '请填写社会保障号。';
  if (!SSN_PATTERN.test(ssn)) {
    return '格式不符。社会保障号应为 3 位数字、连字符、2 位数字、连字符、4 位数字，形如 000-00-0000。';
  }
  if (ssn.startsWith('000')) {
    return '该号段（000）为系统保留号段，尚未启用。启用时间以系统公告为准。';
  }
  return null;
}

/** 社会保障号前三位所属号段，用于判断是否落在未接入辖区 */
export function ssnArea(ssn: string): number {
  return Number(ssn.slice(0, 3));
}
