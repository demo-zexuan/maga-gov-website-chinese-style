/**
 * 首页
 *
 * I. 页面结构（与参考图逐区块对应）
 *
 * 1. 主体三栏 `.mg-home__body`
 *    (1) 左 218px —— 伟大的美国梦 / 团结·创新·服务 / 移动端 APP / 致敬退伍军人
 *    (2) 中 自适应 —— 轮播（5 张，自动播放 5 秒）+ 头条区与三个选项卡列表
 *    (3) 右 300px —— 让美国再次伟大 / 公告公示 / 建言献策 / 办事统计
 * 2. 底部四栏 `.mg-home__bottom`
 *    (1) 左 360px —— 热门服务（8 格）+ 地方分站（方格地图）
 *    (2) 中 两列 —— 政务公开 + 政策解读 ｜ 党建引领 + 常见问题
 *    (3) 右 300px —— 领导活动 + 下载排行
 * 3. 页脚上方的公告走马灯
 *
 * II. 黑色幽默落点
 *
 * 页面共埋 10 处，全部写在 `@/data/home` 的注释里并标注了位置；
 * 本站的笑点不靠语气，靠可核实的数字与自相矛盾的规则。
 *
 * III. 注意
 *
 * 站标、主导航、页脚由 `Shell` 提供，本页不重复实现，也不额外包一层容器。
 *
 * @module pages/home/HomePage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Marquee } from '@/components/ui';
import { MARQUEE_NOTICES } from '@/data/notices';
import { BottomPanels } from './BottomPanels';
import { Carousel } from './Carousel';
import { LeftRail } from './LeftRail';
import { RightRail } from './RightRail';
import { TopStory } from './TopStory';

export default function HomePage(_props?: Record<string, unknown>) {
  return (
    <div className="mg-home">
      <div className="mg-home__body">
        <LeftRail />

        <div className="mg-home__center">
          <div className="mg-home__stage">
            <Carousel />
            <TopStory />
          </div>
        </div>

        <RightRail />
      </div>

      <BottomPanels />

      {/* 走马灯直接复用全站公告真源（其 href 已是 /notice/:id） */}
      <Marquee label="公告" items={MARQUEE_NOTICES} />
    </div>
  );
}
