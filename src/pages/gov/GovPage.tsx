/**
 * 政务公开栏目页
 *
 * I. 页面结构
 *
 * 1. 面包屑 + 信息公开指南提示条
 * 2. 左栏：栏目树（政策文件 / 规划计划 / 财政信息 / 人事信息 / 信息公开年报）+ 公开统计
 * 3. 主区：页签 + 年度提示 + 列表 + 分页；「人事信息」页签另附领导任免公告表格
 * 4. 详情：点击条目弹出全文弹窗，展示文号、来源、日期、阅读量与正文段落
 *
 * II. 说明
 *
 * 1. 栏目与数据一一对应，全部人物、文号、数字均为虚构创作。
 * 2. 路由 key 未知时展示「栏目未开设」空态，并保留栏目树以便切换。
 *
 * @module pages/gov/GovPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Crumbs, Modal, NewsList, Pager, Panel, TabBar } from '@/components/ui';
import { Link, navigate } from '@/router';
import { LEADERS } from '@/data/leaders';
import { GOV_CATEGORIES, GOV_TOTAL, findGovArticle, govArticlesOf } from '@/data/gov';
import type { Article } from '@/data/types';

/* ---------------- 常量 ---------------- */

/** 每页条数：古早网站列表页的经典取值 */
const PAGE_SIZE = 12;

/**
 * 路由别名 → 数据分类键
 *
 * 兼容站内历史链接与手输地址的常见拼写差异，避免用户看到空栏目。
 */
const TAB_ALIAS: Record<string, string> = {
  policy: 'policy',
  docs: 'policy',
  document: 'policy',
  plan: 'plan',
  plans: 'plan',
  finance: 'finance',
  budget: 'finance',
  personnel: 'personnel',
  hr: 'personnel',
  report: 'report',
  annual: 'report',
};

/** 分类键 → 路由路径 */
const PATH_OF: Record<string, string> = Object.fromEntries(
  GOV_CATEGORIES.map((c) => [c.key, c.path])
);

/** 领导任免公告的配套信息（序号与文号、日期一一对应） */
const LEADER_ORDER_DATES = [
  '2026-01-06',
  '2026-01-06',
  '2026-02-03',
  '2026-02-10',
  '2026-03-02',
  '2026-03-16',
];

/** 每名领导的任免备注（人事栏目黑色幽默的集中处） */
const LEADER_REMARKS: Record<string, string> = {
  'ldr-001': '分管工作共 4 项，其中 1 项已列入下年度计划',
  'ldr-002': '协助分管日常事务，日常事务清单另行印发',
  'ldr-003': '分管满意度调查，该项指标连续 12 年未出现波动',
  'ldr-004': '分管政务云，云资源年度使用率 3%，费用按 100% 结算',
  'ldr-005': '分管缴费月份统计，系统累计缴费 4,180 个月',
  'ldr-006': '分管退税，退税事项正在处理中，处理状态长期有效',
};

/* ---------------- 页面 ---------------- */

export interface GovPageProps {
  /** 路由参数：栏目 key，如 policy / plan / finance / personnel / report */
  tab?: string;
  /** 路由 query 透传（本页暂未使用） */
  [key: string]: unknown;
}

export default function GovPage({ tab }: GovPageProps) {
  const rawKey = typeof tab === 'string' ? tab.trim() : '';
  // 深链接兜底：/gov/<条目 id> 视为直接打开该条全文
  const direct = rawKey === '' ? undefined : findGovArticle(rawKey);
  const activeKey = rawKey === '' ? 'policy' : TAB_ALIAS[rawKey] ?? (direct ? direct.category : '');
  const category = GOV_CATEGORIES.find((c) => c.key === activeKey);
  const articles = activeKey ? govArticlesOf(activeKey) : [];

  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Article | null>(direct ?? null);

  // 栏目切换时回到第 1 页 —— 古早网站的翻页状态本来也不保留
  useEffect(() => {
    setPage(1);
    if (direct) setDetail(direct);
  }, [activeKey, rawKey]);

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = articles.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const isPersonnel = activeKey === 'personnel';

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '政务公开', to: '/gov' },
          { label: category ? category.label : '栏目未开设' },
        ]}
      />

      <Alert>
        <b>信息公开指南：</b>
        本机关政府信息通过本栏目主动公开，公开时限为信息形成后 20 个工作日内；依申请公开请提交
        《政府信息公开申请表》，答复期限 20 个工作日，申请表第 3 页需另行索取；
        监督投诉请拨打政务服务热线，热线在工作时间内保持畅通，占线属于畅通的持续状态。
      </Alert>

      <div className="mg-layout-2col mg-gov__body">
        {/* ---- 左栏：栏目树 + 公开统计 ---- */}
        <div className="mg-layout__side">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">政务公开</div>
            {GOV_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to={c.path}
                className={`mg-sidenav__item${c.key === activeKey ? ' is-active' : ''}`}
              >
                {c.label}
                <span className="mg-gov__nav-count">{govArticlesOf(c.key).length}</span>
              </Link>
            ))}
          </div>

          <Panel title="公开统计" variant="navy">
            <div className="mg-gov__stat">
              <div className="mg-gov__stat-row">
                <span className="mg-gov__stat-label">本栏目公开</span>
                <span className="mg-gov__stat-value">{articles.length} 条</span>
              </div>
              <div className="mg-gov__stat-row">
                <span className="mg-gov__stat-label">累计公开</span>
                <span className="mg-gov__stat-value">{GOV_TOTAL} 条</span>
              </div>
              <div className="mg-gov__stat-row">
                <span className="mg-gov__stat-label">依申请公开</span>
                <span className="mg-gov__stat-value">1,204 件 / 已答复 1 件</span>
              </div>
              <div className="mg-gov__stat-row">
                <span className="mg-gov__stat-label">公开时限</span>
                <span className="mg-gov__stat-value">20 个工作日</span>
              </div>
              <div className="mg-gov__stat-row">
                <span className="mg-gov__stat-label">系统状态</span>
                <span className="mg-gov__stat-value">正常（例行维护除外）</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* ---- 主区：页签 + 列表 + 分页 ---- */}
        <div className="mg-layout__main">
          <Panel
            title={category ? category.label : '栏目未开设'}
            extra={
              <span className="mg-gov__count">
                共 {articles.length} 条 / 本页 {pageItems.length} 条
              </span>
            }
          >
            {category ? (
              <>
                <TabBar
                  tabs={GOV_CATEGORIES.map((c) => ({
                    key: c.key,
                    label: c.label,
                    count: govArticlesOf(c.key).length,
                  }))}
                  active={activeKey}
                  onChange={(key) => navigate(PATH_OF[key] ?? '/gov')}
                />

                <div className="mg-gov__intro">{category.intro}</div>

                <div className="mg-gov__years">
                  <span className="mg-chip mg-chip--red">2026 年（{articles.length}）</span>
                  <span className="mg-chip" title="往年文件已归档至纸质档案室，查阅需提交《档案查阅申请表》">
                    2025 年及以前（0）
                  </span>
                  <span className="mg-gov__years-note">
                    往年文件已归档至纸质档案室，查阅需提交《档案查阅申请表》，该表可在档案室现场领取，
                    领取时间为周一至周五 09:00—11:30。
                  </span>
                </div>

                {isPersonnel && (
                  <>
                    <div className="mg-sec-title">领导任免公告</div>
                    <div className="mg-table-scroll mg-gov__table-wrap">
                      <table className="mg-table mg-table--compact mg-gov__table">
                        <thead>
                          <tr>
                            <th style={{ width: 120 }}>姓名</th>
                            <th style={{ width: 200 }}>职务</th>
                            <th className="mg-gov__col-scope">分管工作</th>
                            <th style={{ width: 140 }}>任免文号</th>
                            <th style={{ width: 100 }}>任免日期</th>
                            <th style={{ width: 230 }}>备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {LEADERS.map((l, idx) => (
                            <tr key={l.id}>
                              <td>{l.name}</td>
                              <td>{l.title}</td>
                              <td>{l.scope.join('、')}</td>
                              <td className="mg-gov__docno">
                                美人任〔2026〕{String(idx + 13).padStart(2, '0')} 号
                              </td>
                              <td className="mg-gov__num">{LEADER_ORDER_DATES[idx] ?? '2026-03-16'}</td>
                              <td className="mg-gov__remark">{LEADER_REMARKS[l.id] ?? '现任'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mg-gov__table-note">
                      说明：本表所列人员、职务、文号、日期均为虚构，仅用于讽刺文学创作；
                      任免通知自印发之日起生效，岗位交接应当在 5 个工作日内完成，交接清单共 3 页，第 3 页需另行索取。
                    </div>

                    <div className="mg-sec-title">任免公告全文</div>
                  </>
                )}

                <NewsList
                  items={pageItems.map((a) => ({
                    id: a.id,
                    title: a.title,
                    date: a.date,
                    badge: a.badge,
                    badgeTone: a.badgeTone,
                  }))}
                  showDate
                  showBullet={!isPersonnel}
                  onItemClick={(item) => setDetail(findGovArticle(item.id) ?? null)}
                />

                <Pager
                  page={current}
                  totalPages={totalPages}
                  onChange={setPage}
                  totalItems={articles.length}
                />

                <div className="mg-gov__foot">
                  本栏目共 {articles.length} 条信息，按发布日期倒序排列；发布日期相同的，按文号顺序排列；
                  文号相同的，按系统入库时间排列，入库时间不对外公布。
                </div>
              </>
            ) : (
              <div className="mg-empty">
                <div className="mg-empty__icon">□</div>
                <div>未找到该栏目。本栏目可能尚未开设，或已并入其他栏目——后者更为常见。</div>
                <div className="mg-gov__empty-hint">
                  可点击左侧栏目树继续浏览，或返回 <Link to="/gov">政务公开首页</Link>。
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ---- 全文弹窗 ---- */}
      <Modal
        open={detail !== null}
        title="文件全文"
        width={860}
        onClose={() => setDetail(null)}
        footer={
          <div className="mg-gov__modal-foot">
            <span className="mg-gov__modal-note">本页内容由系统自动生成，如有出入，以纸质文件为准。</span>
            <Button onClick={() => setDetail(null)}>关闭</Button>
          </div>
        }
      >
        {detail && (
          <div className="mg-gov__doc">
            <div className="mg-gov__doc-title">{detail.title}</div>
            <div className="mg-gov__doc-meta">
              <span>文号：{detail.docNo ?? '未编号（编号规则另行规定）'}</span>
              <span>来源：{detail.source}</span>
              <span>发布日期：{detail.date}</span>
              <span>阅读量：{(detail.views ?? 0).toLocaleString()}</span>
              <span>栏目：{category ? category.label : '未知'}</span>
            </div>
            {detail.summary && <div className="mg-gov__doc-summary">摘要：{detail.summary}</div>}
            <div className="mg-article__body mg-gov__doc-body">
              {detail.body.map((p, i) => (
                <p key={`${detail.id}-p${i}`}>{p}</p>
              ))}
            </div>
            <div className="mg-gov__doc-foot">
              承办单位：{detail.source}　|　文件属性：主动公开　|　公开时限：20 个工作日　|　
              附件：另行印发
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
