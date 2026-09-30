/**
 * 党建引领栏目左栏导航
 *
 * I. 内容
 *
 * 1. 栏目树：党建要闻 / 理论学习 / 先进典型 / 廉政建设（带条目数）
 * 2. 党建考核指标面板：全部指标均为满分或接近满分
 * 3. 组织概况面板：党员、支部、发展党员指标完成情况
 *
 * II. 设计说明
 *
 * 1. 栏目树使用全站统一的 .mg-sidenav 样式，激活项由路由决定，
 *    本身不持有状态，保证直接输入 URL 打开时高亮正确。
 * 2. 考核指标面板是左栏的笑点所在：指标名称都很严肃，数值都很完美，
 *    最后一行小字说明"数据来源为本局自报"。
 *
 * @module pages/party/PartySideNav
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Link } from '@/router';
import { Panel } from '@/components/ui';
import { PARTY_METRICS, PARTY_TABS } from '@/data/party';
import type { PartyTabKey } from '@/data/party';

export default function PartySideNav({ active }: { active: PartyTabKey }) {
  return (
    <div>
      {/* I. 栏目树 */}
      <nav className="mg-sidenav" aria-label="党建引领栏目导航">
        <div className="mg-sidenav__head">党建引领</div>
        {PARTY_TABS.map((t) => (
          <Link
            key={t.key}
            to={t.path}
            className={`mg-sidenav__item${t.key === active ? ' is-active' : ''}`}
          >
            {t.label}
            <span className="mg-party-nav__count">（{t.articles.length}）</span>
          </Link>
        ))}
        <Link to="/sitemap" className="mg-sidenav__item">
          网站地图
          <span className="mg-party-nav__count">（全部栏目）</span>
        </Link>
      </nav>

      {/* II. 考核指标 */}
      <Panel title="党建考核指标" variant="navy">
        <div className="mg-party-metrics">
          {PARTY_METRICS.map((m) => (
            <div className="mg-party-metrics__row" key={m.label}>
              <span className="mg-party-metrics__label">{m.label}</span>
              <span className="mg-party-metrics__value">
                {m.decimal ? m.value.toFixed(1) : m.value}
                <span className="mg-party-metrics__unit">{m.unit}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mg-party-metrics__note">
          数据来源：本局自报。自报数据与实际数据不一致的，以自报数据为准，并在备注栏记录差异说明。
        </div>
      </Panel>

      {/* III. 组织概况 */}
      <Panel title="组织概况">
        <div className="mg-party-metrics">
          <div className="mg-party-metrics__row">
            <span className="mg-party-metrics__label">党支部</span>
            <span className="mg-party-metrics__value">
              38<span className="mg-party-metrics__unit">个</span>
            </span>
          </div>
          <div className="mg-party-metrics__row">
            <span className="mg-party-metrics__label">在编党员</span>
            <span className="mg-party-metrics__value">
              1,204<span className="mg-party-metrics__unit">名</span>
            </span>
          </div>
          <div className="mg-party-metrics__row">
            <span className="mg-party-metrics__label">本年度发展党员</span>
            <span className="mg-party-metrics__value">
              2<span className="mg-party-metrics__unit">名 / 指标 2 名</span>
            </span>
          </div>
          <div className="mg-party-metrics__row">
            <span className="mg-party-metrics__label">先锋岗命名</span>
            <span className="mg-party-metrics__value">
              46<span className="mg-party-metrics__unit">个</span>
            </span>
          </div>
        </div>
        <div className="mg-party-metrics__note">
          本面板数据每年更新一次。上次更新 2026-01-04，下次更新 2027-01-04。
        </div>
      </Panel>
    </div>
  );
}
