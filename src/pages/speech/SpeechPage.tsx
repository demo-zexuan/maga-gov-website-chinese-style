/**
 * 总统讲话栏目页
 *
 * I. 页面职责
 *
 * 承载「总统讲话」栏目的三个子栏目，路由与内容一一对应：
 *
 * 1. 重要讲话（/speech）
 *    (1) 左栏：栏目导航 + 按主题浏览
 *    (2) 中栏：头条讲话 + 讲话列表
 *    (3) 右栏：讲话要点 + 讲话全文检索（标题命中的关键词会被高亮）
 *
 * 2. 每日推文（/speech/tweets）
 *    (1) 排版刻意做成社交信息流的样子：方形头像 / 用户名 / 账号 / 时间 / 正文 / 互动计数
 *    (2) 配色仍然是政务红蓝金；头像不使用圆角，直角是全站最重要的视觉指纹
 *    (3) 「加载更多」每次追加 10 条，直到全部加载完毕
 *
 * 3. 记者会实录（/speech/press）
 *    (1) 场次列表，点击展开问答全文，展开后可收起
 *    (2) 问答按角色分别排版，场景说明另作样式
 *
 * II. 数据来源
 *
 * 全部取自 @/data/speeches，本页面不自行维护文案。
 *
 * III. 子栏目判定
 *
 * 优先使用 App.tsx 传入的 tab 属性；`/speech/tweets`、`/speech/press` 属于静态路由，
 * 不会带属性下来，因此回退到当前路径的第二段来判断（见 tabFromPath）。
 *
 * @module pages/speech/SpeechPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Fragment, useMemo, useState } from 'react';
import { Alert, Badge, Button, Crumbs, NewsList, Panel, StatRow } from '@/components/ui';
import { Link, useRoute } from '@/router';
import { useApp } from '@/app-context';
import {
  PRESS_BRIEFINGS,
  SPEECHES,
  SPEECH_TOPICS,
  TWEETS,
  featuredPoints,
  latestSpeeches,
  latestTweets,
  parseQa,
  speechesByTopic,
  topTweets,
  tweetTotals,
} from '@/data/speeches';
import type { PressBriefing, Speech, Tweet } from '@/data/speeches';

/* ================= 常量 ================= */

interface TabDef {
  key: string;
  label: string;
  path: string;
  /** 侧栏与选项卡上的计数 */
  count: number;
}

const TAB_DEFS: TabDef[] = [
  { key: 'speeches', label: '重要讲话', path: '/speech', count: SPEECHES.length },
  { key: 'tweets', label: '每日推文', path: '/speech/tweets', count: TWEETS.length },
  { key: 'press', label: '记者会实录', path: '/speech/press', count: PRESS_BRIEFINGS.length },
];

/** 推文每次追加的条数 */
const TWEET_PAGE_SIZE = 10;

/** 横幅引言：出自表格治理工作推进会 */
const BANNER_QUOTE =
  '我们正在做一件前所未有的事——把政府的表格，搬到网上去。没有人比我更懂表格。';
const BANNER_FROM = '—— 美利坚合众国总统，在联邦表格治理现代化工作推进会上的讲话';

/* ================= 小工具 ================= */

/** 千分位格式化（不额外引入依赖，保持模块自足） */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** 大数字压缩成「亿 / 万」，用于横幅上的战绩栏 */
function compact(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return fmt(n);
}

/**
 * 关键词高亮
 *
 * 把命中的关键词包成 <em class="mg-hl">，保持原有文本顺序不变；
 * keyword 为空或未命中时原样返回，避免无意义的重排。
 */
function Highlight({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>;
  const parts = text.split(keyword);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={`${i}-${p}`}>
          {i > 0 && <em className="mg-hl">{keyword}</em>}
          {p}
        </Fragment>
      ))}
    </>
  );
}

/** 归一化路由里的 tab 参数 */
function normalizeTab(tab?: string): string {
  if (!tab) return 'speeches';
  if (tab === 'speeches' || tab === 'tweets' || tab === 'press') return tab;
  return 'unknown';
}

/**
 * 从当前路由路径推断子栏目
 *
 * 路由表里 `/speech/tweets` 与 `/speech/press` 是静态路径，
 * App.tsx 只会把参数化路径（`/speech/:tab`）解析出的 params 传下来，
 * 因此这两条路由不会带来 tab 属性，必须回退到路径本身来判断。
 */
function tabFromPath(path: string): string | undefined {
  const m = /^\/speech\/([^/]+)\/?$/.exec(path);
  return m ? m[1] : undefined;
}

/* ================= 推文条目 ================= */

/** 单条推文：方形头像 + 账号行 + 正文 + 系统备注 + 互动计数 */
function TweetCard({ tweet, index }: { tweet: Tweet; index: number }) {
  return (
    <article className="mg-tw">
      <div className={`mg-tw__avatar mg-tw__avatar--${tweet.tone}`}>{tweet.avatar}</div>
      <div className="mg-tw__main">
        <div className="mg-tw__head">
          <span className="mg-tw__name">{tweet.author}</span>
          <span className="mg-tw__verified" title="政务认证账号，认证编号 HGRZ-2026-0001">
            认证
          </span>
          <span className="mg-tw__handle">{tweet.handle}</span>
          <span className="mg-tw__time">{tweet.time}</span>
          {tweet.pinned && <span className="mg-tw__pin">置顶</span>}
        </div>
        <div className="mg-tw__text">{tweet.text}</div>
        {tweet.note && <div className="mg-tw__note">系统备注：{tweet.note}</div>}
        <div className="mg-tw__acts">
          <span className="mg-tw__act">评论 {fmt(tweet.replies)}</span>
          <span className="mg-tw__act">转发 {fmt(tweet.retweets)}</span>
          <span className="mg-tw__act">点赞 {fmt(tweet.likes)}</span>
          <span className="mg-tw__act mg-tw__act--muted">
            合规审核编号 HGB-2026-{String(index + 1).padStart(3, '0')}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ================= 记者会实录条目 ================= */

/** 一场记者会：抬头信息 + 可展开的问答全文 */
function BriefingCard({
  briefing,
  open,
  onToggle,
}: {
  briefing: PressBriefing;
  open: boolean;
  onToggle: () => void;
}) {
  const qa = useMemo(() => parseQa(briefing.body), [briefing]);
  const answers = qa.filter((q) => q.speaker.startsWith('发言人')).length;

  return (
    <div className={`mg-press${open ? ' is-open' : ''}`}>
      <div className="mg-press__head">
        <span className="mg-press__no">{briefing.pressNo}</span>
        {briefing.badge && <Badge tone={briefing.badgeTone ?? 'navy'}>{briefing.badge}</Badge>}
        <span className="mg-press__date">{briefing.date}</span>
        <span className="mg-press__views">阅读 {fmt(briefing.views ?? 0)}</span>
      </div>
      <div className="mg-press__title">{briefing.title}</div>
      <div className="mg-press__meta">
        <span>地点：{briefing.place}</span>
        <span>出席：{briefing.speakers.join('、')}</span>
      </div>
      <div className="mg-press__summary">{briefing.summary}</div>
      <div className="mg-press__bar">
        <Button size="sm" onClick={onToggle}>
          {open ? '收起实录全文' : '展开实录全文'}
        </Button>
        <span className="mg-press__bar-tip">
          本文共 {briefing.body.length} 段，其中答复 {answers} 段；未采纳的提问将统一归档，归档编号
          15 个工作日内通知提问人。
        </span>
      </div>
      {open && (
        <div className="mg-press__qa">
          {qa.map((item, i) => (
            <div
              key={`${briefing.id}-qa-${i}`}
              className={`mg-qa${item.speaker === '' ? ' mg-qa--scene' : ''}${
                item.speaker.startsWith('发言人') ? ' mg-qa--answer' : ''
              }`}
            >
              {item.speaker && <span className="mg-qa__who">{item.speaker}</span>}
              <span className="mg-qa__text">{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= 页面 ================= */

export interface SpeechPageProps {
  /** 路由参数：speeches / tweets / press，缺省为 speeches */
  tab?: string;
}

export default function SpeechPage({ tab }: SpeechPageProps) {
  const { pushToast } = useApp();
  const { path } = useRoute();
  const active = normalizeTab(tab ?? tabFromPath(path));

  /* ---- 重要讲话：主题筛选与检索 ---- */
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');

  /* ---- 每日推文：已加载条数 / 发布框草稿 ---- */
  const [tweetCount, setTweetCount] = useState(TWEET_PAGE_SIZE);
  const [draft, setDraft] = useState('');

  /* ---- 记者会实录：当前展开的场次 ---- */
  const [openBriefing, setOpenBriefing] = useState<string | null>(PRESS_BRIEFINGS[0]?.id ?? null);

  const activeTab = TAB_DEFS.find((t) => t.key === active);
  const speeches = speechesByTopic(topic);
  const feed = latestTweets(Math.min(tweetCount, TWEETS.length));
  const totals = tweetTotals();

  /** 检索结果：标题、摘要、正文三段都参与匹配，标题命中会在结果里高亮 */
  const results = useMemo(() => {
    const kw = submitted.trim();
    if (!kw) return [];
    return SPEECHES.filter(
      (s) =>
        s.title.includes(kw) ||
        (s.summary ?? '').includes(kw) ||
        s.body.some((p) => p.includes(kw))
    );
  }, [submitted]);

  const headline = useMemo(() => SPEECHES.find((s) => s.top) ?? latestSpeeches()[0], []);

  /** 发布终端：无论写什么，结果都一样，这正是这个站点的运行方式 */
  function handlePublish() {
    const len = draft.trim().length;
    if (len === 0) {
      pushToast(
        '发布失败',
        '内容不能为空。空内容推文需要走《空白推文特殊审批流程》，该流程尚未开通。'
      );
      return;
    }
    pushToast(
      '发布失败',
      `当前处于系统维护窗口（每日 00:00-24:00）。您的推文（${len} 字）已保存至本地草稿箱，草稿箱将于维护结束后开放。`
    );
  }

  function handleSearch() {
    setSubmitted(keyword.trim());
  }

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '总统讲话', to: '/speech' },
          { label: activeTab ? activeTab.label : '栏目不存在' },
        ]}
      />

      {/* ---------- 顶部红色横幅 ---------- */}
      <div className="mg-speech-banner">
        <div className="mg-speech-banner__main">
          <div className="mg-speech-banner__kicker">总统讲话</div>
          <div className="mg-speech-banner__title">重要讲话 · 每日推文 · 记者会实录</div>
          <div className="mg-speech-banner__quote">「{BANNER_QUOTE}」</div>
          <div className="mg-speech-banner__from">{BANNER_FROM}</div>
        </div>
        <div className="mg-speech-banner__stats">
          <div className="mg-speech-banner__stat">
            <span className="mg-speech-banner__num">{SPEECHES.length}</span>
            <span className="mg-speech-banner__unit">篇讲话</span>
          </div>
          <div className="mg-speech-banner__stat">
            <span className="mg-speech-banner__num">{TWEETS.length}</span>
            <span className="mg-speech-banner__unit">条推文</span>
          </div>
          <div className="mg-speech-banner__stat">
            <span className="mg-speech-banner__num">{PRESS_BRIEFINGS.length}</span>
            <span className="mg-speech-banner__unit">场记者会</span>
          </div>
          <div className="mg-speech-banner__stat">
            <span className="mg-speech-banner__num">{compact(totals.likes)}</span>
            <span className="mg-speech-banner__unit">累计点赞</span>
          </div>
        </div>
      </div>

      <div className="mg-layout-3col">
        {/* ---------- 左栏：栏目导航 ---------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">总统讲话</div>
            {TAB_DEFS.map((t) => (
              <Link
                key={t.key}
                to={t.path}
                className={`mg-sidenav__item${t.key === active ? ' is-active' : ''}`}
              >
                {t.label}（{t.count}）
              </Link>
            ))}
          </div>

          <div className="mg-sidenav">
            <div className="mg-sidenav__head">按主题浏览</div>
            <a
              href="#/speech"
              className={`mg-sidenav__item${topic === '' ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setTopic('');
              }}
            >
              全部主题（{SPEECHES.length}）
            </a>
            {SPEECH_TOPICS.map((t) => (
              <a
                key={t.key}
                href="#/speech"
                className={`mg-sidenav__item${topic === t.key ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setTopic(t.key);
                }}
              >
                {t.label}（{t.count}）
              </a>
            ))}
          </div>

          <div className="mg-sidenav">
            <div className="mg-sidenav__head">相关栏目</div>
            <Link to="/news/president" className="mg-sidenav__item">
              总统活动动态
            </Link>
            <Link to="/download" className="mg-sidenav__item">
              下载中心（表格）
            </Link>
            <Link to="/interact" className="mg-sidenav__item">
              我有话要说
            </Link>
          </div>
        </div>

        {/* ---------- 中栏：按 tab 渲染 ---------- */}
        <div className="mg-layout__main">
          {active === 'speeches' && (
            <Panel
              title="重要讲话"
              extra={<span className="mg-text-muted">共 {speeches.length} 篇</span>}
            >
              <Alert tone="gray">
                本栏目收录总统重要讲话全文。全文检索仅支持标题与正文；正文较长时建议改检索标题，
                标题未命中说明该讲话的标题与您想找的内容没有关系。
              </Alert>

              {topic === '' && headline && (
                <div className="mg-speech-top">
                  <div className="mg-speech-top__label">头条讲话</div>
                  <Link to={`/speech/detail/${headline.id}`} className="mg-speech-top__title">
                    {headline.title}
                  </Link>
                  <div className="mg-speech-top__meta">
                    {headline.date} · {headline.source}
                    {headline.docNo ? ` · ${headline.docNo}` : ''} · 阅读{' '}
                    {fmt(headline.views ?? 0)}
                  </div>
                  <div className="mg-speech-top__summary">{headline.summary}</div>
                </div>
              )}

              <NewsList
                items={speeches.map((s) => ({
                  id: s.id,
                  title: s.title,
                  date: s.date,
                  badge: s.badge,
                  badgeTone: s.badgeTone,
                  href: `/speech/detail/${s.id}`,
                }))}
                emptyText="该主题下暂无讲话。本主题自设立以来尚未安排讲话，属于计划内的正常现象。"
              />

              <div className="mg-speech-foot">
                共 {speeches.length} 篇，按发布日期倒序排列。更早的讲话已归档，归档目录请到下载中心
                第 3 页获取。
              </div>
            </Panel>
          )}

          {active === 'tweets' && (
            <Panel
              title={`每日推文（${TWEETS.length} 条）`}
              extra={<span className="mg-text-muted">按发布时间倒序</span>}
            >
              {/* 发布终端：一个永远发不出去的输入框 */}
              <div className="mg-tw-composer">
                <div className="mg-tw__avatar mg-tw__avatar--red">统</div>
                <div className="mg-tw-composer__main">
                  <textarea
                    className="mg-tw-composer__input"
                    rows={3}
                    maxLength={280}
                    value={draft}
                    placeholder="输入内容。超过 280 字符的部分将被自动截断，截断部分不予保留，也不予退还。"
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="mg-tw-composer__bar">
                    <span className="mg-tw-composer__count">{draft.length} / 280</span>
                    <span className="mg-tw-composer__tip">发布终端编号 SP-01，当前状态：优化中</span>
                    <Button variant="primary" size="sm" onClick={handlePublish}>
                      发布
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mg-tw-feed">
                {feed.map((t, i) => (
                  <TweetCard key={t.id} tweet={t} index={i} />
                ))}
              </div>

              <div className="mg-tw-more">
                {feed.length < TWEETS.length ? (
                  <Button onClick={() => setTweetCount((v) => v + TWEET_PAGE_SIZE)}>
                    加载更多（每次 +{TWEET_PAGE_SIZE} 条）
                  </Button>
                ) : (
                  <Button disabled>已加载全部 {TWEETS.length} 条</Button>
                )}
                <span className="mg-tw-more__tip">
                  已显示 {feed.length} / {TWEETS.length} 条
                  {feed.length < TWEETS.length
                    ? '。列表每 1.8 秒新增一条，新增内容将在维护窗口结束后同步。'
                    : '。第 45 条推文正在内容审核中，审核周期为 14 个月，暂不显示。'}
                </span>
              </div>
            </Panel>
          )}

          {active === 'press' && (
            <Panel
              title="记者会实录"
              extra={<span className="mg-text-muted">共 {PRESS_BRIEFINGS.length} 场</span>}
            >
              <Alert tone="yellow">
                本站记者会实录均为整理稿。实录中的"（演示环节：…）"等场景说明由记录员补记，
                不属于发言内容，引用时请注意区分。
              </Alert>
              {PRESS_BRIEFINGS.map((b) => (
                <BriefingCard
                  key={b.id}
                  briefing={b}
                  open={openBriefing === b.id}
                  onToggle={() => setOpenBriefing(openBriefing === b.id ? null : b.id)}
                />
              ))}
            </Panel>
          )}

          {active === 'unknown' && (
            <Panel title="栏目不存在">
              <div className="mg-empty">
                本栏目尚未设立。我们已收到您的访问请求，并将该请求计入需求统计；
                需求统计达到 1,000 次后启动立项，目前为第 1 次。
              </div>
              <div className="mg-speech-foot">
                返回 <Link to="/speech">重要讲话</Link> 栏目。
              </div>
            </Panel>
          )}
        </div>

        {/* ---------- 右栏：按 tab 切换的辅助面板 ---------- */}
        <div className="mg-layout__right">
          {active === 'speeches' && (
            <>
              <Panel title="讲话要点" variant="red">
                <ol className="mg-points">
                  {featuredPoints(6).map((p) => (
                    <li key={p.speechId} className="mg-points__item">
                      <Link to={`/speech/detail/${p.speechId}`} className="mg-points__text">
                        {p.text}
                      </Link>
                      <div className="mg-points__from">{p.from}</div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="讲话全文检索">
                <div className="mg-searchbar">
                  <input
                    className="mg-searchbar__input"
                    type="text"
                    value={keyword}
                    placeholder="输入关键词，如「表格」「维护」"
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                  <Button variant="primary" size="sm" onClick={handleSearch}>
                    检索
                  </Button>
                </div>
                <div className="mg-searchbar__hint">
                  检索范围包括讲话标题、摘要与正文。本站不提供模糊检索——模糊会导致结果过多，
                  结果过多会降低检索的严肃性。
                </div>

                {submitted === '' ? (
                  <div className="mg-searchbar__empty">
                    请输入关键词后点击「检索」。本功能每年可检索 12 次，次数已用完的请在次年 1 月
                    15 日后重试。
                  </div>
                ) : results.length === 0 ? (
                  <div className="mg-searchbar__empty">
                    未检索到「{submitted}」的相关讲话。本系统仅检索已发布内容；未检索到的内容，
                    可能是未发布，也可能是不存在，两种情况我们不作区分。
                  </div>
                ) : (
                  <>
                    <div className="mg-searchbar__count">
                      共命中 {results.length} 篇（按相关度排列，相关度由系统根据标题长度确定）
                    </div>
                    <ul className="mg-searchbar__list">
                      {results.map((s: Speech) => (
                        <li key={s.id} className="mg-searchbar__item">
                          <Link to={`/speech/detail/${s.id}`} className="mg-searchbar__title">
                            <Highlight text={s.title} keyword={submitted} />
                          </Link>
                          <span className="mg-searchbar__date">{s.date}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>

              <Panel title="讲话汇编">
                <StatRow label="收录讲话" value={SPEECHES.length} unit="篇" />
                <StatRow label="主题分类" value={SPEECH_TOPICS.length} unit="类" />
                <StatRow label="讲话要点" value={SPEECHES.length * 4} unit="条" />
                <StatRow label="全文平均段数" value={8.4} unit="段" />
                <div className="mg-speech-foot">
                  汇编第 12 辑已印发，印发数量 41 册，其中 40 册已归档，1 册在传阅中。
                </div>
              </Panel>
            </>
          )}

          {active === 'tweets' && (
            <>
              <Panel title="推文数据看板" variant="navy">
                <StatRow label="累计点赞" value={compact(totals.likes)} />
                <StatRow label="累计转发" value={compact(totals.retweets)} />
                <StatRow label="累计评论" value={fmt(totals.replies)} unit="条" />
                <StatRow label="推文总数" value={totals.count} unit="条" />
                <div className="mg-speech-foot">
                  评论数偏低属于正常现象：本账号已关闭评论功能，关闭原因是"提升阅读体验"。
                </div>
              </Panel>

              <Panel title="热门推文 TOP 5">
                <ol className="mg-rank">
                  {topTweets(5).map((t, i) => (
                    <li key={t.id} className="mg-rank__item">
                      <span className={`mg-rank__no${i < 3 ? ' is-hot' : ''}`}>{i + 1}</span>
                      <span className="mg-rank__text" title={t.text}>
                        {t.text}
                      </span>
                      <span className="mg-rank__num">{compact(t.likes)}</span>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="发布须知">
                <Alert tone="gray">
                  本终端发布内容需经三级审核：初审由值班人员完成，复审由复核人员完成，
                  终审由审核人员完成。三级审核平均耗时 11 个工作日；审核通过后，
                  内容将在维护窗口结束后发布。
                </Alert>
              </Panel>
            </>
          )}

          {active === 'press' && (
            <>
              <Panel title="记者会问答统计" variant="navy">
                <StatRow label="累计收到提问" value={1204} unit="个" />
                <StatRow label="符合提问条件" value={11} unit="个" />
                <StatRow label="实际回答" value={11} unit="个" />
                <StatRow label="其中已转相关部门" value={9} unit="个" />
                <div className="mg-speech-foot">
                  另有 1,193 个提问因"提问条件不符"未予采纳，已全部归档，归档率 100%。
                </div>
              </Panel>

              <Panel title="现场记者须知">
                <ol className="mg-points">
                  <li className="mg-points__item">
                    <div className="mg-points__text">
                      请提前 30 分钟到场；提前 30 分钟以内到的，按迟到处理。
                    </div>
                  </li>
                  <li className="mg-points__item">
                    <div className="mg-points__text">
                      提问需提前提交《提问申请表》，现场临时提问视为未提交申请。
                    </div>
                  </li>
                  <li className="mg-points__item">
                    <div className="mg-points__text">
                      实录全文以现场记录员整理稿为准；录音仅供参考，调取录音需另行申请。
                    </div>
                  </li>
                </ol>
              </Panel>

              <Panel title="历史场次">
                <StatRow label="已举办" value={PRESS_BRIEFINGS.length} unit="场" />
                <StatRow label="平均时长" value={42} unit="分钟" />
                <StatRow label="提问环节" value={4.6} unit="分钟" />
                <div className="mg-speech-foot">
                  第 40 场及以前的实录已归档，归档目录请到下载中心第 3 页获取。
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
