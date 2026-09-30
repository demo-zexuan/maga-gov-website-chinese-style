/**
 * 首页列表渲染器
 *
 * I. 为什么要单独写一层
 *
 * 1. `@/components/ui` 的 `NewsList` 已经覆盖了「圆点 + 标题 + 右对齐日期」的标准形态，
 *    所以没有备注的行一律直接复用它，保证与全站列表节奏完全一致。
 * 2. 首页需要一种额外的形态：标题下方带一行小字备注（黑色幽默的落点）。
 *    `NewsList` 不支持嵌套备注，因此这里在「有备注」时才走自定义分支，
 *    并且**逐类名复用** `mg-list*` 系列样式，避免出现第二套列表视觉。
 *
 * II. 结构约定
 *
 * 1. 每个条目是「外层 li（负责下划虚线）+ 内层标准行（`mg-list__item`）」。
 * 2. 备注不放在标准行内部，而是作为标准行的兄弟节点。
 *    原因：`.mg-list__item` 一旦允许 `flex-wrap`，浏览器会用标题的完整内容宽度
 *    参与断行计算，导致日期被挤到第二行；把备注移到行外，标准行就能保持
 *    「不换行 + 省略号」的既定行为。
 *
 * @module pages/home/HomeList
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { NewsList } from '@/components/ui';
import type { HomeRow } from '@/data/home';
import { Link } from '@/router';

export interface HomeListProps {
  rows: HomeRow[];
  /** 是否显示右侧日期列，默认显示 */
  showDate?: boolean;
  /** 自定义类名，透传给根节点 */
  className?: string;
}

/** 首页通用列表：无备注时复用 NewsList，有备注时在行下追加一行小字 */
export function HomeList({ rows, showDate = true, className = '' }: HomeListProps) {
  // I. 全部行都没有备注 —— 交给全站通用列表组件，零分叉
  if (!rows.some((r) => r.remark)) {
    return (
      <NewsList
        className={className}
        showDate={showDate}
        items={rows.map((r) => ({ id: r.id, title: r.title, date: r.date, href: r.href }))}
      />
    );
  }

  // II. 存在备注行 —— 使用同样的类名手工铺一遍，额外多一个备注槽位
  return (
    <ul className={`mg-list ${className}`}>
      {rows.map((r) => (
        <li key={r.id} className="mg-home__item">
          <div className="mg-list__item mg-home__item-main">
            <span className="mg-list__bullet">•</span>
            <span className="mg-list__text" title={r.title}>
              <Link to={r.href ?? '#'}>{r.title}</Link>
            </span>
            {showDate && r.date && <span className="mg-list__date">{r.date}</span>}
          </div>
          {r.remark && <div className="mg-home__remark">{r.remark}</div>}
        </li>
      ))}
    </ul>
  );
}

export default HomeList;
