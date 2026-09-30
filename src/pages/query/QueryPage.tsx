/**
 * 便民查询总入口与工具分发
 *
 * I. 路由契约
 *
 * 1. `/query`         → 查询总入口（实时看板 + 6 项工具入口 + 使用说明 + 常见问题）
 * 2. `/query/:tool`   → 对应查询工具，tool 取值见 QUERY_TOOLS
 * 3. 其他 tool 取值    → 查询事项不存在的错误态，并在页内给出全部事项清单
 *
 * II. 黑色幽默落点（总入口）
 *
 * 1. 实时看板：当前排队查询人数只增不减，回落功能预计 2027 年上线
 * 2. 检索：未命中的检索结果的说明是"本系统共设 6 项查询事项"，检索不改变事项数量
 * 3. 使用说明：本说明每次查询前均需阅读，而系统不保存阅读记录
 * 4. 常见问题：查询不到结果时请在查询到结果后重新查询
 *
 * @module pages/query/QueryPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Badge, Button, Crumbs, Panel } from '@/components/ui';
import { ServiceIcon } from '@/components/art';
import { Link } from '@/router';
import { useApp } from '@/app-context';
import { SITE } from '@/data/site';
import {
  QUERY_FAQS,
  QUERY_INSTRUCTIONS,
  QUERY_NOTICES,
  QUERY_TOOLS,
  QUERY_STATES,
  findQueryTool,
  isQueryToolKey,
} from '@/data/query-data';
import type { QueryTool } from '@/data/query-data';
import { formatInt, useOnlyIncreasing } from '@/pages/query/shared';
import SocialTool from '@/pages/query/tools/SocialTool';
import TaxRefundTool from '@/pages/query/tools/TaxRefundTool';
import PassportTool from '@/pages/query/tools/PassportTool';
import GunTool from '@/pages/query/tools/GunTool';
import TicketTool from '@/pages/query/tools/TicketTool';
import QueueTool from '@/pages/query/tools/QueueTool';

/** 排队查询人数的初始值 */
const QUEUE_START = 214_882;

/** 常用查询排行（虚构统计，数字只增不减） */
const QUERY_RANKING: { name: string; count: number }[] = [
  { name: '社保查询', count: 412_883 },
  { name: '退税进度查询', count: 388_104 },
  { name: '交通罚单查询', count: 271_556 },
  { name: '护照办理进度', count: 190_227 },
  { name: '枪支许可预约', count: 96_431 },
  { name: '现场排队取号', count: 41_002 },
];

export interface QueryPageProps {
  /** 路径参数 tool；访问 /query 时为 undefined */
  tool?: string;
  /** 兼容 App.tsx 透传的 querystring（本页未使用） */
  [param: string]: string | undefined;
}

/* ================= 查询事项入口卡片 ================= */

function ToolCard({ tool }: { tool: QueryTool }) {
  return (
    <Link to={`/query/${tool.key}`} className="mg-q-toolcard">
      <span className="mg-q-toolcard__icon">
        <ServiceIcon name={tool.icon} width={34} height={34} />
      </span>
      <span className="mg-q-toolcard__body">
        <span className="mg-q-toolcard__name">{tool.name}</span>
        <span className="mg-q-toolcard__dept">{tool.department}</span>
        <span className="mg-q-toolcard__intro">{tool.intro}</span>
        <span className="mg-q-toolcard__meta">
          <Badge tone="outline">承诺时限 {tool.duration}</Badge>
          <Badge tone="gold">法定时限 {tool.legalDuration}</Badge>
        </span>
      </span>
    </Link>
  );
}

/* ================= 左侧导航 ================= */

function QuerySidenav() {
  return (
    <div className="mg-sidenav">
      <div className="mg-sidenav__head">查询事项</div>
      {QUERY_TOOLS.map((t) => (
        <Link key={t.key} to={`/query/${t.key}`} className="mg-sidenav__item">
          {t.name}
        </Link>
      ))}
    </div>
  );
}

/* ================= 实时看板 ================= */

function QueryBoard() {
  const { todayCount } = useApp();
  // 排队人数只增不减：本页每 1.5 秒增加 1 至 3 人
  const queued = useOnlyIncreasing(QUEUE_START, 1500, 3);

  return (
    <>
      <div className="mg-q-board">
        <div className="mg-q-board__item">
          <div className="mg-q-board__num">{formatInt(queued)}</div>
          <div className="mg-q-board__label">当前排队查询人数</div>
          <div className="mg-q-board__note">该数字仅增不减，回落功能预计于 2027 年上线。</div>
        </div>
        <div className="mg-q-board__item">
          <div className="mg-q-board__num">{formatInt(todayCount)}</div>
          <div className="mg-q-board__label">今日查询受理量</div>
          <div className="mg-q-board__note">每 1.8 秒更新一次，更新期间显示上一次更新结果。</div>
        </div>
        <div className="mg-q-board__item">
          <div className="mg-q-board__num">0.8</div>
          <div className="mg-q-board__label">平均响应时间（秒）</div>
          <div className="mg-q-board__note">不含排队时间、不含等待时间、不含维护时间。</div>
        </div>
        <div className="mg-q-board__item">
          <div className="mg-q-board__num">99.8%</div>
          <div className="mg-q-board__label">查询服务满意度</div>
          <div className="mg-q-board__note">该指标已连续 12 年无波动，是唯一未出现过波动的指标。</div>
        </div>
      </div>
      <div className="mg-q-hintline">
        本看板每 1.5 秒刷新一次，刷新期间数据不更新。看板数据仅供参考，实际数据以看板数据为准。
      </div>
    </>
  );
}

/* ================= 常见问题 ================= */

function FaqList() {
  const [openId, setOpenId] = useState<string | null>(QUERY_FAQS[0]?.id ?? null);

  return (
    <div className="mg-q-faq">
      {QUERY_FAQS.map((f) => {
        const open = openId === f.id;
        return (
          <div key={f.id} className={`mg-q-faq__item${open ? ' is-open' : ''}`}>
            <button
              type="button"
              className="mg-q-faq__q"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : f.id)}
            >
              <span className="mg-q-faq__mark">{open ? '−' : '+'}</span>
              {f.question}
            </button>
            {open && (
              <div className="mg-q-faq__a">
                <p>{f.answer}</p>
                {f.footnote && <p className="mg-q-faq__foot">{f.footnote}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= 总入口 ================= */

function QueryEntry() {
  const [keyword, setKeyword] = useState('');
  const kw = keyword.trim();
  const matched = kw
    ? QUERY_TOOLS.filter(
        (t) => t.name.includes(kw) || t.intro.includes(kw) || t.department.includes(kw)
      )
    : QUERY_TOOLS;

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '便民查询' }]} />

      <div className="mg-layout-3col">
        {/* ---------- 左栏 ---------- */}
        <div className="mg-layout__left">
          <QuerySidenav />
          <Panel title="查询范围">
            <div className="mg-q-note">
              <p>本入口共设 {QUERY_TOOLS.length} 项查询事项，覆盖个人社保、税务、证照、罚单与现场排队。</p>
              <p>事项清单以外的查询事项，请在本页选择其他事项。本页不提供清单以外的查询事项。</p>
            </div>
          </Panel>
        </div>

        {/* ---------- 中栏 ---------- */}
        <div className="mg-layout__main">
          <Panel title="查询进度实时看板" variant="red">
            <QueryBoard />
          </Panel>

          <Panel
            title="查询事项入口"
            extra={<span className="mg-q-panel-extra">共 {QUERY_TOOLS.length} 项</span>}
          >
            <div className="mg-q-filter">
              <input
                className="mg-input"
                value={keyword}
                placeholder="输入事项名称、主管部门或关键词检索，例如：社保"
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button size="sm" onClick={() => setKeyword('')} disabled={!kw}>
                清除
              </Button>
              <span className="mg-q-filter__note">
                检索结果 {matched.length} 项。检索不改变本系统的查询事项数量。
              </span>
            </div>

            {matched.length === 0 ? (
              <div className="mg-empty">
                <div className="mg-empty__icon">·</div>
                <div>未检索到相关查询事项。本系统共设 {QUERY_TOOLS.length} 项查询事项，检索不产生新的事项。</div>
                <div className="mg-q-hintline">
                  如需办理清单以外的事项，请先办理该事项，办理完成后该事项将列入清单。
                </div>
              </div>
            ) : (
              <div className="mg-grid mg-grid--3">
                {matched.map((t) => (
                  <ToolCard key={t.key} tool={t} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="使用说明">
            <ol className="mg-q-ol">
              {QUERY_INSTRUCTIONS.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="常见问题" extra={<span className="mg-q-panel-extra">点击问题展开答复</span>}>
            <FaqList />
          </Panel>
        </div>

        {/* ---------- 右栏 ---------- */}
        <div className="mg-layout__right">
          <Panel title="常用查询排行" flush>
            <ul className="mg-list">
              {QUERY_RANKING.map((r, i) => (
                <li key={r.name} className="mg-list__item">
                  <span className={`mg-q-rank${i < 3 ? ' is-top' : ''}`}>{i + 1}</span>
                  <span className="mg-list__text">{r.name}</span>
                  <span className="mg-list__date">{formatInt(r.count)} 次</span>
                </li>
              ))}
            </ul>
            <div className="mg-q-hintline mg-q-hintline--pad">
              排行按累计查询次数排序，累计次数只增不减，故排行不会变动。
            </div>
          </Panel>

          <Panel title="查询须知">
            <Alert tone="yellow">
              系统维护窗口为每日 00:00-24:00。维护期间查询功能正常，维护状态显示为维护中。
            </Alert>
            <ol className="mg-q-ol">
              {QUERY_NOTICES.map((text) => (
                <li key={text}>{text}</li>
              ))}
              <li>
                本系统已接入 {QUERY_STATES.length - 1} 个州别的罚单数据，其余地区的数据按接入进度接入。
              </li>
            </ol>
          </Panel>

          <Panel title="服务热线">
            <div className="mg-q-hotline">{SITE.hotline}</div>
            <div className="mg-q-hotline__note">
              服务时间：周一至周五 09:00-17:00；周六、周日 00:00-24:00。
            </div>
            <div className="mg-q-hotline__note">占线时请挂机重拨，本热线不提供回拨服务。</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 未知事项错误态 ================= */

function UnknownTool({ tool }: { tool: string }) {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '便民查询', to: '/query' }, { label: '查询事项不存在' }]} />
      <div className="mg-layout-3col">
        <div className="mg-layout__left">
          <QuerySidenav />
        </div>
        <div className="mg-layout__main">
          <Panel title="查询事项不存在" variant="red">
            <Alert tone="red">
              未找到名为「{tool}」的查询事项。本系统共设 {QUERY_TOOLS.length} 项查询事项，
              请从下列清单中选择。清单以外的事项，请先办理该事项。
            </Alert>
            <div className="mg-grid mg-grid--2">
              {QUERY_TOOLS.map((t) => (
                <ToolCard key={t.key} tool={t} />
              ))}
            </div>
            <div className="mg-q-hintline">
              如该事项确已在其他系统办理完毕，说明本系统尚未同步该事项。同步时间以同步时间为准。
            </div>
          </Panel>
        </div>
        <div className="mg-layout__right">
          <Panel title="办理信息">
            <div className="mg-q-facts">
              <div className="mg-q-facts__row">
                <span>本次请求</span>
                <b>/query/{tool}</b>
              </div>
              <div className="mg-q-facts__row">
                <span>处理结果</span>
                <b>未命中事项清单</b>
              </div>
              <div className="mg-q-facts__row">
                <span>处理时长</span>
                <b>即时</b>
              </div>
            </div>
            <div className="mg-q-quip">本次请求未产生办件，不占用您的查询次数。</div>
          </Panel>
          <Panel title="返回">
            <Link to="/query" className="mg-btn mg-btn--primary">
              返回查询总入口
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 分发 ================= */

export default function QueryPage({ tool }: QueryPageProps) {
  // 无 tool：查询总入口
  if (!tool) return <QueryEntry />;

  // tool 不在清单内：错误态
  if (!isQueryToolKey(tool)) return <UnknownTool tool={tool} />;

  // 按事项分发到对应工具
  const current = findQueryTool(tool);
  switch (tool) {
    case 'social':
      return <SocialTool />;
    case 'tax-refund':
      return <TaxRefundTool />;
    case 'passport':
      return <PassportTool />;
    case 'gun':
      return <GunTool />;
    case 'ticket':
      return <TicketTool />;
    case 'queue':
      return <QueueTool />;
    default:
      return <UnknownTool tool={current?.key ?? tool} />;
  }
}
