/**
 * 地方频道首页
 *
 * I. 页面结构
 *
 * 1. 主区顶部：方格地图（点击任一州直接进入该州分站）
 * 2. 地图下方：参考图指定的 6 个热门分站入口 + 「更多州»
 * 3. 分站列表：可搜索、可按热度/字母/加入联邦时间排序的表格，带分页
 * 4. 「州长活动」tab：按日期倒序排列的州长活动
 *
 * II. 交互说明
 *
 * 1. 地图点击走真实路由跳转（/local/<CODE>），因此新窗口打开、刷新、分享链接都成立
 * 2. 搜索与排序即时生效，并自动回到第 1 页
 * 3. 空态不是"暂无数据"，而是明确告知本频道一共收录了多少个分站
 *
 * @module pages/local/LocalPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useRef, useState } from 'react';
import { Crumbs, Pager, Panel, TabBar } from '@/components/ui';
import { USMapGrid } from '@/components/art';
import { Link, navigate } from '@/router';
import { findLeader } from '@/data/leaders';
import { formatNumber } from '@/data/stats';
import {
  GOVERNOR_ACTIVITIES,
  HOT_STATE_CODES,
  STATES,
  STATE_TOTAL,
  hotStates,
  statesByHeat,
} from '@/data/states';

/** 分站表格每页条数 */
const PAGE_SIZE = 12;

/** 排序方式 */
type SortKey = 'heat' | 'alpha' | 'admitted';

const SORT_LABEL: Record<SortKey, string> = {
  heat: '按分站热度排序',
  alpha: '按字母顺序排序',
  admitted: '按加入联邦时间排序',
};

export interface LocalPageProps {
  /** 路由 /local/governor 会显式传入 'governor' */
  tab?: string;
  [key: string]: string | undefined;
}

export default function LocalPage(props: LocalPageProps) {
  const isGovernor = props.tab === 'governor';

  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('heat');
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement | null>(null);

  // I. 过滤 + 排序：全部在内存里完成，51 条数据不需要请求后端
  const rows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const filtered = kw
      ? STATES.filter((s) =>
          [s.name, s.code, s.nameEn, s.capital, s.nickname].join(' ').toLowerCase().includes(kw)
        )
      : [...STATES];

    switch (sort) {
      case 'alpha':
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
      case 'admitted':
        return filtered.sort((a, b) => a.admitted.localeCompare(b.admitted));
      default:
        return filtered.sort((a, b) => b.heat - a.heat);
    }
  }, [keyword, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hot = hotStates(6);
  const top10 = statesByHeat().slice(0, 10);
  const texasCount = GOVERNOR_ACTIVITIES.filter((a) => a.location === '得克萨斯州').length;

  const scrollToList = () => {
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '地方频道', to: '/local' },
          { label: isGovernor ? '州长活动' : '各州分站' },
        ]}
      />

      <div className="mg-layout-2col">
        {/* ---------------- 左栏 ---------------- */}
        <div className="mg-layout__side">
          <Panel
            title="分站热度榜"
            variant="navy"
            extra={<span className="mg-local-mini">前 10 名</span>}
          >
            {top10.map((s, i) => (
              <Link key={s.code} to={`/local/${s.code}`} className="mg-local-rank__row">
                <span className={`mg-local-rank__no${i === 0 ? ' is-top' : ''}`}>{i + 1}</span>
                <span className="mg-local-rank__name">{s.name}</span>
                <span className="mg-local-rank__heat">{formatNumber(s.heat)}</span>
              </Link>
            ))}
            <div className="mg-local-note">
              热度统计口径为分站页面浏览量。同一用户多次访问按多次计算，不同用户同一次访问亦按多次计算。
            </div>
          </Panel>

          <Panel title="分站数据说明">
            <div className="mg-local-note">
              本频道共收录分站 {STATE_TOTAL} 个，含 50 个州与首都特区。各州首府、加入联邦日期、
              昵称按公开资料填写；分站热度与办件量为本站虚构数据。
            </div>
            <div className="mg-local-note">
              本周例行维护分站：全部 {STATE_TOTAL} 个。维护窗口为周一 00:00 至周日 24:00。
              维护期间分站可正常访问，仅"数据更新"功能暂停。
            </div>
          </Panel>

          <Panel title="值班信息">
            <div className="mg-local-note">
              今日值班分站：{hot[0]?.name ?? '华盛顿哥伦比亚特区'}。值班电话 1776-2026，
              该号码不存在，请勿拨打。
            </div>
            <div className="mg-local-note">
              地方频道业务咨询请按 3，分站业务咨询请按 4。按键 3 与按键 4 目前均无法接通。
            </div>
          </Panel>
        </div>

        {/* ---------------- 主区 ---------------- */}
        <div className="mg-layout__main">
          <Panel
            title="地方频道"
            variant="red"
            extra={<span className="mg-local-mini">共 {STATE_TOTAL} 个分站</span>}
          >
            <TabBar
              tabs={[
                { key: 'states', label: '各州分站', count: STATE_TOTAL },
                { key: 'governor', label: '州长活动', count: GOVERNOR_ACTIVITIES.length },
              ]}
              active={isGovernor ? 'governor' : 'states'}
              onChange={(key) => navigate(key === 'governor' ? '/local/governor' : '/local')}
            />

            {isGovernor ? (
              <>
                <div className="mg-local-listhead">
                  <span>州长活动共 {GOVERNOR_ACTIVITIES.length} 条 · 按活动日期倒序排列</span>
                  <span className="mg-local-listhead__blurb">
                    活动信息由各州分站报送，本频道仅作汇编，不对活动内容作解释。
                  </span>
                </div>
                {GOVERNOR_ACTIVITIES.map((a) => {
                  const leader = findLeader(a.leaderId);
                  return (
                    <div className="mg-local-act" key={a.id}>
                      <span className="mg-local-act__date">{a.date}</span>
                      <div className="mg-local-act__body">
                        <div className="mg-local-act__title">{a.title}</div>
                        <div className="mg-local-act__meta">
                          {leader ? `${leader.title} · ` : ''}
                          {a.location}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mg-local-note">
                  本条列表共 {GOVERNOR_ACTIVITIES.length} 条，其中涉及同一个州的活动 {texasCount} 条，
                  已按日期顺序合并展示，不再按州分册。
                </div>
              </>
            ) : (
              <>
                {/* 方格地图 */}
                <div className="mg-local-section">地方分站方格地图</div>
                <div className="mg-tilemap mg-local-map">
                  <USMapGrid
                    interactive
                    cell={42}
                    highlight={HOT_STATE_CODES}
                    onSelect={(code) => navigate(`/local/${code}`)}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
                <div className="mg-local-map__hint">
                  点击任一方格进入该州分站。方格按相对位置排布，不代表各州实际面积与形状；
                  红色方格为热门分站。
                </div>

                {/* 热门分站入口 */}
                <div className="mg-local-section">热门分站入口</div>
                <div className="mg-grid mg-grid--6 mg-local-hot">
                  {hot.map((s) => (
                    <Link key={s.code} to={`/local/${s.code}`} className="mg-local-card">
                      <div className="mg-local-card__code">{s.code}</div>
                      <div className="mg-local-card__name">{s.name}</div>
                      <div className="mg-local-card__meta">首府 {s.capital}</div>
                      <div className="mg-local-card__heat">{formatNumber(s.heat)}</div>
                    </Link>
                  ))}
                </div>
                <div className="mg-local-more">
                  <a
                    href="#/local"
                    className="mg-more"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToList();
                    }}
                  >
                    更多州
                  </a>
                </div>

                {/* 分站检索 */}
                <div className="mg-local-listhead" ref={listRef}>
                  <span>
                    分站列表共 {rows.length} 个{keyword.trim() ? '（已按关键词筛选）' : ''}
                  </span>
                  <span className="mg-local-listhead__blurb">
                    排序与筛选在本地完成，不产生新的办件。
                  </span>
                </div>
                <div className="mg-local-toolbar">
                  <span className="mg-local-toolbar__label">分站检索</span>
                  <input
                    className="mg-input mg-local-toolbar__input"
                    placeholder="输入州名、缩写、首府或昵称"
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                      setPage(1);
                    }}
                  />
                  <select
                    className="mg-select mg-local-toolbar__select"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortKey);
                      setPage(1);
                    }}
                  >
                    {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                      <option key={k} value={k}>
                        {SORT_LABEL[k]}
                      </option>
                    ))}
                  </select>
                  <span className="mg-local-toolbar__count">当前排序：{SORT_LABEL[sort]}</span>
                </div>

                {pageRows.length === 0 ? (
                  <div className="mg-empty">
                    <div className="mg-empty__icon">※</div>
                    <div>
                      未找到匹配「{keyword.trim()}」的分站。本频道共收录 {STATE_TOTAL} 个分站，
                      其中没有一个是该关键词对应的分站。
                    </div>
                    <div className="mg-local-empty__action">
                      <a
                        href="#/local"
                        className="mg-more"
                        onClick={(e) => {
                          e.preventDefault();
                          setKeyword('');
                          setPage(1);
                        }}
                      >
                        清空关键词
                      </a>
                    </div>
                  </div>
                ) : (
                  <table className="mg-table mg-table--compact">
                    <thead>
                      <tr>
                        <th>州名</th>
                        <th>缩写</th>
                        <th>首府</th>
                        <th>昵称</th>
                        <th>加入联邦</th>
                        <th>分站热度</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((s) => (
                        <tr key={s.code}>
                          <td>{s.name}</td>
                          <td>{s.code}</td>
                          <td>{s.capital}</td>
                          <td>{s.nickname}</td>
                          <td>{s.admitted}</td>
                          <td>{formatNumber(s.heat)}</td>
                          <td>
                            <Link to={`/local/${s.code}`}>进入分站</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <Pager
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={rows.length}
                  onChange={setPage}
                />
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
