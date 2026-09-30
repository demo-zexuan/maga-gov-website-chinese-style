/**
 * 通用 UI 组件库
 *
 * I. 组件清单
 *
 * 1. Panel     —— 面板容器（标题栏 + 内容区），全站布局基础
 * 2. TabBar    —— 面板内选项卡
 * 3. NewsList  —— 新闻/文件列表（支持日期、角标、序号、头条）
 * 4. Badge     —— 角标
 * 5. Modal     —— 弹窗
 * 6. Marquee   —— 走马灯公告
 * 7. StatRow   —— 统计数字行
 * 8. Pager     —— 分页器
 * 9. Crumbs    —— 面包屑
 * 10. Alert    —— 提示条
 * 11. Progress —— 进度条
 * 12. Loading  —— 加载态
 * 13. Button   —— 按钮
 * 14. Field   —— 表单行
 *
 * II. 使用约定
 *
 * 1. 所有页面的布局容器必须优先使用 Panel，不要自己写边框 div。
 * 2. 列表统一用 NewsList，日期统一右对齐，保持全站视觉节奏一致。
 *
 * @module components/ui
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/router';

/* ================= Panel ================= */

export interface PanelProps {
  /** 面板标题栏文字 */
  title?: React.ReactNode;
  /** 标题栏右侧内容（通常是「更多>>」链接或选项卡） */
  extra?: React.ReactNode;
  /** 主题色变体 */
  variant?: 'default' | 'red' | 'navy';
  /** 内容区去掉默认内边距 */
  flush?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义标题栏类名 */
  headClassName?: string;
  /** 面板主体样式 */
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/** 通用面板：古早政务网站的"标题栏 + 白底内容区"卡片 */
export function Panel({
  title,
  extra,
  variant = 'default',
  flush,
  className = '',
  headClassName = '',
  style,
  children,
}: PanelProps) {
  const variantClass = variant === 'default' ? '' : ` mg-panel--${variant}`;
  return (
    <div className={`mg-panel${variantClass} ${className}`} style={style}>
      {title !== undefined && (
        <div className={`mg-panel__head ${headClassName}`}>
          <span className="mg-panel__head-text">{title}</span>
          {extra && <span className="mg-panel__head-extra">{extra}</span>}
        </div>
      )}
      <div className={`mg-panel__body${flush ? ' mg-panel__body--flush' : ''}`}>{children}</div>
    </div>
  );
}

/** 面板标题栏右侧的「更多»」链接 */
export function MoreLink({ to, children = '更多' }: { to: string; children?: React.ReactNode }) {
  return (
    <Link to={to} className="mg-more">
      {children}
    </Link>
  );
}

/* ================= TabBar ================= */

export interface TabItem {
  key: string;
  label: string;
  /** 右侧小号计数（可选） */
  count?: number | string;
}

export interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

/** 文件夹标签风格的选项卡 */
export function TabBar({ tabs, active, onChange, className = '' }: TabBarProps) {
  return (
    <div className={`mg-tabbar ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          className={`mg-tabbar__tab${t.key === active ? ' is-active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined && <span className="mg-tabbar__tab-count">({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

/* ================= NewsList ================= */

export interface NewsItem {
  id: string;
  title: string;
  date?: string;
  badge?: string;
  badgeTone?: 'red' | 'gold' | 'navy' | 'green' | 'outline';
  href?: string;
  summary?: string;
}

export interface NewsListProps {
  items: NewsItem[];
  /** 是否显示日期列（默认 true） */
  showDate?: boolean;
  /** 是否显示红色圆点序号 */
  showBullet?: boolean;
  /** 首条作为头条放大加红 */
  headlineFirst?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 每条最大字符数，超出省略（默认不截断，由 CSS 控制） */
  className?: string;
  /** 点击条目回调；不传则使用 href 跳转 */
  onItemClick?: (item: NewsItem) => void;
}

/** 新闻/文件通用列表：左圆点 + 标题 + 可选角标 + 右日期 */
export function NewsList({
  items,
  showDate = true,
  showBullet = true,
  headlineFirst = false,
  emptyText = '暂无数据',
  className = '',
  onItemClick,
}: NewsListProps) {
  if (items.length === 0) {
    return <div className="mg-list mg-text-center mg-text-muted">{emptyText}</div>;
  }
  return (
    <ul className={`mg-list ${className}`}>
      {items.map((item, idx) => {
        const isHeadline = headlineFirst && idx === 0;
        const content = (
          <>
            {showBullet && <span className="mg-list__bullet">•</span>}
            {item.badge && (
              <span className={`mg-badge${item.badgeTone && item.badgeTone !== 'red' ? ` mg-badge--${item.badgeTone}` : ''}`}>
                {item.badge}
              </span>
            )}
            <span className="mg-list__text" title={item.title}>
              {item.title}
            </span>
            {showDate && item.date && <span className="mg-list__date">{item.date}</span>}
          </>
        );
        return (
          <li
            key={item.id}
            className={`mg-list__item${isHeadline ? ' mg-list__item--headline' : ''}`}
          >
            {onItemClick ? (
              <a
                href={item.href ?? '#'}
                style={{ display: 'contents' }}
                onClick={(e) => {
                  e.preventDefault();
                  onItemClick(item);
                }}
              >
                {content}
              </a>
            ) : (
              <Link to={item.href ?? '#'} style={{ display: 'contents' }}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ================= Badge ================= */

export function Badge({
  children,
  tone = 'red',
  round = false,
}: {
  children: React.ReactNode;
  tone?: 'red' | 'gold' | 'navy' | 'green' | 'outline';
  round?: boolean;
}) {
  const cls = [
    'mg-badge',
    tone !== 'red' ? `mg-badge--${tone}` : '',
    round ? 'mg-badge--round' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
}

/* ================= Modal ================= */

export interface ModalProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  width?: number;
  footer?: React.ReactNode;
  /** 是否允许点击遮罩关闭（默认 true） */
  maskClosable?: boolean;
  children: React.ReactNode;
}

/** 古早风弹窗：深色遮罩 + 无圆角窗框 + 红色标题栏 */
export function Modal({
  open,
  title,
  onClose,
  width,
  footer,
  maskClosable = true,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="mg-modal__mask"
      onMouseDown={(e) => {
        if (maskClosable && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mg-modal" style={width ? { width } : undefined} role="dialog" aria-modal="true">
        <div className="mg-modal__head">
          <span className="mg-modal__title">{title}</span>
          <button type="button" className="mg-modal__close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        <div className="mg-modal__body">{children}</div>
        {footer && <div className="mg-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ================= Marquee ================= */

export function Marquee({
  label = '公告',
  items,
}: {
  label?: string;
  items: { id: string; title: string; href?: string }[];
}) {
  return (
    <div className="mg-marquee">
      <span className="mg-marquee__label">{label}</span>
      <div className="mg-marquee__viewport">
        <div className="mg-marquee__track">
          {items.map((it) => (
            <Link key={it.id} to={it.href ?? '#'}>
              {it.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= StatRow ================= */

export function StatRow({
  icon,
  label,
  value,
  unit,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
}) {
  return (
    <div className="mg-stat">
      {icon && <span className="mg-stat__icon">{icon}</span>}
      <span className="mg-stat__label">{label}</span>
      <span className="mg-stat__value">
        {value}
        {unit && <span className="mg-stat__unit">{unit}</span>}
      </span>
    </div>
  );
}

/* ================= Pager ================= */

export interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** 显示「共 N 页」信息 */
  totalItems?: number;
}

/** 古早分页器：首页 上一页 1 2 3 ... 下一页 末页 */
export function Pager({ page, totalPages, onChange, totalItems }: PagerProps) {
  if (totalPages <= 1) return null;
  const nums: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) nums.push(i);

  const btn = (label: React.ReactNode, target: number, disabled = false, active = false) => (
    <a
      key={`${label}-${target}`}
      href="#"
      className={`mg-pager__btn${active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled && !active) onChange(target);
      }}
    >
      {label}
    </a>
  );

  return (
    <div className="mg-pager">
      {btn('首页', 1, page === 1)}
      {btn('上一页', page - 1, page === 1)}
      {start > 1 && <span className="mg-pager__btn is-disabled">…</span>}
      {nums.map((n) => btn(n, n, false, n === page))}
      {end < totalPages && <span className="mg-pager__btn is-disabled">…</span>}
      {btn('下一页', page + 1, page === totalPages)}
      {btn('末页', totalPages, page === totalPages)}
      <span className="mg-pager__info">
        共 {totalPages} 页{totalItems !== undefined ? ` / ${totalItems} 条` : ''}
      </span>
    </div>
  );
}

/* ================= Crumbs ================= */

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className="mg-crumbs">
      <span>当前位置：</span>
      <Link to="/" className="mg-crumbs__home">
        首页
      </Link>
      {items.map((it, i) => (
        <React.Fragment key={`${it.label}-${i}`}>
          <span>›</span>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ================= Alert ================= */

export function Alert({
  children,
  tone = 'yellow',
  icon,
}: {
  children: React.ReactNode;
  tone?: 'yellow' | 'red' | 'gray';
  icon?: React.ReactNode;
}) {
  const cls = tone === 'yellow' ? '' : ` mg-alert--${tone}`;
  const defaultIcon = tone === 'red' ? '!' : tone === 'gray' ? 'i' : 'i';
  return (
    <div className={`mg-alert${cls}`}>
      <span className="mg-alert__icon">{icon ?? defaultIcon}</span>
      <div>{children}</div>
    </div>
  );
}

/* ================= Progress ================= */

export function Progress({ percent, red = false }: { percent: number; red?: boolean }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="mg-progress" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`mg-progress__bar${red ? ' mg-progress__bar--red' : ''}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ================= Loading ================= */

export function Loading({ text = '数据加载中，请稍候…' }: { text?: string }) {
  return (
    <div className="mg-loading">
      <span className="mg-loading__spinner" />
      {text}
    </div>
  );
}

/* ================= Button ================= */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'mg-btn',
    variant !== 'default' ? `mg-btn--${variant}` : '',
    size !== 'md' ? `mg-btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ================= Field ================= */

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mg-form__row">
      <div className="mg-form__label">
        {required && <span className="mg-required">*</span>}
        {label}
      </div>
      <div className="mg-form__control">
        {children}
        {hint && !error && <div className="mg-form__hint">{hint}</div>}
        {error && <div className="mg-form__error">{error}</div>}
      </div>
    </div>
  );
}

/* ================= useTypewriter ================= */

/**
 * 打字机效果 Hook
 *
 * 用于「办事进度通报」「领导讲话」等需要营造"实时"感的场景。
 * 刻意保留一个可配置的"卡顿"参数，模拟古早网站服务端渲染的迟滞感。
 *
 * @param text    - 完整文本
 * @param speed   - 每字符间隔毫秒
 * @param enabled - 是否启用（false 时直接返回全文）
 * @returns 当前已输出的文本片段
 */
export function useTypewriter(text: string, speed = 45, enabled = true): string {
  const [shown, setShown] = useState(enabled ? '' : text);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) {
        timer.current = window.setTimeout(tick, speed + (i % 7 === 0 ? 120 : 0));
      }
    };
    timer.current = window.setTimeout(tick, speed);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [text, speed, enabled]);

  return shown;
}
