/**
 * 路由表与应用根组件
 *
 * I. 路由契约（Sub 必须遵守）
 *
 * 新增页面时：
 * 1. 先在 src/data/site.ts 的 NAV_ITEMS 里登记栏目
 * 2. 再在本文件的 ROUTE_TABLE 里注册路径与组件
 * 3. 组件文件放在 src/pages/<模块>/ 下，默认导出
 *
 * II. 路径参数
 *
 * 通过 matchRoute 解析出的 params 会以 props 形式传给页面组件，
 * 例如 `/news/:id` 命中时页面会收到 `{ id: "20260412-001" }`。
 *
 * @module App
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React, { useEffect } from 'react';
import { useRoute, matchAny } from '@/router';
import { Shell } from '@/components/shell';
import { ToastLayer } from '@/components/ToastLayer';

/* ---------------- 页面模块（全部默认导出） ---------------- */

import HomePage from '@/pages/home/HomePage';

import NewsListPage from '@/pages/news/NewsListPage';
import NewsDetailPage from '@/pages/news/NewsDetailPage';

import GovPage from '@/pages/gov/GovPage';
import LawPage from '@/pages/law/LawPage';

import ServicePage from '@/pages/service/ServicePage';
import ServiceDetailPage from '@/pages/service/ServiceDetailPage';
import TrackPage from '@/pages/service/TrackPage';
import RecordsPage from '@/pages/service/RecordsPage';

import QueryPage from '@/pages/query/QueryPage';

import PartyPage from '@/pages/party/PartyPage';

import SpeechPage from '@/pages/speech/SpeechPage';
import SpeechDetailPage from '@/pages/speech/SpeechDetailPage';

import LocalPage from '@/pages/local/LocalPage';
import StatePage from '@/pages/local/StatePage';

import DownloadPage from '@/pages/download/DownloadPage';

import InteractPage from '@/pages/interact/InteractPage';

import SearchPage from '@/pages/search/SearchPage';

import NoticeDetailPage from '@/pages/notice/NoticeDetailPage';

import {
  AboutPage,
  AccessibilityPage,
  ContactPage,
  EnglishPage,
  LoginPage,
  NotFoundPage,
  PrivacyPage,
  RegisterPage,
  SitemapPage,
  TermsPage,
} from '@/pages/static/StaticPages';
import UserPage from '@/pages/user/UserPage';
import LinkPage from '@/pages/link/LinkPage';

import { EasterEggLayer } from '@/easter';

/* ---------------- 路由表 ---------------- */

interface RouteEntry {
  /** 路径模式，支持 `:param` */
  pattern: string;
  /** 渲染函数 */
  render: (params: Record<string, string>, query: Record<string, string>) => React.ReactNode;
  /** 命中时同步到 document.title 的后缀 */
  title: string;
}

/**
 * 全站路由表
 *
 * 顺序即优先级：具体的静态路径必须写在参数化路径之前，
 * 例如 `/service/track` 要排在 `/service/:id` 前面。
 */
const ROUTE_TABLE: RouteEntry[] = [
  { pattern: '/', render: () => <HomePage />, title: '首页' },

  /* ---- 要闻动态 ---- */
  //
  // 注意：静态子路径必须显式传入 category / tab，不能只靠 {...params} ——
  // 静态路径匹配时 params 是空对象，页面拿不到栏目信息会永远渲染默认栏目。
  { pattern: '/news', render: (p, q) => <NewsListPage {...p} {...q} />, title: '要闻动态' },
  {
    pattern: '/news/president',
    render: (p, q) => <NewsListPage {...p} {...q} category="president" />,
    title: '要闻动态 — 总统活动',
  },
  {
    pattern: '/news/dept',
    render: (p, q) => <NewsListPage {...p} {...q} category="dept" />,
    title: '要闻动态 — 部委动态',
  },
  {
    pattern: '/news/local',
    render: (p, q) => <NewsListPage {...p} {...q} category="local" />,
    title: '要闻动态 — 地方传真',
  },
  { pattern: '/news/:id', render: (p) => <NewsDetailPage id={p.id} />, title: '要闻详情' },

  /* ---- 政务公开 ---- */
  { pattern: '/gov', render: (p, q) => <GovPage {...p} {...q} />, title: '政务公开' },
  { pattern: '/gov/:tab', render: (p, q) => <GovPage {...p} {...q} />, title: '政务公开' },

  /* ---- 政策法规 ---- */
  { pattern: '/law', render: (p, q) => <LawPage {...p} {...q} />, title: '政策法规' },
  { pattern: '/law/:tab', render: (p, q) => <LawPage {...p} {...q} />, title: '政策法规' },

  /* ---- 政务服务 ---- */
  { pattern: '/service', render: (p, q) => <ServicePage {...p} {...q} />, title: '政务服务' },
  { pattern: '/service/track', render: () => <TrackPage />, title: '办事进度查询' },
  { pattern: '/service/records', render: () => <RecordsPage />, title: '办件公示' },
  {
    pattern: '/service/:scope',
    render: (p, q) => <ServicePage {...p} {...q} />,
    title: '政务服务 — 分类办事',
  },
  { pattern: '/service/detail/:id', render: (p) => <ServiceDetailPage id={p.id} />, title: '办事指南' },

  /* ---- 党建引领 ---- */
  { pattern: '/party', render: (p, q) => <PartyPage {...p} {...q} />, title: '党建引领' },
  { pattern: '/party/:tab', render: (p, q) => <PartyPage {...p} {...q} />, title: '党建引领' },

  /* ---- 总统讲话 ---- */
  { pattern: '/speech', render: (p, q) => <SpeechPage {...p} {...q} />, title: '总统讲话' },
  {
    pattern: '/speech/tweets',
    render: (p, q) => <SpeechPage {...p} {...q} tab="tweets" />,
    title: '总统讲话 — 每日推文',
  },
  {
    pattern: '/speech/press',
    render: (p, q) => <SpeechPage {...p} {...q} tab="press" />,
    title: '总统讲话 — 记者会实录',
  },
  { pattern: '/speech/detail/:id', render: (p) => <SpeechDetailPage id={p.id} />, title: '讲话全文' },
  { pattern: '/speech/:tab', render: (p, q) => <SpeechPage {...p} {...q} />, title: '总统讲话' },

  /* ---- 地方频道 ---- */
  { pattern: '/local', render: (p, q) => <LocalPage {...p} {...q} />, title: '地方频道' },
  {
    pattern: '/local/governor',
    render: (p, q) => <LocalPage {...p} {...q} tab="governor" />,
    title: '地方频道 — 州长活动',
  },
  { pattern: '/local/:code', render: (p) => <StatePage code={p.code} />, title: '州分站' },

  /* ---- 便民查询 ---- */
  { pattern: '/query', render: (p, q) => <QueryPage {...p} {...q} />, title: '便民查询' },
  { pattern: '/query/:tool', render: (p, q) => <QueryPage {...p} {...q} />, title: '便民查询' },

  /* ---- 下载中心 ---- */
  { pattern: '/download', render: (p, q) => <DownloadPage {...p} {...q} />, title: '下载中心' },
  { pattern: '/download/:tab', render: (p, q) => <DownloadPage {...p} {...q} />, title: '下载中心' },

  /* ---- 互动交流 ---- */
  { pattern: '/interact', render: (p, q) => <InteractPage {...p} {...q} />, title: '互动交流' },
  { pattern: '/interact/:tab', render: (p, q) => <InteractPage {...p} {...q} />, title: '互动交流' },

  /* ---- 搜索 ---- */
  { pattern: '/search', render: (p, q) => <SearchPage {...q} />, title: '搜索结果' },

  /* ---- 公告详情 ----
     首页「公告公示」与走马灯公告都指向 /notice/:id，此前漏注册导致 404 */
  { pattern: '/notice/:id', render: (p) => <NoticeDetailPage id={p.id} />, title: '公告详情' },

  /* ---- 静态页 ---- */
  { pattern: '/about', render: () => <AboutPage />, title: '关于我们' },
  { pattern: '/sitemap', render: () => <SitemapPage />, title: '网站地图' },
  { pattern: '/privacy', render: () => <PrivacyPage />, title: '隐私政策' },
  { pattern: '/terms', render: () => <TermsPage />, title: '使用条款' },
  { pattern: '/contact', render: () => <ContactPage />, title: '联系我们' },
  { pattern: '/accessibility', render: () => <AccessibilityPage />, title: '无障碍声明' },
  { pattern: '/english', render: () => <EnglishPage />, title: 'English' },
  { pattern: '/elder', render: () => <AccessibilityPage />, title: '长者模式说明' },
  { pattern: '/login', render: () => <LoginPage />, title: '用户登录' },
  { pattern: '/register', render: () => <RegisterPage />, title: '用户注册' },
  { pattern: '/user', render: () => <UserPage />, title: '个人中心' },

  /* ---- 友情链接中转 ---- */
  { pattern: '/link/:id', render: (p) => <LinkPage id={p.id} />, title: '友情链接' },
];

const PATTERNS = ROUTE_TABLE.map((r) => r.pattern);

/* ---------------- 根组件 ---------------- */

export default function App() {
  const { path, query } = useRoute();

  const hit = matchAny(PATTERNS, path);
  const entry = hit ? ROUTE_TABLE[hit.index] : null;

  // 路由变化时同步标题；古早网站的标题格式就是「页面名 - 站点名」
  useEffect(() => {
    document.title = entry
      ? `${entry.title} — ${'美利坚合众国网上便民服务中心'}`
      : '页面未找到 — 美利坚合众国网上便民服务中心';
  }, [entry]);

  return (
    <>
      <Shell>
        {entry ? entry.render(hit!.params, query) : <NotFoundPage />}
      </Shell>
      <EasterEggLayer />
      <ToastLayer />
    </>
  );
}
