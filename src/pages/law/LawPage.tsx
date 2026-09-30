/**
 * 政策法规栏目页
 *
 * I. 页面结构
 *
 * 1. 面包屑 + 法规免责提示条
 * 2. 左栏：法规分类栏目树 + 施行提示
 * 3. 中栏：四个页签（联邦法律 / 行政命令 / 部门规章 / 法规解读）+ 条文卡片 + 分页
 *    条文卡片支持「展开条文全文 / 收起条文」，就地展开，不跳转
 * 4. 右栏：法规解读热门榜 + 政策法规查询表单（按文号查询）
 *
 * II. 说明
 *
 * 1. 本站法规均为虚构创作，条文内容不构成任何法律意见。
 * 2. 查询表单按设计恒定返回「未检索到该文号」，并累计查询次数，检索成功次数恒为 0。
 *
 * @module pages/law/LawPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Crumbs, Pager, Panel, TabBar } from '@/components/ui';
import { Link, navigate } from '@/router';
import {
  INTERPRETATIONS,
  LAW_CATEGORIES,
  LAW_TOTAL,
  findLawArticle,
  lawArticlesOf,
} from '@/data/laws';
import type { Article } from '@/data/types';

/* ---------------- 常量 ---------------- */

/** 每页条数 */
const PAGE_SIZE = 10;

/** 路由别名 → 数据分类键 */
const TAB_ALIAS: Record<string, string> = {
  law: 'law',
  laws: 'law',
  federal: 'law',
  order: 'order',
  orders: 'order',
  rule: 'rule',
  rules: 'rule',
  regulation: 'rule',
  interpret: 'interpret',
  interpretation: 'interpret',
  interpretations: 'interpret',
};

/** 分类键 → 路由路径 */
const PATH_OF: Record<string, string> = Object.fromEntries(
  LAW_CATEGORIES.map((c) => [c.key, c.path])
);

/** 右栏热门解读：按阅读量取前 5 条 */
const HOT_INTERPRETATIONS: Article[] = [...INTERPRETATIONS]
  .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  .slice(0, 5);

/** 施行提示（右栏冷幽默集中处） */
const EFFECT_NOTICES: { title: string; note: string }[] = [
  { title: '《联邦表格填写细则》', note: '自 2026 年 5 月 1 日起施行，电子表格使用黑色钢笔填写后扫描上传。' },
  { title: '《政务服务热线话务员考核办法》', note: '自 2026 年 5 月 1 日起施行，单次通话时长不超过 30 秒。' },
  { title: '《群众意见箱管理办法》', note: '自 2026 年 5 月 1 日起施行，意见箱钥匙交接手续办理期间暂停开启。' },
];

/* ---------------- 页面 ---------------- */

export interface LawPageProps {
  /** 路由参数：栏目 key，如 law / order / rule / interpret */
  tab?: string;
  /** 路由 query 透传（本页暂未使用） */
  [key: string]: unknown;
}

export default function LawPage({ tab }: LawPageProps) {
  const rawKey = typeof tab === 'string' ? tab.trim() : '';
  // 深链接兜底：/law/<条文 id> 视为定位到该条文所在栏目并展开
  const direct = rawKey === '' ? undefined : findLawArticle(rawKey);
  const activeKey = rawKey === '' ? 'law' : TAB_ALIAS[rawKey] ?? (direct ? direct.category : '');
  const category = LAW_CATEGORIES.find((c) => c.key === activeKey);
  const articles = activeKey ? lawArticlesOf(activeKey) : [];

  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(direct ? direct.id : null);

  // 查询表单：按设计恒定返回未检索到，并记录累计查询次数
  const [docNo, setDocNo] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryCount, setQueryCount] = useState(1204);

  useEffect(() => {
    setPage(1);
    setExpandedId(direct ? direct.id : null);
  }, [activeKey, rawKey]);

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = articles.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /**
   * 提交文号查询
   *
   * 本功能为展示型查询：无论输入何种文号，均返回未检索到，
   * 并累计查询次数，以保持「检索成功 0 次」这一长期指标。
   */
  const submitQuery = () => {
    const value = docNo.trim();
    if (value === '') {
      setQueryResult('请输入文号后再查询。文号示例：美白发〔2026〕07 号。');
      return;
    }
    setQueryCount((n) => n + 1);
    setQueryResult('未检索到该文号，请确认文号是否正确。');
  };

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '政策法规', to: '/law' },
          { label: category ? category.label : '栏目未开设' },
        ]}
      />

      <Alert tone="gray">
        本站公布的联邦法律、行政命令、部门规章及解读均为虚构创作，人物、文号、条文均不对应任何真实文件，
        仅用于讽刺文学创作与页面演示；如与现行法律条文有出入，以纸质文件为准。
      </Alert>

      <div className="mg-layout-3col mg-law__body">
        {/* ---- 左栏：法规分类 ---- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">政策法规</div>
            {LAW_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                to={c.path}
                className={`mg-sidenav__item${c.key === activeKey ? ' is-active' : ''}`}
              >
                {c.label}
                <span className="mg-gov__nav-count">{lawArticlesOf(c.key).length}</span>
              </Link>
            ))}
          </div>

          <Panel title="相关栏目" variant="navy">
            <div className="mg-law__links">
              <Link to="/gov/policy">政策文件</Link>
              <Link to="/download">表格样式下载</Link>
              <Link to="/service">办事大厅</Link>
              <Link to="/query">便民查询</Link>
            </div>
          </Panel>
        </div>

        {/* ---- 中栏：页签 + 条文卡片 + 分页 ---- */}
        <div className="mg-layout__main">
          <Panel
            title={category ? category.label : '栏目未开设'}
            extra={<span className="mg-gov__count">共 {articles.length} 条 / 合计 {LAW_TOTAL} 条</span>}
          >
            {category ? (
              <>
                <TabBar
                  tabs={LAW_CATEGORIES.map((c) => ({
                    key: c.key,
                    label: c.label,
                    count: lawArticlesOf(c.key).length,
                  }))}
                  active={activeKey}
                  onChange={(key) => navigate(PATH_OF[key] ?? '/law')}
                />

                <div className="mg-gov__intro">{category.intro}</div>

                <div className="mg-law__list">
                  {pageItems.map((a) => {
                    const open = expandedId === a.id;
                    return (
                      <div key={a.id} className={`mg-law__item${open ? ' is-open' : ''}`}>
                        <div className="mg-law__head">
                          <div className="mg-law__main">
                            <div className="mg-law__title">
                              {a.badge && <Badge tone={a.badgeTone ?? 'red'}>{a.badge}</Badge>}
                              {a.title}
                            </div>
                            <div className="mg-law__meta">
                              <span className="mg-law__docno">{a.docNo ?? '未编号'}</span>
                              <span>来源：{a.source}</span>
                              <span>公布日期：{a.date}</span>
                              <span>阅读量：{(a.views ?? 0).toLocaleString()}</span>
                              <span>条文数：{a.body.length} 条</span>
                            </div>
                            {a.summary && <div className="mg-law__summary">摘要：{a.summary}</div>}
                          </div>
                          <button
                            type="button"
                            className="mg-law__toggle"
                            onClick={() => setExpandedId(open ? null : a.id)}
                          >
                            {open ? '收起条文' : '展开条文全文'}
                          </button>
                        </div>

                        {open && (
                          <div className="mg-law__text">
                            <div className="mg-law__text-head">{a.title}（条文全文）</div>
                            {a.body.map((p, i) => (
                              <p key={`${a.id}-c${i}`} className="mg-law__clause">
                                {p}
                              </p>
                            ))}
                            <div className="mg-law__text-foot">
                              本条文自公布之日起施行。施行日期与公布日期的换算方式，由制定机关另行规定；
                              本条文的解释权属于制定机关，解释申请的办理时限为 20 个工作日。
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Pager
                  page={current}
                  totalPages={totalPages}
                  onChange={setPage}
                  totalItems={articles.length}
                />

                <div className="mg-gov__foot">
                  本栏目条文按公布日期倒序排列；条文修订后仍在原位置展示，修订后的版本号在文中注明，
                  历史版本可在纸质档案室查阅。
                </div>
              </>
            ) : (
              <div className="mg-empty">
                <div className="mg-empty__icon">□</div>
                <div>未检索到该法规栏目。该栏目可能正在清理整合，或已并入本级法规汇编。</div>
                <div className="mg-gov__empty-hint">
                  可点击左侧栏目树继续浏览，或返回 <Link to="/law">政策法规首页</Link>。
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ---- 右栏：热门解读 + 文号查询 ---- */}
        <div className="mg-layout__right">
          <Panel title="法规解读 · 热门" variant="red">
            <ol className="mg-law__hot">
              {HOT_INTERPRETATIONS.map((a, i) => (
                <li key={a.id} className="mg-law__hot-item">
                  <span className={`mg-law__hot-rank${i < 3 ? ' is-top' : ''}`}>{i + 1}</span>
                  <Link to="/law/interpret" className="mg-law__hot-title" title={a.title}>
                    {a.title}
                  </Link>
                  <span className="mg-law__hot-views">{(a.views ?? 0).toLocaleString()}</span>
                </li>
              ))}
            </ol>
            <div className="mg-law__hot-foot">按阅读量排序，数据每季度更新一次，更新日期另行通知。</div>
          </Panel>

          <Panel title="政策法规查询" variant="navy">
            <div className="mg-law__query">
              <div className="mg-law__query-label">文号</div>
              <input
                className="mg-input"
                value={docNo}
                placeholder="如：美白发〔2026〕07 号"
                onChange={(e) => setDocNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQuery();
                }}
              />
              <Button variant="primary" onClick={submitQuery} className="mg-law__query-btn">
                查询
              </Button>
            </div>

            {queryResult && <div className="mg-law__result">{queryResult}</div>}

            <div className="mg-law__query-hint">
              查询范围：本站已公开法规的索引信息，不含法规正文；仅支持文号精确检索，
              不支持标题、关键词、日期检索。
              <br />
              本功能累计受理查询 {queryCount.toLocaleString()} 次，检索成功 0 次；
              查询结果仅供参考，如需确认文号，请到政务大厅 3 号窗口现场咨询。
            </div>
          </Panel>

          <Panel title="施行提示">
            <div className="mg-law__notices">
              {EFFECT_NOTICES.map((n) => (
                <div key={n.title} className="mg-law__notice">
                  <div className="mg-law__notice-title">{n.title}</div>
                  <div className="mg-law__notice-note">{n.note}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
