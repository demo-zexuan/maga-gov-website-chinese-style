/**
 * 下载中心
 *
 * I. 路由契约
 *
 * 1. `/download`        → 表格下载（默认栏目）
 * 2. `/download/guide`  → 办事指南
 * 3. `/download/app`    → 客户端下载
 * 4. 其他 tab 取值       → 栏目不存在的错误态
 *
 * II. 功能
 *
 * 1. TabBar 三个栏目：表格下载 / 办事指南 / 客户端下载
 * 2. 表格与指南支持关键词检索（名称 / 编号 / 主管部门）、格式筛选与分页
 * 3. 每一行点「下载」弹出进度弹窗：进度爬到 99% 后停住，文案循环，30 秒后追加说明
 * 4. 弹窗打开即计入下载次数（取消同样计入），回执里必须写明这一点
 * 5. 客户端按平台筛选，卡片含二维码与系统要求
 *
 * III. 黑色幽默落点（本页 ≥ 15 处，主要分布在数据文件的 remark 与下列界面文案）
 *
 * 1. 下载前请先下载《下载须知》，且须知本身也可以下载并同样卡在 99%
 * 2. 取消下载的回执：下载次数已计入
 * 3. 进度停在 99%：剩余 1% 由人工核验完成，核验人员不对外提供联系方式
 * 4. 列表行下的每一条 remark 都是吐槽位，不再另设「注意事项」栏目
 *
 * @module pages/download/DownloadPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Crumbs, MoreLink, Panel, Pager, TabBar } from '@/components/ui';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';
import { DOWNLOAD_RANKING, formatNumber } from '@/data/stats';
import { faqsByCategory } from '@/data/faqs';
import type { DownloadItem } from '@/data/types';
import {
  APPS,
  APP_PLATFORMS,
  DOWNLOADS,
  DOWNLOAD_FORMATS,
  GUIDES,
  findDownload,
} from '@/data/downloads';
import type { AppItem } from '@/data/downloads';
import DownloadModal from '@/pages/download/DownloadModal';
import { AppCard, DlRow } from '@/pages/download/parts';

/* ================= 栏目定义 ================= */

type TabKey = 'form' | 'guide' | 'app';

const TAB_DEFS: { key: TabKey; label: string; path: string }[] = [
  { key: 'form', label: '表格下载', path: '/download' },
  { key: 'guide', label: '办事指南', path: '/download/guide' },
  { key: 'app', label: '客户端下载', path: '/download/app' },
];

/** 表格栏目每页条数 */
const FORM_PAGE_SIZE = 12;
/** 指南栏目每页条数 */
const GUIDE_PAGE_SIZE = 10;

/* ================= 右栏：常见问题 ================= */

function DownloadFaqs() {
  const faqs = useMemo(() => faqsByCategory('download'), []);
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="mg-dl-faq">
      {faqs.map((f) => {
        const open = openId === f.id;
        return (
          <div key={f.id} className={`mg-dl-faq__item${open ? ' is-open' : ''}`}>
            <button
              type="button"
              className="mg-dl-faq__q"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : f.id)}
            >
              <span className="mg-dl-faq__mark">{open ? '−' : '+'}</span>
              {f.question}
            </button>
            {open && (
              <div className="mg-dl-faq__a">
                <p>{f.answer}</p>
                {f.footnote && <p className="mg-dl-faq__foot">网友补充：{f.footnote}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= 左栏：栏目导航 ================= */

function DownloadSidenav({ active }: { active: TabKey }) {
  return (
    <div className="mg-sidenav">
      <div className="mg-sidenav__head">下载分类</div>
      {TAB_DEFS.map((t) => (
        <Link
          key={t.key}
          to={t.path}
          className={`mg-sidenav__item${t.key === active ? ' is-active' : ''}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

/* ================= 主页面 ================= */

function DownloadCenter({ tab }: { tab: TabKey }) {
  const { pushToast } = useApp();

  // I. 筛选与分页状态
  const [keyword, setKeyword] = useState('');
  const [format, setFormat] = useState('');
  const [platform, setPlatform] = useState('');
  const [page, setPage] = useState(1);

  // II. 下载次数：本次会话的增量，取消的下载同样计入
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessionDownloads, setSessionDownloads] = useState(0);

  // III. 下载弹窗与取消回执
  const [active, setActive] = useState<DownloadItem | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  // 切换栏目时清空筛选条件与页码，避免把上一栏的条件带到下一栏
  useEffect(() => {
    setKeyword('');
    setFormat('');
    setPlatform('');
    setPage(1);
  }, [tab]);

  const listSource: DownloadItem[] = tab === 'form' ? DOWNLOADS : tab === 'guide' ? GUIDES : [];
  const kw = keyword.trim();

  const filtered = listSource.filter((d) => {
    const hitKeyword =
      !kw || d.name.includes(kw) || d.formNo.includes(kw) || d.department.includes(kw);
    const hitFormat = !format || d.format === format;
    return hitKeyword && hitFormat;
  });

  const filteredApps = APPS.filter((a) => {
    const hitPlatform = !platform || a.platform === platform;
    const hitKeyword = !kw || a.name.includes(kw) || a.note.includes(kw);
    return hitPlatform && hitKeyword;
  });

  const pageSize = tab === 'guide' ? GUIDE_PAGE_SIZE : FORM_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /** 开始下载：进入弹窗的同时即计入下载次数 */
  const beginDownload = (item: DownloadItem) => {
    setCounts((c) => ({ ...c, [item.id]: (c[item.id] ?? 0) + 1 }));
    setSessionDownloads((n) => n + 1);
    setReceipt(null);
    setActive(item);
  };

  /** 客户端同样走同一套下载弹窗：先映射为等价的可下载条目 */
  const beginAppDownload = (app: AppItem) => {
    beginDownload({
      id: app.id,
      name: app.name,
      format: 'EXE',
      size: app.size,
      date: app.date,
      department: `${app.platform} 客户端`,
      downloads: 0,
      formNo: app.version,
      remark: app.note,
    });
  };

  /** 取消下载：关闭弹窗并给出回执，次数不撤回 */
  const cancelDownload = (item: DownloadItem, seconds: number) => {
    setActive(null);
    setReceipt(
      `取消成功，本次下载已取消。该文件的下载次数已计入。本次已等待 ${seconds} 秒，等待时间不予补偿，也不予退还。`
    );
    pushToast('下载已取消', '取消成功，本次下载已取消。该文件的下载次数已计入。');
  };

  /** 下载《下载须知》：须知本身同样卡在 99% */
  const downloadNotice = () => {
    const notice = findDownload('dl-058');
    if (notice) beginDownload(notice);
  };

  const resetFilters = () => {
    setKeyword('');
    setFormat('');
    setPlatform('');
    setPage(1);
  };

  const tabLabel = TAB_DEFS.find((t) => t.key === tab)?.label ?? '下载中心';
  const totalFiles = DOWNLOADS.length + GUIDES.length + APPS.length;

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '下载中心', to: '/download' }, { label: tabLabel }]} />

      <div className="mg-layout-3col">
        {/* ---------- 左栏 ---------- */}
        <div className="mg-layout__left">
          <DownloadSidenav active={tab} />

          <Panel title="下载统计">
            <div className="mg-dl-facts">
              <div className="mg-dl-facts__row">
                <span>表格</span>
                <b>{DOWNLOADS.length} 种</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>办事指南</span>
                <b>{GUIDES.length} 份</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>客户端</span>
                <b>{APPS.length} 个</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>本次会话下载</span>
                <b>{sessionDownloads} 次</b>
              </div>
            </div>
            <div className="mg-dl-note">
              本次会话下载次数含已取消的下载。取消不退还次数，也不退还等待时间。
            </div>
          </Panel>

          <Panel title="格式说明">
            {DOWNLOAD_FORMATS.map((f) => (
              <div key={f.key} className="mg-dl-legend">
                <span className="mg-dl-row__format" data-fmt={f.key}>
                  {f.label}
                </span>
                <span className="mg-dl-legend__note">{f.note}</span>
              </div>
            ))}
            <div className="mg-dl-note">
              格式由上传方决定。同一份表格在不同栏目可能提供不同格式，各格式内容以各格式内容为准。
            </div>
          </Panel>
        </div>

        {/* ---------- 中栏 ---------- */}
        <div className="mg-layout__main">
          <Panel
            title="下载中心"
            extra={<span className="mg-dl-panel-extra">共 {totalFiles} 个下载文件</span>}
          >
            <TabBar
              tabs={[
                { key: 'form', label: '表格下载', count: DOWNLOADS.length },
                { key: 'guide', label: '办事指南', count: GUIDES.length },
                { key: 'app', label: '客户端下载', count: APPS.length },
              ]}
              active={tab}
              onChange={(key) => {
                const target = TAB_DEFS.find((t) => t.key === key);
                navigate(target ? target.path : '/download');
              }}
            />

            {/* 下载须知：须知本身也可以下载，且同样卡在 99% */}
            <div className="mg-dl-notice">
              <Alert tone="yellow">
                下载前请先下载《下载须知》。该须知说明了下载本须知的方式，下载本须知前请先阅读该须知。
              </Alert>
              <Button size="sm" onClick={downloadNotice}>
                下载《下载须知》
              </Button>
            </div>

            {receipt && (
              <div className="mg-dl-receipt">
                <span className="mg-dl-receipt__mark">回执</span>
                <span className="mg-dl-receipt__text">{receipt}</span>
                <Button size="sm" onClick={() => setReceipt(null)}>
                  关闭回执
                </Button>
              </div>
            )}

            {/* ---------- 表格 / 指南 ---------- */}
            {tab !== 'app' && (
              <>
                <div className="mg-dl-toolbar">
                  <input
                    className="mg-input"
                    value={keyword}
                    placeholder="按名称、表格编号或主管部门检索，例如：1040"
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                  />
                  <select
                    className="mg-select"
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">全部格式</option>
                    {DOWNLOAD_FORMATS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}（{f.note}）
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={resetFilters} disabled={!kw && !format}>
                    清除筛选
                  </Button>
                  <span className="mg-dl-toolbar__note">
                    检索结果 {filtered.length} 种。检索不改变表格总数，表格总数为 {listSource.length} 种。
                  </span>
                </div>

                {pageItems.length === 0 ? (
                  <div className="mg-empty">
                    <div className="mg-empty__icon">·</div>
                    <div>未检索到相关文件。检索不产生新的文件。</div>
                    <div className="mg-dl-note">
                      如需本栏目以外的文件，请先在本栏目检索到该文件。检索条件可由「清除筛选」清除，
                      清除后检索条件不再保留。
                    </div>
                  </div>
                ) : (
                  <div className="mg-dl-list">
                    {pageItems.map((item) => (
                      <DlRow
                        key={item.id}
                        item={item}
                        extraCount={counts[item.id] ?? 0}
                        onDownload={beginDownload}
                      />
                    ))}
                  </div>
                )}

                <Pager
                  page={safePage}
                  totalPages={totalPages}
                  onChange={setPage}
                  totalItems={filtered.length}
                />
              </>
            )}

            {/* ---------- 客户端 ---------- */}
            {tab === 'app' && (
              <>
                <div className="mg-dl-toolbar">
                  <select
                    className="mg-select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="">全部平台</option>
                    {APP_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    className="mg-input"
                    value={keyword}
                    placeholder="按客户端名称或说明检索，例如：报税"
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <Button size="sm" onClick={resetFilters} disabled={!kw && !platform}>
                    清除筛选
                  </Button>
                  <span className="mg-dl-toolbar__note">
                    共 {filteredApps.length} 个客户端。安装包均由本系统提供，不接受第三方安装包。
                  </span>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="mg-empty">
                    <div className="mg-empty__icon">·</div>
                    <div>未检索到相关客户端。本栏目共 {APPS.length} 个客户端，检索不改变客户端数量。</div>
                  </div>
                ) : (
                  <div className="mg-grid mg-grid--2">
                    {filteredApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        extraCount={counts[app.id] ?? 0}
                        onDownload={beginAppDownload}
                        onInstallNote={(a) =>
                          pushToast(
                            '安装说明',
                            `${a.name} 的安装说明需在安装完成后查看。安装完成后请重新打开本页查看安装说明。`
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="常见问题" extra={<span className="mg-dl-panel-extra">点击问题展开答复</span>}>
            <DownloadFaqs />
          </Panel>
        </div>

        {/* ---------- 右栏 ---------- */}
        <div className="mg-layout__right">
          <Panel
            title="下载排行"
            extra={<MoreLink to="/download" />}
            flush
          >
            <div className="mg-dl-rank">
              {DOWNLOAD_RANKING.slice(0, 6).map((r, i) => (
                <div key={r.id} className="mg-dl-rank__item">
                  <span className={`mg-dl-rank__no${i < 3 ? ' is-top' : ''}`}>{i + 1}</span>
                  <div className="mg-dl-rank__body">
                    <div className="mg-dl-rank__title">{r.title}</div>
                    {r.remark && <div className="mg-dl-rank__remark">{r.remark}</div>}
                  </div>
                  <span className="mg-dl-rank__value">
                    {formatNumber(r.value)}
                    <span className="mg-dl-rank__unit">{r.unit}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mg-dl-note mg-dl-note--pad">
              排行按累计下载次数排序。累计次数只增不减，取消的下载同样计入。
            </div>
          </Panel>

          <Panel title="下载方式">
            <div className="mg-dl-facts">
              <div className="mg-dl-facts__row">
                <span>在线下载</span>
                <b>已开通</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>断点续传</span>
                <b>未开通</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>邮寄光盘</span>
                <b>需现场申请</b>
              </div>
              <div className="mg-dl-facts__row">
                <span>现场拷贝</span>
                <b>需自带存储设备</b>
              </div>
            </div>
            <div className="mg-dl-note">
              现场拷贝请自带存储设备。存储设备须经安全检查，检查时间约为 3 个工作日。
            </div>
          </Panel>

          <Panel title="常见问题提示">
            <div className="mg-dl-note">
              表格打不开的，请先下载阅读器。阅读器下载页面正在维护中，维护窗口：每日 00:00-24:00。
            </div>
            <div className="mg-dl-note">
              同一表格有多个版本的，以本网最新版本为准。最新版本的界定见《版本界定公告》，
              该公告在版本变更后发布。
            </div>
          </Panel>
        </div>
      </div>

      {active && <DownloadModal item={active} onCancel={cancelDownload} />}
    </div>
  );
}

/* ================= 栏目不存在 ================= */

function UnknownTab({ tab }: { tab: string }) {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '下载中心', to: '/download' }, { label: '栏目不存在' }]} />
      <div className="mg-layout-3col">
        <div className="mg-layout__left">
          <DownloadSidenav active="form" />
        </div>
        <div className="mg-layout__main">
          <Panel title="栏目不存在" variant="red">
            <Alert tone="red">
              未找到名为「{tab}」的下载栏目。本栏目下设 {TAB_DEFS.length} 个分类，
              请从下列分类中选择。分类以外的栏目尚未开列，开列时间以开列时间为准。
            </Alert>
            <div className="mg-grid mg-grid--3">
              {TAB_DEFS.map((t) => (
                <Link key={t.key} to={t.path} className="mg-dl-catcard">
                  <span className="mg-dl-catcard__name">{t.label}</span>
                  <span className="mg-dl-catcard__meta">
                    {t.key === 'form'
                      ? `${DOWNLOADS.length} 种表格`
                      : t.key === 'guide'
                        ? `${GUIDES.length} 份指南`
                        : `${APPS.length} 个客户端`}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mg-dl-note">
              您请求的栏目为「{tab}」。该栏目未开列，本次请求不产生下载记录，也不占用您的下载次数。
            </div>
          </Panel>
        </div>
        <div className="mg-layout__right">
          <Panel title="提示">
            <div className="mg-dl-note">
              本系统不提供按 URL 直接访问未开列栏目的方式。如需访问未开列栏目，请等待该栏目开列。
            </div>
            <div className="mg-dl-note">
              本次请求的栏目未开列。未开列的栏目不占用系统资源，也不会计入下载次数。
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 分发 ================= */

export interface DownloadPageProps {
  /** 路径参数 tab；访问 /download 时为 undefined */
  tab?: string;
  /** 兼容 App.tsx 透传的 querystring */
  [param: string]: string | undefined;
}

export default function DownloadPage({ tab }: DownloadPageProps) {
  // 无 tab 或 tab=form：表格下载
  if (!tab || tab === 'form') return <DownloadCenter tab="form" />;
  if (tab === 'guide') return <DownloadCenter tab="guide" />;
  if (tab === 'app') return <DownloadCenter tab="app" />;
  // 其他取值：栏目不存在的错误态
  return <UnknownTab tab={tab} />;
}
