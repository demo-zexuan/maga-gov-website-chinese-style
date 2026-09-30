/**
 * 极简 hash 路由
 *
 * I. 为什么不用 react-router
 *
 * 1. 站点是纯静态 SPA，且要部署到 Cloudflare Workers 静态资源，hash 路由无需
 *    任何服务端 rewrite 规则，刷新永远不会 404。
 * 2. 古早网站的 URL 形态本来就很"土"（/index.jsp?menuid=12），hash 形态
 *    #/news/123 在气质上也更贴。
 * 3. 少一个依赖 = 少一处构建风险。
 *
 * II. 能力
 *
 * 1. 路径模式 `#/news/:id` 形式的参数化匹配
 * 2. `useRoute()` 返回 { path, params, query }
 * 3. `<Link to="...">` 声明式跳转，自动处理 active 状态
 * 4. `navigate(to)` 命令式跳转
 *
 * @module router
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* ---------------- 类型 ---------------- */

export interface RouteState {
  /** 规范化后的路径，例如 "/news/123" */
  path: string;
  /** 路径参数，例如 { id: "123" } */
  params: Record<string, string>;
  /** querystring 解析结果 */
  query: Record<string, string>;
  /** 原始 hash */
  hash: string;
}

/* ---------------- 内部工具 ---------------- */

/** 把 location.hash 规范化为 "path?query" 形式 */
function readHash(): string {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function parseHash(raw: string): { path: string; query: Record<string, string> } {
  const qIndex = raw.indexOf('?');
  if (qIndex === -1) return { path: raw, query: {} };
  const path = raw.slice(0, qIndex);
  const query: Record<string, string> = {};
  new URLSearchParams(raw.slice(qIndex + 1)).forEach((v, k) => {
    query[k] = v;
  });
  return { path, query };
}

/** 将 `#/news/:id` 编译为正则，并返回参数名顺序 */
function compile(pattern: string): { re: RegExp; keys: string[] } {
  const keys: string[] = [];
  const source = pattern
    .replace(/\/+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, (m) => (m === ':' ? ':' : `\\${m}`))
    .replace(/:([A-Za-z0-9_]+)/g, (_m, name: string) => {
      keys.push(name);
      return '([^/]+)';
    });
  return { re: new RegExp(`^${source || '/'}/?$`), keys };
}

const compiledCache = new Map<string, { re: RegExp; keys: string[] }>();

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  let c = compiledCache.get(pattern);
  if (!c) {
    c = compile(pattern);
    compiledCache.set(pattern, c);
  }
  const m = c.re.exec(path);
  if (!m) return null;
  const params: Record<string, string> = {};
  c.keys.forEach((k, i) => {
    params[k] = decodeURIComponent(m[i + 1] ?? '');
  });
  return params;
}

/* ---------------- Context ---------------- */

const RouteContext = createContext<RouteState>({
  path: '/',
  params: {},
  query: {},
  hash: '',
});

/** 订阅当前路由状态 */
export function useRoute(): RouteState {
  return useContext(RouteContext);
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [hash, setHash] = useState<string>(() => readHash());

  useEffect(() => {
    const onChange = () => setHash(readHash());
    window.addEventListener('hashchange', onChange);
    // 首次进入若没有 hash，补一个 #/ 让地址栏形态统一
    if (!window.location.hash) window.location.replace('#/');
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const value = useMemo<RouteState>(() => {
    const { path, query } = parseHash(hash);
    return { path, params: {}, query, hash };
  }, [hash]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

/**
 * 在路由表里匹配当前路径
 *
 * @param routes - 模式数组，按顺序优先匹配（支持 `:param`）
 * @param path   - 当前路径
 * @returns 命中的模式、参数与索引；未命中返回 null
 */
export function matchAny(
  routes: string[],
  path: string
): { pattern: string; params: Record<string, string>; index: number } | null {
  for (let i = 0; i < routes.length; i++) {
    const params = matchRoute(routes[i], path);
    if (params) return { pattern: routes[i], params, index: i };
  }
  return null;
}

/* ---------------- 命令式 API ---------------- */

/** 命令式跳转（hash 路由） */
export function navigate(to: string, opts?: { replace?: boolean }) {
  const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
  if (opts?.replace) {
    window.location.replace(target);
  } else {
    window.location.hash = target;
  }
}

/** 回到页面顶部；古早站点每次跳转都会滚到顶，这里模拟该行为 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------------- Link ---------------- */

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

/**
 * 站内链接
 *
 * 渲染为真实的 <a href="#/xxx">，保证中键新窗口打开、右键复制链接、
 * 以及搜索引擎可读性都正常工作。
 */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const href = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : `/${to}`}`;
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** 判断某个路径前缀是否处于激活状态（用于导航高亮） */
export function useIsActive(prefix: string): boolean {
  const { path } = useRoute();
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(`${prefix}/`);
}
