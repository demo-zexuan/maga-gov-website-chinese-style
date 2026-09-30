/**
 * 全局应用上下文
 *
 * I. 职责
 *
 * 1. 管理顶部工具条的全局状态：登录态、长者模式、无障碍模式、搜索关键词
 * 2. 提供全局消息提示（古早网站那种右上角弹出来的小黄条）
 * 3. 提供"办事统计"的实时跳动数字（黑色幽默的载体：数字只增不减）
 *
 * II. 设计说明
 *
 * 长者模式不是玩笑——它是真实政务网站的必备功能，这里把它实现出来并放大字号，
 * 是对原始设计的尊重，同时也是笑点的来源（放大 200% 后布局彻底崩掉）。
 *
 * @module app-context
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* ================= 类型 ================= */

export interface ToastItem {
  id: number;
  title: string;
  text: string;
}

export interface AppState {
  /** 当前登录用户（游客为 null） */
  user: { name: string; level: string; since: string } | null;
  login: (name: string) => void;
  logout: () => void;

  /** 长者模式：全站字号放大 */
  elderMode: boolean;
  toggleElderMode: () => void;

  /** 无障碍模式：高对比度 + 更明显的焦点框 */
  a11yMode: boolean;
  toggleA11y: () => void;

  /** 顶部搜索框的关键词（跳转到搜索结果页时用） */
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;

  /** 全局提示条 */
  toasts: ToastItem[];
  pushToast: (title: string, text: string) => void;
  dismissToast: (id: number) => void;

  /** 办事统计：只增不减的实时数字 */
  todayCount: number;
}

const AppContext = createContext<AppState | null>(null);

/** 读取全局应用状态 */
export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内部使用');
  return ctx;
}

/* ================= 常量 ================= */

/** 今日受理量的初始值，对应参考图里的 8,888,888 */
const INITIAL_TODAY = 8_888_888;

/* ================= Provider ================= */

export function AppProvider({ children }: { children: React.ReactNode }) {
  // I. 登录态
  const [user, setUser] = useState<AppState['user']>(null);

  // II. 显示模式
  const [elderMode, setElderMode] = useState(false);
  const [a11yMode, setA11yMode] = useState(false);

  // III. 搜索
  const [searchKeyword, setSearchKeyword] = useState('');

  // IV. 提示条
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  // V. 统计数字
  const [todayCount, setTodayCount] = useState(INITIAL_TODAY);

  const pushToast = useCallback((title: string, text: string) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, title, text }]);
    // 6 秒后自动消失；古早网站的通知从来不会自动关闭，这里稍微善良一点
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(
    (name: string) => {
      setUser({ name, level: '实名认证用户', since: '2026-01-20' });
      pushToast('登录成功', `欢迎回来，${name}。您的办事数据已同步至联邦政务云。`);
    },
    [pushToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    pushToast('您已安全退出', '期待您下次光临，请继续保持满意。');
  }, [pushToast]);

  // VI. 统计数字持续上涨：每 1.8 秒 +1~4，永不回落
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayCount((n) => n + 1 + Math.floor(Math.random() * 4));
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  // VII. 把显示模式写到 <html> 上，供 CSS 变量覆盖
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('mode-elder', elderMode);
    root.classList.toggle('mode-a11y', a11yMode);
  }, [elderMode, a11yMode]);

  const value = useMemo<AppState>(
    () => ({
      user,
      login,
      logout,
      elderMode,
      toggleElderMode: () => setElderMode((v) => !v),
      a11yMode,
      toggleA11y: () => setA11yMode((v) => !v),
      searchKeyword,
      setSearchKeyword,
      toasts,
      pushToast,
      dismissToast,
      todayCount,
    }),
    [user, login, logout, elderMode, a11yMode, searchKeyword, toasts, pushToast, dismissToast, todayCount]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
