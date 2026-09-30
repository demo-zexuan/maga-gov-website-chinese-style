/**
 * 讲话全文详情页
 *
 * I. 页面职责
 *
 * 1. 路由 /speech/detail/:id，接收 { id } props。
 * 2. 正文用 .mg-article 排版，保持全站详情页统一的宋体正文与 2em 首行缩进。
 * 3. 文末固定三个区块：
 *    (1) 讲话要点摘录（3-5 条 bullet）
 *    (2) 相关讲话（同主题优先）
 *    (3) 上一篇 / 下一篇（.mg-article__nav）
 * 4. 提供「打印本页」按钮，真实调用 window.print()；同时提供侧栏的附件下载入口，
 *    下载结果由 Toast 反馈（附件永远处于生成中，生成进度会稳步后退）。
 *
 * II. 兼容记者会实录
 *
 * 若传入的 id 命中记者会实录（prs- 开头），正文改为按问答体渲染，
 * 角色行单独排版，场景说明另作样式。
 *
 * @module pages/speech/SpeechDetailPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo } from 'react';
import { Alert, Badge, Button, Crumbs, NewsList, Panel, StatRow } from '@/components/ui';
import { Link } from '@/router';
import { useApp } from '@/app-context';
import {
  PRESS_BRIEFINGS,
  SPEECHES,
  findBriefing,
  findSpeech,
  latestSpeeches,
  parseQa,
  relatedSpeeches,
} from '@/data/speeches';
import type { PressBriefing, Speech } from '@/data/speeches';

/* ================= 小工具 ================= */

/** 千分位格式化 */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

/** 在按日期倒序的讲话列表里定位前后篇 */
function neighbours(id: string): { prev?: Speech; next?: Speech } {
  const list = latestSpeeches();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return {};
  return { prev: list[idx - 1], next: list[idx + 1] };
}

/* ================= 未找到 ================= */

/** 讲话不存在时的空态：文案要冷，但不能让人以为系统坏了——系统确实没坏 */
function NotFound({ id }: { id?: string }) {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '总统讲话', to: '/speech' }, { label: '讲话全文' }]} />
      <Panel title="未找到该讲话">
        <div className="mg-empty">
          编号 {id ?? '（空）'} 不在本站已收录的讲话之列。
          <br />
          本站共收录讲话 {SPEECHES.length} 篇，编号连续，理论上不会缺失。
          因此更可能的情况是：您访问的这一篇尚未发生。
        </div>
        <div className="mg-speech-foot">
          返回 <Link to="/speech">重要讲话列表</Link>，或前往{' '}
          <Link to="/download">下载中心</Link> 第 3 页索取归档目录。
        </div>
      </Panel>
    </div>
  );
}

/* ================= 记者会实录正文 ================= */

/** 记者会实录的问答体正文 */
function BriefingArticle({ briefing }: { briefing: PressBriefing }) {
  const qa = useMemo(() => parseQa(briefing.body), [briefing]);
  return (
    <>
      <div className="mg-article__body mg-article__body--qa">
        {qa.map((item, i) => (
          <div
            key={`${briefing.id}-d-${i}`}
            className={`mg-qa mg-qa--article${item.speaker === '' ? ' mg-qa--scene' : ''}${
              item.speaker.startsWith('发言人') ? ' mg-qa--answer' : ''
            }`}
          >
            {item.speaker && <span className="mg-qa__who">{item.speaker}</span>}
            <span className="mg-qa__text">{item.text}</span>
          </div>
        ))}
      </div>
      <div className="mg-article__foot">
        本文为现场记录员整理稿，共 {briefing.body.length} 段。整理稿未经发言人事后确认，
        如需确认版请提交《讲话确认申请》，确认周期为 15 个工作日。
      </div>
    </>
  );
}

/* ================= 页面 ================= */

export interface SpeechDetailPageProps {
  /** 路由参数：讲话 id（spc-xxx）或记者会 id（prs-xxx） */
  id?: string;
}

export default function SpeechDetailPage({ id }: SpeechDetailPageProps) {
  const { pushToast } = useApp();
  const speech = id ? findSpeech(id) : undefined;
  const briefing = !speech && id ? findBriefing(id) : undefined;

  const list = useMemo(() => latestSpeeches(), []);
  const prev: Speech | undefined = useMemo(() => neighbours(id ?? '').prev, [id]);
  const next: Speech | undefined = useMemo(() => neighbours(id ?? '').next, [id]);
  const related = useMemo(() => (speech ? relatedSpeeches(speech, 5) : []), [speech]);

  if (!speech && !briefing) return <NotFound id={id} />;

  /** 附件下载：结果恒定，反馈文案每次略有不同 */
  function handleAttach(name: string) {
    pushToast(
      '附件暂不可下载',
      `《${name}》正在生成中，当前生成进度 12%。生成完成后将自动挂网，挂网时间以实际挂网时间为准。`
    );
  }

  const views = speech?.views ?? briefing?.views ?? 0;

  return (
    <div className="mg-page">
      <div className="mg-speech-noprint">
        <Crumbs
          items={[
            { label: '总统讲话', to: '/speech' },
            { label: speech ? '重要讲话' : '记者会实录', to: speech ? '/speech' : '/speech/press' },
            { label: speech ? '讲话全文' : '实录全文' },
          ]}
        />
      </div>

      <div className="mg-layout-3col">
        {/* ---------- 主栏：正文 ---------- */}
        <div className="mg-layout__main">
          <Panel flush>
            <div className="mg-article">
              <h1 className="mg-article__title">{speech ? speech.title : briefing!.title}</h1>
              <div className="mg-article__subtitle">
                {speech ? speech.summary : briefing!.summary}
              </div>
              <div className="mg-article__meta">
                <span>来源：{speech ? speech.source : briefing!.source}</span>
                <span>日期：{speech ? speech.date : briefing!.date}</span>
                <span>文号：{speech ? speech.docNo : briefing!.docNo}</span>
                <span>阅读：{fmt(views)}</span>
                <span className="mg-article__meta-right mg-speech-noprint">
                  <Button variant="primary" size="sm" onClick={() => window.print()}>
                    打印本页
                  </Button>
                </span>
              </div>

              {speech ? (
                <>
                  <div className="mg-article__body">
                    {speech.body.map((p, i) => (
                      <p key={`${speech.id}-p-${i}`}>{p}</p>
                    ))}
                  </div>
                  <div className="mg-article__foot">
                    记录整理：{speech.recorder ?? speech.source}。本记录稿经三轮校对，
                    第一轮校对的记录另行归档；引用请以纸质印发稿为准，纸质印发稿以本页为准。
                  </div>
                </>
              ) : (
                <BriefingArticle briefing={briefing!} />
              )}
            </div>
          </Panel>

          {/* ---------- 讲话要点摘录 ---------- */}
          {speech && (
            <Panel title="讲话要点摘录" variant="red">
              <ol className="mg-points mg-points--article">
                {speech.points.map((p, i) => (
                  <li key={`${speech.id}-pt-${i}`} className="mg-points__item">
                    <span className="mg-points__no">{i + 1}</span>
                    <span className="mg-points__text">{p}</span>
                  </li>
                ))}
              </ol>
              <div className="mg-article__foot">
                要点摘录由本站根据讲话全文整理，整理口径为"每段取最像结论的一句话"。
                摘录共 {speech.points.length} 条，与讲话段数不一致属于正常现象。
              </div>
            </Panel>
          )}

          {/* ---------- 上一篇 / 下一篇 ---------- */}
          {speech && (
            <Panel flush>
              <div className="mg-article__nav">
                <span>
                  上一篇：
                  {prev ? (
                    <Link to={`/speech/detail/${prev.id}`}>{prev.title}</Link>
                  ) : (
                    <span className="mg-text-muted">已是第一篇，更早的讲话已归档</span>
                  )}
                </span>
                <span>
                  下一篇：
                  {next ? (
                    <Link to={`/speech/detail/${next.id}`}>{next.title}</Link>
                  ) : (
                    <span className="mg-text-muted">已是最新一篇，更新的讲话尚未发生</span>
                  )}
                </span>
              </div>
            </Panel>
          )}

          {/* ---------- 相关讲话 ---------- */}
          {speech && (
            <Panel
              title="相关讲话"
              extra={<span className="mg-text-muted">同主题优先</span>}
            >
              <NewsList
                items={related.map((s) => ({
                  id: s.id,
                  title: s.title,
                  date: s.date,
                  badge: s.topic,
                  badgeTone: 'navy' as const,
                  href: `/speech/detail/${s.id}`,
                }))}
                emptyText="暂无相关讲话。本主题下目前只有您正在阅读的这一篇。"
              />
            </Panel>
          )}

          {/* ---------- 记者会：其他场次 ---------- */}
          {briefing && (
            <Panel title="其他场次" extra={<Link to="/speech/press">返回实录列表</Link>}>
              <NewsList
                items={PRESS_BRIEFINGS.filter((b) => b.id !== briefing.id).map((b) => ({
                  id: b.id,
                  title: b.title,
                  date: b.date,
                  badge: b.pressNo,
                  badgeTone: 'outline' as const,
                  href: `/speech/detail/${b.id}`,
                }))}
              />
            </Panel>
          )}
        </div>

        {/* ---------- 侧栏 ---------- */}
        <div className="mg-layout__right mg-speech-noprint">
          <Panel title="本篇信息" variant="navy">
            {speech ? (
              <>
                <StatRow label="主题" value={speech.topic} />
                <StatRow label="场合" value={speech.occasion} />
                <StatRow label="段数" value={speech.body.length} unit="段" />
                <StatRow label="要点" value={speech.points.length} unit="条" />
                <div className="mg-info-list">
                  <div className="mg-info-list__row">
                    <span className="mg-info-list__label">地点</span>
                    <span className="mg-info-list__value">{speech.place}</span>
                  </div>
                  <div className="mg-info-list__row">
                    <span className="mg-info-list__label">记录整理</span>
                    <span className="mg-info-list__value">{speech.recorder ?? speech.source}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <StatRow label="场次" value={briefing!.pressNo} />
                <StatRow label="段数" value={briefing!.body.length} unit="段" />
                <div className="mg-info-list">
                  <div className="mg-info-list__row">
                    <span className="mg-info-list__label">地点</span>
                    <span className="mg-info-list__value">{briefing!.place}</span>
                  </div>
                  <div className="mg-info-list__row">
                    <span className="mg-info-list__label">出席</span>
                    <span className="mg-info-list__value">
                      {briefing!.speakers.join('、')}
                    </span>
                  </div>
                </div>
                <div className="mg-speech-foot">
                  本场实录共 {briefing!.body.length} 段，未采纳的提问已归档。
                </div>
              </>
            )}
          </Panel>

          <Panel title="相关附件">
            <ul className="mg-attach">
              <li className="mg-attach__item">
                <span className="mg-attach__name">
                  {speech ? '讲话全文（印发版）.PDF' : '实录全文（整理稿）.DOC'}
                </span>
                <span className="mg-attach__meta">1.2 MB</span>
                <Button size="sm" onClick={() => handleAttach('讲话全文（印发版）')}>
                  下载
                </Button>
              </li>
              <li className="mg-attach__item">
                <span className="mg-attach__name">要点摘录（单页）.PDF</span>
                <span className="mg-attach__meta">240 KB</span>
                <Button size="sm" onClick={() => handleAttach('要点摘录（单页）')}>
                  下载
                </Button>
              </li>
              <li className="mg-attach__item">
                <span className="mg-attach__name">现场录音（仅供核对）.ZIP</span>
                <span className="mg-attach__meta">—</span>
                <Button size="sm" onClick={() => handleAttach('现场录音（仅供核对）')}>
                  下载
                </Button>
              </li>
            </ul>
            <div className="mg-speech-foot">
              附件下载需登录。登录后如需下载，请再次登录。
            </div>
          </Panel>

          <Panel title="引用须知">
            <Alert tone="yellow">
              转载、摘编本页内容请注明"转自本站"；如需注明来源单位，请另行提交《来源标注申请》。
              申请受理后，我们将在 20 个工作日内答复是否同意标注。
            </Alert>
            <div className="mg-speech-foot">
              本页内容为虚构创作，属于讽刺作品，不对应任何真实事件与真实人物。
            </div>
          </Panel>

          <Panel title="栏目导航">
            <div className="mg-attach">
              <div className="mg-attach__item">
                <Link to="/speech" className="mg-attach__name">
                  重要讲话（{SPEECHES.length} 篇）
                </Link>
                <Badge tone="red">{SPEECHES.length}</Badge>
              </div>
              <div className="mg-attach__item">
                <Link to="/speech/press" className="mg-attach__name">
                  记者会实录（{PRESS_BRIEFINGS.length} 场）
                </Link>
                <Badge tone="navy">{PRESS_BRIEFINGS.length}</Badge>
              </div>
              <div className="mg-attach__item">
                <Link to="/speech/tweets" className="mg-attach__name">
                  每日推文
                </Link>
                <Badge tone="gold">热</Badge>
              </div>
            </div>
          </Panel>

          <Panel title="本页操作">
            <div className="mg-inline">
              <Button variant="primary" size="sm" onClick={() => window.print()}>
                打印本页
              </Button>
              <Button size="sm" onClick={() => pushToast('已复制链接', '链接已复制。有效期至您清空剪贴板为止。')}>
                复制链接
              </Button>
              <Link to="/speech" className="mg-btn mg-btn--sm">
                返回列表
              </Link>
            </div>
            <div className="mg-speech-foot">
              {speech
                ? `共 ${list.length} 篇讲话按日期倒序排列，本篇为第 ${
                    list.findIndex((s) => s.id === speech.id) + 1
                  } 篇。`
                : `本页为记者会实录，讲话列表共 ${SPEECHES.length} 篇，实录与讲话分属两个序列，不参与混排。`}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
