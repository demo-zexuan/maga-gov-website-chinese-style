/**
 * 要闻动态 · 稿件详情页
 *
 * I. 页面职责
 *
 * 1. 渲染 /news/:id 命中的稿件：居中大标题、导语、meta 行、正文、文末信息。
 * 2. 提供 A- / A / A+ 三档字号调节，作用于正文段落（真实生效）。
 * 3. 提供打印本页、关闭窗口、上一篇 / 下一篇，以及右侧的相关阅读与热点排行。
 * 4. id 不存在或未提供时，渲染一个按档案管理口径组织的 404 区块。
 *
 * II. 黑色幽默配额的落点
 *
 * 1. 无效 id 的 404：该文件已按档案管理规定销毁，销毁记录本身也已销毁。
 * 2. 关闭窗口按钮：站点无权关闭浏览器窗口，于是改为跳转并如实告知。
 * 3. 文末说明：阅读量每 1.8 秒自动增加 1 次，与读者的阅读行为无关。
 *
 * @module pages/news/NewsDetailPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Crumbs, NewsList, Panel, Button } from '@/components/ui';
import { Link, navigate, scrollToTop } from '@/router';
import { useApp } from '@/app-context';
import {
  NEWS_CATEGORIES,
  adjacentNews,
  categoryLabel,
  findNews,
  newsByCategory,
  relatedNews,
  topNews,
} from '@/data/news';
import { formatNumber } from '@/data/stats';
import { Highlight } from './Highlight';

export interface NewsDetailPageProps {
  /** 稿件编号，由路由 `/news/:id` 透传 */
  id?: string;
}

/** 正文可选字号（A- / A / A+ 三档） */
const FONT_SIZES = [14, 16, 19];

export default function NewsDetailPage({ id }: NewsDetailPageProps) {
  const article = id ? findNews(id) : undefined;
  const [sizeIndex, setSizeIndex] = useState(1);
  const { pushToast } = useApp();

  // 切换稿件时回到页首，并恢复默认字号
  useEffect(() => {
    scrollToTop();
    setSizeIndex(1);
  }, [id]);

  /* ---------------- I. 未命中的 404 区块 ---------------- */
  if (!article) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '要闻动态', to: '/news' }, { label: '稿件查询结果' }]} />
        <div className="mg-layout-2col">
          <div className="mg-layout__side">
            <div className="mg-sidenav">
              <div className="mg-sidenav__head">要闻动态</div>
              {NEWS_CATEGORIES.map((c) => (
                <Link key={c.key} to={c.key === 'top' ? '/news' : `/news/${c.key}`} className="mg-sidenav__item">
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mg-layout__main">
            <Panel title="稿件查询失败" variant="red">
              <div className="mg-news-404">
                <div className="mg-news-404__code">404</div>
                <div className="mg-news-404__title">
                  您访问的稿件{id ? `（编号 ${id}）` : ''}不在本站归档范围内
                </div>
                <div className="mg-news-404__line">该文件已按档案管理规定销毁。销毁记录本身也已销毁。</div>
                <div className="mg-news-404__line">
                  如需查阅原件，请填写《档案查阅申请单》。该单第 3 页需另行索取，索取窗口工作日 10:00-11:30 开放。
                </div>
                <div className="mg-news-404__line">
                  您也可以返回栏目列表，从最近发布的一篇开始看起；那篇同样有效，且尚未被销毁。
                </div>
                <div className="mg-news-404__actions">
                  <Link to="/news" className="mg-btn mg-btn--primary">
                    返回要闻动态
                  </Link>
                  <Link to={`/search?q=${encodeURIComponent(id ?? '稿件')}`} className="mg-btn">
                    全站检索该关键词
                  </Link>
                </div>
              </div>
            </Panel>
            <Panel title="仍在库中的稿件" extra={<Link to="/news" className="mg-more">更多»</Link>}>
              <NewsList
                items={topNews(6).map((a) => ({
                  id: a.id,
                  title: a.title,
                  date: a.date,
                  href: `/news/${a.id}`,
                }))}
              />
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- II. 正常稿件 ---------------- */
  const { prev, next } = adjacentNews(article.id);
  const related = relatedNews(article.id, 6);
  const hot = topNews(8);
  const siblings = newsByCategory(article.category).slice(0, 8);

  const onPrint = () => {
    pushToast('打印任务已提交', '本页已送往打印队列。队列中排队 14 份表格，预计打印时间以打印机为准。');
    window.print();
  };

  const onCloseWindow = () => {
    // 浏览器不允许脚本关闭非脚本打开的窗口，这里如实说明并给出退路
    window.close();
    pushToast('关闭窗口', '本窗口由浏览器管理，站点无权关闭，已为您返回要闻动态栏目。');
    navigate('/news');
  };

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '要闻动态', to: '/news' },
          { label: categoryLabel(article.category), to: article.category === 'top' ? '/news' : `/news/${article.category}` },
          { label: '稿件正文' },
        ]}
      />

      <div className="mg-layout-3col">
        {/* ---------------- 左栏 ---------------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">要闻动态</div>
            {NEWS_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to={c.key === 'top' ? '/news' : `/news/${c.key}`}
                className={`mg-sidenav__item${c.key === article.category ? ' is-active' : ''}`}
              >
                {c.label}（{newsByCategory(c.key).length}）
              </Link>
            ))}
          </div>

          <Panel title="本栏目近期稿件">
            <NewsList
              items={siblings.map((a) => ({
                id: a.id,
                title: a.title,
                date: a.date,
                href: `/news/${a.id}`,
              }))}
              showBullet
            />
          </Panel>
        </div>

        {/* ---------------- 中栏：正文 ---------------- */}
        <div className="mg-layout__main">
          <div className="mg-panel">
            <article className="mg-article">
              <h1 className="mg-article__title">{article.title}</h1>
              {article.summary && <div className="mg-article__subtitle">{article.summary}</div>}

              <div className="mg-article__meta">
                <span>来源：{article.source}</span>
                <span>发布时间：{article.date}</span>
                <span>阅读量：{formatNumber(article.views ?? 0)}</span>
                {article.docNo && <span className="mg-chip">{article.docNo}</span>}
                <span className="mg-article__meta-right">
                  <span>字号</span>
                  <Button
                    size="sm"
                    onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
                    disabled={sizeIndex === 0}
                    aria-label="减小字号"
                  >
                    A-
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSizeIndex(1)}
                    aria-label="恢复默认字号"
                    title={`当前 ${FONT_SIZES[sizeIndex]}px`}
                  >
                    A
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                    disabled={sizeIndex === FONT_SIZES.length - 1}
                    aria-label="增大字号"
                  >
                    A+
                  </Button>
                  <span className="mg-news-fontnow">{FONT_SIZES[sizeIndex]}px</span>
                </span>
              </div>

              <div className="mg-article__body" style={{ fontSize: `${FONT_SIZES[sizeIndex]}px` }}>
                {article.body.map((p, i) => (
                  <p key={`${article.id}-p${i}`}>{p}</p>
                ))}
              </div>

              <div className="mg-article__foot">
                <div>责任编辑：联邦便民服务管理局新闻处 值班编辑（工号 A-0912）</div>
                <div>校对：编务系统（自动）　审核：编务系统（自动）</div>
                <div>
                  本文阅读量每 1.8 秒自动增加 1 次，与读者的阅读行为无关；统计口径每日 23:00 重置，重置前后的数据不可比。
                </div>
                <div className="mg-news-article__tools">
                  <Button size="sm" variant="primary" onClick={onPrint}>
                    打印本页
                  </Button>
                  <Button size="sm" onClick={onCloseWindow}>
                    关闭窗口
                  </Button>
                  <Link to="/interact" className="mg-btn mg-btn--sm">
                    对本文满意度进行评价
                  </Link>
                </div>
              </div>
            </article>

            <div className="mg-article__nav">
              {prev ? (
                <Link to={`/news/${prev.id}`}>
                  上一篇：<Highlight text={prev.title} keyword="" clip={40} />
                </Link>
              ) : (
                <span className="mg-text-muted">上一篇：已经是本栏第一篇</span>
              )}
              {next ? (
                <Link to={`/news/${next.id}`}>
                  下一篇：<Highlight text={next.title} keyword="" clip={40} />
                </Link>
              ) : (
                <span className="mg-text-muted">下一篇：本栏稿件已全部阅毕</span>
              )}
            </div>
          </div>

          <div className="mg-news-tip">
            提示：本页内容自发布之日起归档。归档稿件如需更正，请以纸质《更正说明》为准，
            更正说明不另行上网发布。
          </div>
        </div>

        {/* ---------------- 右栏 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="相关阅读" variant="navy">
            {related.length === 0 ? (
              <div className="mg-empty">暂无相关稿件。本栏目稿件之间的相关性由系统按标题计算。</div>
            ) : (
              <NewsList
                items={related.map((a) => ({
                  id: a.id,
                  title: a.title,
                  date: a.date,
                  href: `/news/${a.id}`,
                }))}
              />
            )}
          </Panel>

          <Panel title="热点排行">
            <NewsList
              items={hot.map((a, i) => ({
                id: a.id,
                title: `${i + 1}. ${a.title}`,
                date: a.date,
                href: `/news/${a.id}`,
              }))}
              showBullet={false}
            />
          </Panel>

          <Panel title="阅读提示">
            <Alert tone="yellow">
              本页字号共 3 档。若调整后仍看不清，可使用浏览器缩放；浏览器缩放不计入本站无障碍改造范围。
            </Alert>
            <div className="mg-news-note">
              页面加载缓慢属于正常现象，请勿重复刷新。重复刷新不会加快加载速度，但会加快阅读量增长。
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
