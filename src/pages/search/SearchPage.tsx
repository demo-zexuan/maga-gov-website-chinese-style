/**
 * 全站搜索结果页
 *
 * I. 页面职责
 *
 * 1. 聚合检索站内全部结构化数据源：要闻动态、政务公开、政策法规、党建引领、
 *    总统讲话、公告公示、政务服务事项、领导信息与统计数据。
 * 2. 结果按相关度排序，提供栏目过滤、命中片段与关键词高亮。
 * 3. 显示"共找到 N 条结果，用时 0.0xx 秒"，用时为固定小数，不做真随机。
 *
 * II. 黑色幽默配额的落点
 *
 * 1. 检索用时说明："用时由检索服务侧统计，不含排队时间；排队时间另行统计，暂不公开。"
 * 2. 排序说明："相关度由系统计算，计算方式属于商业秘密。"
 * 3. 空态：未命中可能意味着关键词不正确、内容已归档，或该内容从未存在。
 *
 * @module pages/search/SearchPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Crumbs, NewsList, Panel, TabBar } from '@/components/ui';
import { Link, navigate } from '@/router';
import { Highlight } from '@/pages/news/Highlight';
import { NEWS } from '@/data/news';
import { GOV_ARTICLES_BY_CATEGORY, GOV_CATEGORIES } from '@/data/gov';
import { LAW_ARTICLES_BY_CATEGORY, LAW_CATEGORIES } from '@/data/laws';
import { PARTY_TABS } from '@/data/party';
import { PRESS_BRIEFINGS, SPEECHES } from '@/data/speeches';
import { NOTICES } from '@/data/notices';
import { SERVICES } from '@/data/services';
import { ACTIVITIES, LEADERS } from '@/data/leaders';
import { APPS, DOWNLOADS, GUIDES } from '@/data/downloads';
import { FAQS } from '@/data/faqs';
import { STATES } from '@/data/states';
import { LETTERS } from '@/data/interact';
import {
  CASE_RANKING,
  DOWNLOAD_RANKING,
  EXTRA_STATS,
  HOME_STATS,
  formatNumber,
} from '@/data/stats';

/* ================= 检索文档模型 ================= */

/** 站内可检索的一条记录，所有数据源在装载时统一拍平为此结构 */
interface SearchDoc {
  id: string;
  /** 栏目 key，用于过滤选项卡 */
  typeKey: string;
  /** 栏目中文名 */
  typeLabel: string;
  title: string;
  /** 摘要（命中优先展示） */
  summary: string;
  /** 参与匹配的全文（摘要 + 正文 / 材料 / 流程等） */
  text: string;
  source: string;
  date?: string;
  /** 附加信息：文号、部门、办结时限等 */
  note?: string;
  href: string;
}

/** 结果排序后的展示结构 */
interface SearchHit extends SearchDoc {
  score: number;
}

/** 把 Article 类数据源拍平为检索文档 */
function fromArticles(
  items: { id: string; title: string; date: string; source: string; summary?: string; body: string[]; docNo?: string }[],
  typeKey: string,
  typeLabel: string,
  hrefOf: (id: string) => string
): SearchDoc[] {
  return items.map((a) => ({
    id: a.id,
    typeKey,
    typeLabel,
    title: a.title,
    summary: a.summary ?? a.body[0] ?? '',
    text: [a.summary ?? '', ...a.body].join(' '),
    source: a.source,
    date: a.date,
    note: a.docNo,
    href: hrefOf(a.id),
  }));
}

/** 装载全站检索语料：模块加载时构建一次 */
const CORPUS: SearchDoc[] = [
  // I. 要闻动态
  ...fromArticles(NEWS, 'news', '要闻动态', (id) => `/news/${id}`),

  // II. 政务公开（按分类拍平，跳转到对应栏目）
  ...Object.entries(GOV_ARTICLES_BY_CATEGORY).flatMap(([key, list]) => {
    const cat = GOV_CATEGORIES.find((c) => c.key === key);
    return fromArticles(list, 'gov', `政务公开 · ${cat?.label ?? key}`, () => cat?.path ?? '/gov');
  }),

  // III. 政策法规
  ...Object.entries(LAW_ARTICLES_BY_CATEGORY).flatMap(([key, list]) => {
    const cat = LAW_CATEGORIES.find((c) => c.key === key);
    return fromArticles(list, 'law', `政策法规 · ${cat?.label ?? key}`, () => cat?.path ?? '/law');
  }),

  // IV. 党建引领
  ...PARTY_TABS.flatMap((tab) =>
    fromArticles(tab.articles, 'party', `党建引领 · ${tab.label}`, () => tab.path)
  ),

  // V. 总统讲话与记者会实录
  ...fromArticles(SPEECHES, 'speech', '总统讲话', (id) => `/speech/detail/${id}`),
  ...fromArticles(PRESS_BRIEFINGS, 'speech', '记者会实录', (id) => `/speech/detail/${id}`),

  // VI. 公告公示
  ...NOTICES.map((n) => ({
    id: n.id,
    typeKey: 'notice',
    typeLabel: '公告公示',
    title: n.title,
    summary: n.body[0] ?? '',
    text: n.body.join(' '),
    source: '本站公告',
    date: n.date,
    note: n.tag,
    href: '/interact',
  })),

  // VII. 政务服务事项
  ...SERVICES.map((s) => ({
    id: s.id,
    typeKey: 'service',
    typeLabel: '政务服务事项',
    title: s.name,
    summary: `${s.department}　承诺办结时限 ${s.duration}　收费 ${s.fee}`,
    text: [s.name, s.department, s.duration, s.legalDuration, s.fee, ...s.materials, ...s.steps, s.quip ?? ''].join(' '),
    source: s.department,
    note: `法定时限 ${s.legalDuration}`,
    href: `/service/detail/${s.id}`,
  })),

  // VIII. 领导信息与领导活动
  ...LEADERS.map((l) => ({
    id: l.id,
    typeKey: 'leader',
    typeLabel: '领导信息',
    title: `${l.name}　${l.title}`,
    summary: `${l.duty}　分管：${l.scope.join('、')}`,
    text: [l.name, l.title, l.duty, l.scope.join(' '), l.quote].join(' '),
    source: '政务公开 · 人事信息',
    href: '/gov/personnel',
  })),
  ...ACTIVITIES.map((a) => ({
    id: a.id,
    typeKey: 'leader',
    typeLabel: '领导活动',
    title: a.title,
    summary: `${a.location}　${a.date}`,
    text: [a.title, a.location, a.date].join(' '),
    source: '政务公开 · 人事信息',
    date: a.date,
    href: '/news/president',
  })),

  // IX. 统计数据与排行榜
  ...[...HOME_STATS, ...EXTRA_STATS].map((s, i) => ({
    id: `stat-${i}`,
    typeKey: 'stat',
    typeLabel: '统计数据',
    title: `${s.label}：${s.decimal ? s.value.toFixed(1) : formatNumber(s.value)} ${s.unit}`,
    summary: '本站统计口径为系统自动统计，统计结果按日更新，历史数据不回溯修正。',
    text: `${s.label} ${s.value} ${s.unit}`,
    source: '本站统计',
    href: '/',
  })),
  ...DOWNLOAD_RANKING.map((r) => ({
    id: r.id,
    typeKey: 'stat',
    typeLabel: '下载排行',
    title: r.title,
    summary: `累计下载 ${formatNumber(r.value)} ${r.unit}。${r.remark ?? ''}`,
    text: [r.title, r.remark ?? '', r.unit].join(' '),
    source: '下载中心',
    href: '/download',
  })),
  ...CASE_RANKING.map((r) => ({
    id: r.id,
    typeKey: 'stat',
    typeLabel: '办件排行',
    title: r.title,
    summary: `累计办件 ${formatNumber(r.value)} ${r.unit}。`,
    text: r.title,
    source: '办件公示',
    href: '/service/records',
  })),

  // X. 下载中心：表格、办事指南与客户端
  ...[...DOWNLOADS, ...GUIDES].map((d) => ({
    id: d.id,
    typeKey: 'download',
    typeLabel: '下载中心 · 表格',
    title: `${d.name}（${d.format}）`,
    summary: `${d.department}　表格编号 ${d.formNo}　${d.size}　累计下载 ${formatNumber(d.downloads)} 次。`,
    text: [d.name, d.formNo, d.department, d.remark ?? '', d.format].join(' '),
    source: d.department,
    date: d.date,
    note: d.formNo,
    href: '/download',
  })),
  ...APPS.map((a) => ({
    id: a.id,
    typeKey: 'download',
    typeLabel: '下载中心 · 客户端',
    title: `${a.name} ${a.version}`,
    summary: `${a.platform}　${a.size}　发布日期 ${a.date}。${a.note}`,
    text: [a.name, a.platform, a.version, a.note].join(' '),
    source: '下载中心',
    date: a.date,
    note: a.platform,
    href: '/download/app',
  })),

  // XI. 常见问题
  ...FAQS.map((f) => ({
    id: f.id,
    typeKey: 'faq',
    typeLabel: '常见问题',
    title: f.question,
    summary: f.answer,
    text: [f.question, f.answer, f.footnote ?? '', f.category].join(' '),
    source: '互动交流 · 常见问题',
    note: f.category,
    href: '/interact/faq',
  })),

  // XII. 地方频道：各州分站
  ...STATES.map((s) => ({
    id: s.code,
    typeKey: 'state',
    typeLabel: '地方频道',
    title: `${s.name}（${s.code}）　首府 ${s.capital}`,
    summary: s.blurb,
    text: [s.name, s.nameEn, s.capital, s.nickname, s.blurb, s.feature, s.admitted].join(' '),
    source: '地方频道',
    note: `加入联邦 ${s.admitted} 年`,
    href: `/local/${s.code}`,
  })),

  // XIII. 信件选登
  ...LETTERS.map((l) => ({
    id: l.id,
    typeKey: 'letter',
    typeLabel: '信件选登',
    title: l.title,
    summary: l.body,
    text: [l.title, l.body, l.reply ?? '', l.department, l.status].join(' '),
    source: l.department,
    date: l.date,
    note: l.status,
    href: '/interact/letters',
  })),
];

/* ================= 检索实现 ================= */

/** 计算相关度：标题 > 文号 > 来源 > 全文，并对命中次数加权 */
function scoreOf(doc: SearchDoc, key: string): number {
  const k = key.toLowerCase();
  let score = 0;
  if (doc.title.toLowerCase().includes(k)) score += 10;
  if ((doc.note ?? '').toLowerCase().includes(k)) score += 3;
  if (doc.source.toLowerCase().includes(k)) score += 2;

  const body = doc.text.toLowerCase();
  const first = body.indexOf(k);
  if (first >= 0) {
    score += 4;
    const times = body.split(k).length - 1;
    score += Math.min(times, 5);
  }
  return score;
}

/** 检索用时：由关键词长度推导的固定小数，保证同一关键词每次显示一致 */
function elapsedOf(key: string): string {
  return (0.012 + ((key.length * 7) % 40) / 1000).toFixed(3);
}

/** 无关键词时推荐的检索词 */
const HOT_KEYS = ['表格', '时限', '维护', '满意度', '补贴', '轮候', '热线', '档案'];

export interface SearchPageProps {
  /** query 参数 q */
  q?: string;
}

export default function SearchPage({ q }: SearchPageProps) {
  const keyword = (q ?? '').trim();
  const [draft, setDraft] = useState(keyword);
  const [type, setType] = useState('all');

  useEffect(() => {
    setDraft(keyword);
    setType('all');
  }, [keyword]);

  // I. 检索：按相关度倒序，相关度相同时按日期倒序
  const hits = useMemo<SearchHit[]>(() => {
    if (!keyword) return [];
    return CORPUS.map((doc) => ({ ...doc, score: scoreOf(doc, keyword) }))
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score || (b.date ?? '').localeCompare(a.date ?? ''));
  }, [keyword]);

  // II. 栏目过滤
  const tabs = useMemo(() => {
    const counter = new Map<string, { label: string; count: number }>();
    hits.forEach((h) => {
      const prev = counter.get(h.typeKey);
      counter.set(h.typeKey, { label: h.typeLabel.split(' · ')[0], count: (prev?.count ?? 0) + 1 });
    });
    return [
      { key: 'all', label: '全部', count: hits.length },
      ...Array.from(counter.entries()).map(([key, v]) => ({ key, label: v.label, count: v.count })),
    ];
  }, [hits]);

  const shown = type === 'all' ? hits : hits.filter((h) => h.typeKey === type);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(draft.trim() ? `/search?q=${encodeURIComponent(draft.trim())}` : '/search');
  };

  const elapsed = elapsedOf(keyword || 'x');

  return (
    <div className="mg-page mg-srch-page">
      <Crumbs items={[{ label: '全站检索' }]} />

      <div className="mg-layout-3col">
        {/* ---------------- 左栏：检索说明 ---------------- */}
        <div className="mg-layout__left">
          <Panel title="检索范围" variant="navy">
            <div className="mg-news-note">
              本次检索覆盖要闻动态、政务公开、政策法规、党建引领、总统讲话、公告公示、政务服务事项、
              领导信息、统计数据、下载中心、常见问题、地方频道与信件选登共 13 类内容。
            </div>
            <div className="mg-news-note">
              未纳入本次检索的栏目有 3 个，原因分别是：栏目建设中、内容已归档、内容尚未被发明。
            </div>
          </Panel>

          <Panel title="热门检索词">
            <div className="mg-srch__keys">
              {HOT_KEYS.map((k) => (
                <Link key={k} to={`/search?q=${encodeURIComponent(k)}`} className="mg-chip">
                  {k}
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="检索提示">
            <div className="mg-news-note">
              关键词支持中文与数字。若检索结果过多，可改用更长的关键词；若结果过少，可改用更短的关键词。
            </div>
            <div className="mg-news-note">
              检索服务每日 23:30-23:40 重建索引，该时段内的检索结果以昨日索引为准。
            </div>
          </Panel>
        </div>

        {/* ---------------- 中栏：检索与结果 ---------------- */}
        <div className="mg-layout__main">
          <Panel title="全站检索" variant="red" flush>
            <form className="mg-srch__form" onSubmit={onSearch}>
              <label className="mg-news-search__label" htmlFor="site-q">
                关键词
              </label>
              <input
                id="site-q"
                className="mg-news-search__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="请输入关键词，例如：表格、时限、维护"
              />
              <button type="submit" className="mg-btn mg-btn--primary">
                搜索
              </button>
              {keyword && (
                <Link to="/search" className="mg-news-search__clear">
                  清空
                </Link>
              )}
            </form>

            {!keyword ? (
              <div className="mg-empty">
                <div className="mg-empty__icon">□</div>
                <div>请输入关键词后开始检索。</div>
                <div className="mg-news-note">
                  本站检索不提供"猜你想搜"，因为猜错的责任无法落实。
                </div>
              </div>
            ) : (
              <>
                <div className="mg-srch__stat">
                  共找到 <b>{shown.length}</b> 条结果，用时 {elapsed} 秒
                  {type !== 'all' && <>（已按栏目筛选，全部结果为 {hits.length} 条）</>}
                  。检索用时由检索服务侧统计，不含排队时间；排队时间另行统计，暂不公开。
                </div>

                <TabBar tabs={tabs} active={type} onChange={setType} className="mg-srch__tabs" />

                {shown.length === 0 ? (
                  <div className="mg-empty">
                    <div className="mg-empty__icon">□</div>
                    <div>未检索到与「{keyword}」相关的内容。</div>
                    <div className="mg-news-note">
                      可能的原因：关键词不正确；相关内容已被归档；或该内容自本站建站以来从未存在。
                    </div>
                    <div className="mg-news-note">
                      建议您更换关键词后重试，或直接到 <Link to="/service">办事大厅</Link> 办理相关业务——
                      无论检索结果如何，业务的办理流程都不会因此改变。
                    </div>
                  </div>
                ) : (
                  <ul className="mg-srch__list">
                    {shown.map((h) => (
                      <li key={`${h.typeKey}-${h.id}`} className="mg-srch__item">
                        <div className="mg-srch__head">
                          <span className="mg-chip mg-chip--red">{h.typeLabel}</span>
                          <Link to={h.href} className="mg-srch__title">
                            <Highlight text={h.title} keyword={keyword} />
                          </Link>
                        </div>
                        <p className="mg-srch__snippet">
                          <Highlight text={h.summary} keyword={keyword} clip={90} />
                        </p>
                        <div className="mg-srch__meta">
                          <span>来源：{h.source}</span>
                          {h.note && <span>{h.note}</span>}
                          {h.date && <span>{h.date}</span>}
                          <span className="mg-text-muted">相关度 {h.score}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Panel>

          <div className="mg-news-tip">
            结果按相关度排序；相关度由系统计算，计算方式属于商业秘密。
            相关度相同时按日期倒序，日期也相同时按录入顺序，录入顺序不予公开。
          </div>
        </div>

        {/* ---------------- 右栏：服务台 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="检索服务公告">
            <Alert tone="gray">
              本检索服务处于试运行阶段。试运行期间，检索结果仅供参考，不作为办事依据，
              亦不作为不办事的依据。
            </Alert>
            <div className="mg-news-note">
              本次检索共扫描记录 {formatNumber(CORPUS.length)} 条，其中结构化字段 {formatNumber(CORPUS.length * 6)} 个。
            </div>
            <div className="mg-news-note">
              如需人工协助检索，请拨打政务服务热线 1-800-000-0000。该号码尚未开通，开通后将在本站公布。
            </div>
          </Panel>

          <Panel title="大家还在搜">
            <NewsList
              items={HOT_KEYS.slice(0, 6).map((k) => ({
                id: k,
                title: k,
                href: `/search?q=${encodeURIComponent(k)}`,
              }))}
              showDate={false}
            />
          </Panel>

          <Panel title="找不到时怎么办">
            <NewsList
              items={[
                { id: 'b1', title: '办事指南：按事项类型浏览', href: '/service' },
                { id: 'b2', title: '政务公开：按栏目浏览', href: '/gov' },
                { id: 'b3', title: '常用问题：互动交流', href: '/interact' },
                { id: 'b4', title: '网站地图', href: '/sitemap' },
              ]}
              showDate={false}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
