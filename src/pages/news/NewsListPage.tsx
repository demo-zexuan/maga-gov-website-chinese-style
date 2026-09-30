/**
 * 要闻动态 · 栏目列表页
 *
 * I. 页面职责
 *
 * 1. 同时承载 /news、/news/president、/news/dept、/news/local 四个路由，
 *    子栏目由路径段或 query 参数 tab 决定。
 * 2. 左栏为栏目树，主区为分页稿件列表（标题 + 摘要 + 来源 + 日期 + 阅读量），
 *    右栏为本栏热点与编务数据。
 * 3. 支持 ?q= 关键词过滤，命中词在标题与摘要中高亮。
 *
 * II. 黑色幽默配额的落点
 *
 * 1. 右侧「编务说明」：稿件修改需先填写申请单，申请单第 3 页需另行索取。
 * 2. 左栏「本栏数据」：今日新增 0 篇，且该数字长期保持稳定。
 * 3. 空态：本栏目稿件按发稿顺序排列，不按相关性排列。
 *
 * @module pages/news/NewsListPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Badge, Crumbs, MoreLink, NewsList, Pager, Panel, TabBar } from '@/components/ui';
import { Link, navigate, useRoute } from '@/router';
import {
  NEWS,
  NEWS_CATEGORIES,
  categoryLabel,
  isNewsCategory,
  newsByCategory,
  searchNews,
  topNews,
} from '@/data/news';
import { formatNumber } from '@/data/stats';
import type { Article } from '@/data/types';
import { Highlight } from './Highlight';

/** 每页条数 */
const PAGE_SIZE = 15;

export interface NewsListPageProps {
  /** query 参数 tab：用于 /news?tab=top 这一形态 */
  tab?: string;
  /** 路径参数形式的子栏目（保留以兼容路由透传） */
  category?: string;
  /** query 参数 q：关键词过滤 */
  q?: string;
}

/** 从路径推导子栏目；`/news/president` → president */
function pathToCategory(path: string): string | null {
  const seg = path.split('/')[2] ?? '';
  return isNewsCategory(seg) ? seg : null;
}

/** 生成子栏目的跳转地址，并保留当前关键词；头条即 /news 本身 */
function hrefOf(key: string, keyword: string): string {
  const base = key === 'all' ? '/news?tab=all' : key === 'top' ? '/news' : `/news/${key}`;
  if (!keyword) return base;
  return `${base}${base.includes('?') ? '&' : '?'}q=${encodeURIComponent(keyword)}`;
}

export default function NewsListPage({ tab, category, q }: NewsListPageProps) {
  const { path, query } = useRoute();

  // I. 子栏目的判定顺序：category（路由显式传入）→ 路径段 → ?tab= → 默认头条
  const active = useMemo(() => {
    if (isNewsCategory(category)) return category;
    const fromPath = pathToCategory(path);
    if (fromPath) return fromPath;
    if (tab === 'all' || query.tab === 'all') return 'all';
    if (isNewsCategory(tab)) return tab;
    if (isNewsCategory(query.tab)) return query.tab;
    return 'top';
  }, [category, path, tab, query.tab]);

  const keyword = (q ?? '').trim();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(keyword);

  // II. 栏目或关键词变化时回到第一页；外部关键词变化时同步输入框
  useEffect(() => {
    setPage(1);
  }, [active, keyword]);
  useEffect(() => {
    setDraft(keyword);
  }, [keyword]);

  // III. 取数：有关键词时按相关度排序，否则按日期倒序
  const list = useMemo<Article[]>(() => {
    if (keyword) {
      const hits = searchNews(keyword);
      return active === 'all' ? hits : hits.filter((a) => a.category === active);
    }
    return active === 'all' ? NEWS : newsByCategory(active);
  }, [active, keyword]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const items = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const tabs = [
    { key: 'all', label: '全部', count: NEWS.length },
    ...NEWS_CATEGORIES.map((c) => ({
      key: c.key as string,
      label: c.label,
      count: newsByCategory(c.key).length,
    })),
  ];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(hrefOf(active, draft.trim()));
  };

  const hot = topNews(10);
  const headline =
    !keyword && current === 1 && (active === 'all' || active === 'top') ? items[0] : null;

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '要闻动态', to: '/news' },
          { label: active === 'all' ? '全部稿件' : categoryLabel(active) },
        ]}
      />

      <div className="mg-layout-3col">
        {/* ---------------- 左栏：栏目树 ---------------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">要闻动态</div>
            <Link
              to={hrefOf('all', keyword)}
              className={`mg-sidenav__item${active === 'all' ? ' is-active' : ''}`}
            >
              全部稿件（{NEWS.length}）
            </Link>
            {NEWS_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to={hrefOf(c.key, keyword)}
                className={`mg-sidenav__item${active === c.key ? ' is-active' : ''}`}
              >
                {c.label}（{newsByCategory(c.key).length}）
              </Link>
            ))}
          </div>

          <Panel title="栏目说明" variant="navy">
            <div className="mg-news-note">
              {NEWS_CATEGORIES.find((c) => c.key === active)?.desc ??
                '本栏目收录全部子栏目稿件，按发稿时间倒序排列。'}
            </div>
            <div className="mg-news-note">
              稿件一经发布即自动归档。如需修改，请填写《稿件修改申请单》，该单第 3 页需另行索取。
            </div>
          </Panel>

          <Panel title="本栏数据">
            <div className="mg-news-figures">
              <span>在库稿件</span>
              <b>{NEWS.length} 篇</b>
            </div>
            <div className="mg-news-figures">
              <span>今日新增</span>
              <b>0 篇</b>
            </div>
            <div className="mg-news-figures">
              <span>平均篇幅</span>
              <b>6 段</b>
            </div>
            <div className="mg-news-figures">
              <span>编务满意度</span>
              <b>99.8%</b>
            </div>
          </Panel>
        </div>

        {/* ---------------- 中栏：稿件列表 ---------------- */}
        <div className="mg-layout__main">
          <Panel
            title={active === 'all' ? '要闻动态' : categoryLabel(active)}
            variant="red"
            extra={<MoreLink to={`/search?q=${encodeURIComponent('表格')}`}>全站检索</MoreLink>}
            flush
          >
            <TabBar tabs={tabs} active={active} onChange={(key) => navigate(hrefOf(key, keyword))} />

            <form className="mg-news-search" onSubmit={onSearch}>
              <label className="mg-news-search__label" htmlFor="news-q">
                标题检索
              </label>
              <input
                id="news-q"
                className="mg-news-search__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="请输入关键词，例如：表格、时限、维护"
              />
              <button type="submit" className="mg-btn mg-btn--primary">
                检索
              </button>
              {keyword && (
                <Link to={hrefOf(active, '')} className="mg-news-search__clear">
                  清除关键词
                </Link>
              )}
              <span className="mg-news-search__hint">
                检索结果按相关度排列，相关度相同时按日期倒序；未检索时一律按日期倒序。
              </span>
            </form>

            {keyword && (
              <div className="mg-news-search__sum">
                关键词「{keyword}」在{active === 'all' ? '全部稿件' : categoryLabel(active)}中共命中{' '}
                <b>{list.length}</b> 条。
              </div>
            )}

            {items.length === 0 ? (
              <div className="mg-empty">
                <div className="mg-empty__icon">□</div>
                <div>暂无符合条件的稿件。</div>
                <div className="mg-news-note">
                  本栏目稿件按发稿顺序排列，不按相关性排列；未命中说明该内容尚未被发明，或已被归档。
                </div>
                <div className="mg-news-note">
                  您也可以 <Link to={hrefOf(active, '')}>清除关键词</Link> 后浏览全部稿件。
                </div>
              </div>
            ) : (
              <ul className="mg-news-list">
                {items.map((a) => (
                  <li key={a.id} className={`mg-news-list__item${headline?.id === a.id ? ' is-headline' : ''}`}>
                    <div className="mg-news-list__row">
                      {a.badge && <Badge tone={a.badgeTone ?? 'red'}>{a.badge}</Badge>}
                      <Link to={`/news/${a.id}`} className="mg-news-list__title" title={a.title}>
                        <Highlight text={a.title} keyword={keyword} />
                      </Link>
                      {a.docNo && <span className="mg-chip">{a.docNo}</span>}
                    </div>
                    {a.summary && (
                      <p className="mg-news-list__summary">
                        <Highlight text={a.summary} keyword={keyword} clip={70} />
                      </p>
                    )}
                    <div className="mg-news-list__meta">
                      <span>来源：{a.source}</span>
                      <span>栏目：{categoryLabel(a.category)}</span>
                      <span>阅读 {formatNumber(a.views ?? 0)}</span>
                      <span className="mg-news-list__date">{a.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Pager page={current} totalPages={totalPages} onChange={setPage} totalItems={list.length} />
          </Panel>

          <div className="mg-news-tip">
            提示：本页每页显示 {PAGE_SIZE} 条。若本页不足 {PAGE_SIZE} 条，说明后面确实没有了；
            若恰好 {PAGE_SIZE} 条，请以页码为准。
          </div>
        </div>

        {/* ---------------- 右栏：热点与编务 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="本栏热点" extra={<MoreLink to="/news" />}>
            <NewsList
              items={hot.map((a) => ({
                id: a.id,
                title: a.title,
                date: a.date,
                href: `/news/${a.id}`,
              }))}
            />
          </Panel>

          <Panel title="编务说明" variant="navy">
            <Alert tone="gray">
              本站稿件由编务系统自动编号、自动归档、自动统计阅读量。系统每日 23:00 重置阅读量统计口径，
              重置前后的数据不可比。
            </Alert>
            <div className="mg-news-note">
              本栏稿件均经三审三校：初审由系统自动通过，复审由系统自动通过，终审由系统自动通过。
            </div>
            <div className="mg-news-note">
              如需转载本栏稿件，请注明来源并保留本说明；本说明如需转载，请另行申请。
            </div>
          </Panel>

          <Panel title="常用入口">
            <NewsList
              items={[
                { id: 'e1', title: '办事进度查询', href: '/service/track' },
                { id: 'e2', title: '办件公示', href: '/service/records' },
                { id: 'e3', title: '下载中心（表格 1,147 种）', href: '/download' },
                { id: 'e4', title: '互动交流（满意度调查）', href: '/interact' },
              ]}
              showDate={false}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
