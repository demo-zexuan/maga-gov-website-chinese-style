/**
 * 首页底部面板区
 *
 * I. 栅格（与参考图一致）
 *
 * 1. 左 360px —— 热门服务（8 格图标）+ 地方分站（方格地图 + 6 个州标签）
 * 2. 中 自适应（两列）—— 政务公开 + 政策解读 ｜ 党建引领 + 常见问题
 * 3. 右 300px —— 领导活动 + 下载排行
 *
 * II. 内容来源
 *
 * 1. 热门服务取 `HOT_SERVICES`（`@/data/services`），顺序即参考图顺序。
 * 2. 下载排行取首页编排后的 `DOWNLOAD_ROWS`，其 `remark` 是黑色幽默落点。
 * 3. 领导活动取 `ACTIVITY_ROWS`，日期已由数据层换算为 MM-DD 短格式。
 *
 * @module pages/home/BottomPanels
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { ElephantEmblem, ServiceIcon, USMapGrid } from '@/components/art';
import { MoreLink, Panel, TabBar } from '@/components/ui';
import {
  ACTIVITY_ROWS,
  DOWNLOAD_ROWS,
  FAQ_ROWS,
  GOV_TABS,
  HOT_SERVICES_NOTE,
  LOCAL_STATIONS,
  LOCAL_STATIONS_NOTE,
  PARTY_LEAD,
  PARTY_LINES,
  POLICY_READS,
} from '@/data/home';
import { HOT_SERVICES } from '@/data/services';
import { Link } from '@/router';
import { HomeList } from './HomeList';

/* ================= I. 热门服务（底部左） ================= */

/** 8 格图标：4 列 × 2 行，与参考图顺序一致 */
function HotServicesPanel() {
  return (
    <Panel title="热门服务" extra={<MoreLink to="/service" />}>
      <div className="mg-iconbox mg-grid--4 mg-home__hotgrid">
        {HOT_SERVICES.map((s) => (
          <Link key={s.id} to={`/service/detail/${s.id}`} className="mg-iconbox__cell">
            <ServiceIcon className="mg-iconbox__icon" name={s.icon} width={34} height={34} />
            <span className="mg-iconbox__label">{s.name}</span>
          </Link>
        ))}
      </div>
      <div className="mg-home__panel-note">{HOT_SERVICES_NOTE}</div>
    </Panel>
  );
}

/* ================= II. 地方分站（底部左） ================= */

function LocalStationsPanel() {
  const codes = LOCAL_STATIONS.map((s) => s.code);
  return (
    <Panel title="地方分站" extra={<MoreLink to="/local" />}>
      <div className="mg-tilemap mg-home__local-map">
        <USMapGrid cell={11} highlight={codes} />
      </div>
      <div className="mg-home__states">
        {LOCAL_STATIONS.map((s) => (
          <Link key={s.code} to={`/local/${s.code}`} className="mg-home__state" title={s.label}>
            {s.label}
          </Link>
        ))}
      </div>
      <div className="mg-home__more-states">
        <MoreLink to="/local">更多州</MoreLink>
      </div>
      <div className="mg-home__panel-note">{LOCAL_STATIONS_NOTE}</div>
    </Panel>
  );
}

/* ================= III. 政务公开（底部中·左列上） ================= */

function GovPanel() {
  const [active, setActive] = useState(GOV_TABS[0].key);
  const group = GOV_TABS.find((g) => g.key === active) ?? GOV_TABS[0];

  return (
    <Panel
      title="政务公开"
      extra={<MoreLink to="/gov" />}
      flush
      headClassName="mg-home__head--tabs"
    >
      <TabBar
        className="mg-home__tabbar"
        tabs={GOV_TABS.map((g) => ({ key: g.key, label: g.label }))}
        active={active}
        onChange={setActive}
      />
      <HomeList rows={group.rows} />
    </Panel>
  );
}

/* ================= IV. 党建引领（底部中·右列上） ================= */

function PartyPanel() {
  return (
    <Panel title="党建引领" variant="red" extra={<MoreLink to="/party" />}>
      <div className="mg-home__party">
        <ElephantEmblem className="mg-home__party-emblem" width={48} height={48} />
        <div className="mg-home__party-lead">
          {PARTY_LEAD.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <ul className="mg-home__party-lines">
        {PARTY_LINES.map((line) => (
          <li key={line}>
            <span className="mg-home__party-square" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ================= V. 政策解读 / 常见问题（底部中） ================= */

function PolicyReadPanel() {
  return (
    <Panel title="政策解读" extra={<MoreLink to="/law/interpret" />}>
      <HomeList rows={POLICY_READS} />
    </Panel>
  );
}

function FaqPanel() {
  return (
    <Panel title="常见问题" extra={<MoreLink to="/query" />}>
      <HomeList rows={FAQ_ROWS} />
    </Panel>
  );
}

/* ================= VI. 领导活动（底部右） ================= */

function ActivityPanel() {
  return (
    <Panel title="领导活动" extra={<MoreLink to="/local/governor" />}>
      <HomeList rows={ACTIVITY_ROWS} />
    </Panel>
  );
}

/* ================= VII. 下载排行（底部右） ================= */

/**
 * 带红色数字序号的排行榜
 *
 * 与 `NewsList` 的区别只在序号列：排行榜需要 1. 2. 3. 的红色序号，
 * 而不是统一的圆点。行结构与 `.mg-list` 保持一致，保证纵向节奏不变。
 */
function DownloadPanel() {
  return (
    <Panel title="下载排行" extra={<MoreLink to="/download" />}>
      <ol className="mg-home__rank">
        {DOWNLOAD_ROWS.map((row, i) => (
          <li key={row.id} className="mg-home__item">
            <div className="mg-home__item-main mg-home__rank-row">
              <span className="mg-home__rank-no">{i + 1}</span>
              <span className="mg-list__text" title={row.title}>
                <Link to={row.href ?? '#'}>{row.title}</Link>
              </span>
              {row.date && <span className="mg-list__date">{row.date}</span>}
            </div>
            {row.remark && <div className="mg-home__remark">{row.remark}</div>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/* ================= VIII. 底部整行 ================= */

/** 底部四栏区：左 360 / 中两列自适应 / 右 300 */
export function BottomPanels() {
  return (
    <div className="mg-home__bottom">
      <div className="mg-home__bottom-left">
        <HotServicesPanel />
        <LocalStationsPanel />
      </div>

      <div className="mg-home__bottom-center">
        <div className="mg-home__bottom-col">
          <GovPanel />
          <PolicyReadPanel />
        </div>
        <div className="mg-home__bottom-col">
          <PartyPanel />
          <FaqPanel />
        </div>
      </div>

      <div className="mg-home__bottom-right">
        <ActivityPanel />
        <DownloadPanel />
      </div>
    </div>
  );
}

export default BottomPanels;
