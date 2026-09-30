/**
 * 首页右栏（300px）
 *
 * I. 组成（自上而下，与参考图一致）
 *
 * 1. 「让美国再次伟大 / —更好的公共服务—」人物横幅
 * 2. 「公告公示」面板 —— 5 条带日期
 * 3. 「我为美利坚建言献策」红色横幅 + 立即参与按钮
 * 4. 「办事统计」面板 —— 4 行大号红色数字
 *
 * II. 统计数字的实现
 *
 * 「今日受理」绑定全局 `todayCount`（`useApp()`），由 AppProvider 每 1.8 秒
 * 自增 1～4，永不回落。把 `useApp()` 放在本组件内调用而不是由 HomePage 透传，
 * 可以把每 1.8 秒一次的重渲染限制在这一棵子树内。
 *
 * @module pages/home/RightRail
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { ServiceIcon } from '@/components/art';
import { MoreLink, Panel, StatRow } from '@/components/ui';
import { useApp } from '@/app-context';
import { ASSETS } from '@/data/assets';
import { formatTodayCount, NOTICE_ROWS, STAT_NOTE, VISITOR_COUNTER } from '@/data/home';
import { formatNumber, HOME_STATS } from '@/data/stats';
import { Link } from '@/router';
import { HomeList } from './HomeList';

/**
 * 按标签从全站统计真源取展示串
 *
 * 用标签查找而不是下标，避免 `stats.ts` 调整顺序时首页悄悄换成另一个数字。
 */
function statText(label: string, decimal = false): string {
  const found = HOME_STATS.find((s) => s.label === label);
  return found ? formatNumber(found.value, decimal) : '—';
}

export function RightRail() {
  // I. 实时统计：今日受理量只增不减
  const { todayCount } = useApp();

  return (
    <aside className="mg-home__right">
      {/* ① 让美国再次伟大 */}
      <Link to="/speech" className="mg-home__trump">
        <img className="mg-home__trump-img" src={ASSETS.trumpPortrait} alt="让美国再次伟大" />
        <span className="mg-home__trump-text">
          <span className="mg-home__trump-title">让美国再次伟大</span>
          <span className="mg-home__trump-sub">— 更好的公共服务 —</span>
        </span>
        <span className="mg-home__trump-arrow">›</span>
      </Link>

      {/* ② 公告公示 */}
      <Panel title="公告公示" extra={<MoreLink to="/gov" />}>
        <HomeList rows={NOTICE_ROWS} />
      </Panel>

      {/* ③ 我为美利坚建言献策 */}
      <div className="mg-home__advice">
        <div className="mg-home__advice-title">
          我为美利坚
          <br />
          建言献策
        </div>
        <Link to="/interact" className="mg-btn mg-btn--gold mg-home__advice-btn">
          立即参与 »
        </Link>
      </div>

      {/* ④ 办事统计 */}
      <Panel title="办事统计" extra={<MoreLink to="/service/records" />}>
        <StatRow
          icon={<ServiceIcon name="shield" width={18} height={18} />}
          label="今日受理"
          value={formatTodayCount(todayCount)}
          unit="件"
        />
        <StatRow
          icon={<ServiceIcon name="tax" width={18} height={18} />}
          label="累计下载表格"
          value={statText('累计下载表格')}
          unit="次"
        />
        <StatRow
          icon={<ServiceIcon name="passport" width={18} height={18} />}
          label="注册用户"
          value={statText('注册用户')}
          unit="人"
        />
        <StatRow
          icon={<ServiceIcon name="medicare" width={18} height={18} />}
          label="群众满意度"
          value={statText('群众满意度', true)}
          unit="%"
        />
        <div className="mg-home__stat-note">{STAT_NOTE}</div>
      </Panel>

      {/* ⑤ 访问量计数器：把右栏补齐到与左栏齐平，顺便留一个上世纪的笑点 */}
      <div className="mg-home__counter">
        <div className="mg-home__counter-row">
          <span className="mg-home__counter-label">{VISITOR_COUNTER.label}</span>
          <span className="mg-home__counter-digits">
            {VISITOR_COUNTER.digits.split('').map((d, i) => (
              <span key={`${d}-${i}`} className="mg-home__counter-digit">
                {d}
              </span>
            ))}
          </span>
          <span className="mg-home__counter-label">{VISITOR_COUNTER.unit}</span>
        </div>
        <div className="mg-home__counter-note">{VISITOR_COUNTER.note}</div>
      </div>
    </aside>
  );
}

export default RightRail;
