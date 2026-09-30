/**
 * 首页头条区（轮播右侧）
 *
 * I. 组成
 *
 * 1. 红色方块角标「重磅」，两行竖排（46×46）。
 * 2. 居中大标题，24px 红色加粗。
 * 3. 4 条副链接，横排居中，下方带一条版面说明小字（黑色幽默落点）。
 * 4. 紧接其下的「最新文件 / 要闻动态 / 国务院动态」选项卡列表，各 8 条。
 *
 * II. 为什么头条与列表放在同一个组件里
 *
 * 参考图中这两块共用同一个外框（只有一条外边框，头条在下沿直接接选项卡），
 * 拆开会让边框出现双线，因此在此合并为一块「上标题、下列表」的复合面板。
 *
 * @module pages/home/TopStory
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { TabBar } from '@/components/ui';
import { CENTER_TABS, TOP_STORY } from '@/data/home';
import { Link } from '@/router';
import { HomeList } from './HomeList';

export function TopStory() {
  // I. 选项卡状态：默认停在「最新文件」，与参考图一致
  const [active, setActive] = useState(CENTER_TABS[0].key);
  const group = CENTER_TABS.find((g) => g.key === active) ?? CENTER_TABS[0];

  // II. 「重磅」竖排：逐字换行，避免依赖 writing-mode 在不同浏览器的差异
  const badgeChars = TOP_STORY.badge.split('');

  return (
    <div className="mg-home__stage-right">
      <div className="mg-home__topnews">
        {/* 角标与标题同一行：角标在左，标题在剩余宽度内居中 */}
        <div className="mg-home__topnews-head">
          <div className="mg-home__bigbadge">
            {badgeChars.map((c, i) => (
              <span key={`${c}-${i}`}>{c}</span>
            ))}
          </div>

          <h2 className="mg-home__topnews-title">
            <Link to="/news">{TOP_STORY.title}</Link>
          </h2>
        </div>

        {/* 副链接独占整行宽度，才能像参考图那样排成一行 */}
        <div className="mg-home__topnews-links">
          {TOP_STORY.links.map((l) => (
            <Link key={l.label} to={l.to}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mg-home__topnews-note">{TOP_STORY.footnote}</div>
      </div>

      <div className="mg-home__doctabs">
        <TabBar
          className="mg-home__tabbar"
          tabs={CENTER_TABS.map((g) => ({ key: g.key, label: g.label }))}
          active={active}
          onChange={setActive}
        />
        <Link to="/gov/policy" className="mg-home__tab-close" aria-label="关闭本栏目">
          ×
        </Link>
        <HomeList rows={group.rows} />
      </div>
    </div>
  );
}

export default TopStory;
