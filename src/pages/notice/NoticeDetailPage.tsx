/**
 * 公告详情页
 *
 * I. 背景
 *
 * `src/data/notices.ts` 里的 `MARQUEE_NOTICES` 与首页「公告公示」都指向
 * `/notice/:id`，但 App.tsx 早期没有注册这条路由，导致点进去是 404。
 * 本页补上这条链路，让公告成为可深链接、可分享的独立页面。
 *
 * II. 内容策略
 *
 * 公告是全站黑色幽默密度最高的文体，因此详情页刻意不做任何"现代"处理：
 * 居中红头标题、正文首行缩进两字、文末落款与日期右对齐、底部附打印与
 * 关闭按钮 —— 全部照搬纸质红头文件的排版习惯。
 *
 * @module pages/notice/NoticeDetailPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Crumbs, Panel, Button, Alert, Badge } from '@/components/ui';
import { Link, navigate } from '@/router';
import { NOTICES, findNotice } from '@/data/notices';
import { SITE } from '@/data/site';

export interface NoticeDetailPageProps {
  id: string;
}

export default function NoticeDetailPage({ id }: NoticeDetailPageProps) {
  const notice = findNotice(id);

  // 找不到公告时不做通用 404，而是给一个符合"档案管理"语境的冷幽默说明
  if (!notice) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '公告公示', to: '/gov' }, { label: '公告详情' }]} />
        <Panel title="公告详情">
          <div className="mg-empty">
            <div className="mg-empty__icon">📁</div>
            <div style={{ marginBottom: 6 }}>未检索到编号为 {id} 的公告。</div>
            <div style={{ color: 'var(--c-text-faint)', marginBottom: 12 }}>
              该公告可能已按档案管理规定归档。归档记录本身也已归档。
            </div>
            <Button variant="primary" onClick={() => navigate('/gov')}>
              返回政务公开
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const others = NOTICES.filter((n) => n.id !== notice.id).slice(0, 6);

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '政务公开', to: '/gov' }, { label: '公告公示' }, { label: '公告详情' }]} />

      <div className="mg-layout-2col">
        <div className="mg-layout__main">
          <Panel flush>
            <div className="mg-article">
              <h1 className="mg-article__title">{notice.title}</h1>
              {notice.tag && (
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <Badge tone="outline">{notice.tag}</Badge>
                </div>
              )}
              <div className="mg-article__meta">
                <span>发布机构：{SITE.organizer}</span>
                <span>发布日期：{notice.date}</span>
                <span>文号：公告〔2026〕{notice.id.replace(/\D/g, '')} 号</span>
                <span className="mg-article__meta-right">
                  <span>【字体：大 中 小】</span>
                </span>
              </div>

              <div className="mg-article__body">
                {notice.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}

                <div className="mg-article__foot" style={{ textAlign: 'right' }}>
                  <div>{SITE.organizer}</div>
                  <div>{notice.date.replace(/-/g, ' 年 ').replace(/ 年 (\d+)$/, ' 年 $1 月')} 日</div>
                </div>
              </div>
            </div>
          </Panel>

          <div className="mg-article__nav">
            <Link to="/gov">← 返回公告公示列表</Link>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                window.print();
              }}
            >
              打印本页
            </a>
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                window.close();
              }}
            >
              关闭窗口
            </a>
          </div>

          <Alert tone="gray">
            本公告自发布之日起施行。施行日期以实际施行日期为准；如实际施行日期与本公告发布之日不一致，
            以本公告发布之日为准。
          </Alert>
        </div>

        <div className="mg-layout__side">
          <Panel title="其它公告" extra={<Link to="/gov" className="mg-more">更多</Link>}>
            <ul className="mg-list">
              {others.map((n) => (
                <li className="mg-list__item" key={n.id}>
                  <span className="mg-list__bullet">•</span>
                  <Link to={`/notice/${n.id}`} className="mg-list__text" title={n.title}>
                    {n.title}
                  </Link>
                  <span className="mg-list__date">{n.date}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="公告订阅" variant="navy">
            <div style={{ fontSize: 'var(--fs-13)', lineHeight: 1.9, color: 'var(--c-text-sub)' }}>
              订阅后，新公告将以邮件形式送达。
              <br />
              投递时间为每周一至周五 09:00-17:00。
              <br />
              若未收到，请检查垃圾邮件文件夹。
              <br />
              若仍未收到，说明本周没有新公告。
            </div>
            <div style={{ marginTop: 8 }}>
              <Button
                onClick={() =>
                  alert('订阅申请已提交。我们将在 5-10 个工作日内完成审核，审核结果将以邮件形式通知。')
                }
              >
                订阅公告
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
