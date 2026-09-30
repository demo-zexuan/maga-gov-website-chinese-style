# 开发团队统一简报（TEAM BRIEF）

> 本文件是所有 Sub 的**唯一共同上下文真源**。开工前必须完整读一遍；本文件由 Lead 维护，Sub 不要修改。

---

## I. 项目是什么

一个 **纯搞笑 / 讽刺性质的静态网站**，把「特朗普 MAGA 视觉风格」和「2008 年前后中国县级政府门户网站的信息架构与美工质感」强行缝合在一起。

**核心要求：**

1. 首页必须高度还原参考图（`docs/reference-layout.md` 有逐区块拆解）。
2. 11 个主导航栏目**全部**要有真实可用的页面，不是占位。
3. 要有**足够多的小点和黑色幽默故事**——这是本项目的灵魂，不是装饰。
4. **不包含任何政治倾向。** 全站是对"官僚系统本身"的善意调侃（表格、流程、热线、满意度调查、永远在维护的系统），不是对任何国家、政党、个人的攻击。

**免责基调：** 所有数据、文号、人物、讲话、电话均为虚构。站点页脚与"关于我们"页必须显式声明这一点。

---

## II. 技术栈与硬约束

| 项 | 值 |
|---|---|
| 框架 | React 19 + TypeScript（strict） |
| 构建 | Vite 6，产物 `dist/` |
| 路由 | 自研 hash 路由 `@/router`（**不要引入 react-router**） |
| 样式 | 手写 CSS，`src/styles/*.css`，**不要引入 Tailwind / CSS-in-JS** |
| 依赖 | **禁止新增任何 npm 依赖**，只能用 `react` / `react-dom` |
| 部署 | Cloudflare Workers 静态资源 |

**绝对禁止：**
- 新增 npm 依赖
- 新建 CSS 文件（样式追加到 `src/styles/pages.css` 末尾的「模块扩展区」）
- 修改 `src/App.tsx` / `src/router.tsx` / `src/main.tsx` / `src/components/shell/index.tsx` / `src/components/ui/index.tsx` / `src/components/art/index.tsx` / `src/data/site.ts` / `src/data/types.ts` / `src/styles/tokens.css`
- 使用 `border-radius`（全站直角，这是古早网站最重要的视觉指纹）
- 使用现代柔和阴影、渐变玻璃、圆角卡片、大留白
- 使用 emoji 作为**正文内容**（图标位除外）

---

## III. 设计语言速查

### 颜色（必须用 `var(--token)`，不得硬编码色值）

```
--c-red          #bd0000   政务红，标题栏/按钮/强调
--c-red-deep     #8b0000
--c-red-tint     #fff5f5   hover 底色
--c-navy         #0d2a52   藏青，导航/次级标题
--c-navy-light   #1c4b8a
--c-gold         #f5c542   旗金，MAGA 强调
--c-link         #1a4d8f   链接蓝
--c-link-visited #6a3d9a   已访问链接（紫色，古早特征，保留）
--c-orange       #e8641a   日期/提醒
--c-text         #222
--c-text-muted   #7a7a7a
--c-border       #c9c9c9
--c-panel-head   linear-gradient(180deg,#fdfdfd,#eef1f5 45%,#dfe4ea)  面板标题栏
--c-panel-head-red   linear-gradient(180deg,#d5232b,#b40000)
--c-panel-head-navy  linear-gradient(180deg,#26558f,#14335f)
```

### 字体与字号

```
--font-song  "SimSun","宋体","Songti SC",serif     正文（宋体是灵魂）
--font-hei   "Microsoft YaHei","PingFang SC",sans-serif  标题/导航
--font-num   "Times New Roman",serif               数字/英文

基准字号 12px。13px 列表，14-15px 小标题，24px 文章标题，42px 站标。
```

### 布局

```
--layout-width: 1400px      #root min-width 同值
左栏 218px / 中栏自适应 / 右栏 300px  ← 首页与内页统一栅格
```

---

## IV. 可直接复用的组件

全部从 `@/components/ui` 导入（`src/components/ui/index.tsx`）：

```tsx
import {
  Panel,      // 面板：{ title, extra, variant:'default'|'red'|'navy', flush, children }
  MoreLink,   // 标题栏右侧「更多»」
  TabBar,     // 选项卡：{ tabs:[{key,label,count?}], active, onChange }
  NewsList,   // 列表：{ items:[{id,title,date?,badge?,badgeTone?,href?}], showDate?, showBullet?, headlineFirst? }
  Badge,      // 角标：{ tone:'red'|'gold'|'navy'|'green'|'outline', round? }
  Modal,      // 弹窗：{ open, title, onClose, width?, footer? }
  Marquee,    // 走马灯：{ label, items }
  StatRow,    // 统计行：{ icon?, label, value, unit? }
  Pager,      // 分页：{ page, totalPages, onChange, totalItems? }
  Crumbs,     // 面包屑：{ items:[{label,to?}] }
  Alert,      // 提示条：{ tone:'yellow'|'red'|'gray' }
  Progress,   // 进度条：{ percent, red? }
  Loading,    // 加载态
  Button,     // 按钮：{ variant:'default'|'primary'|'gold', size:'sm'|'md'|'lg' }
  Field,      // 表单行：{ label, required?, hint?, error? }
  useTypewriter, // 打字机 hook：useTypewriter(text, speed, enabled)
} from '@/components/ui';
```

路由与全局状态：

```tsx
import { Link, navigate, useRoute, useIsActive, matchAny } from '@/router';
import { useApp } from '@/app-context';
// useApp() => { user, login, logout, elderMode, toggleElderMode, a11yMode, toggleA11y,
//               searchKeyword, setSearchKeyword, toasts, pushToast, dismissToast, todayCount }
```

美术资源从 `@/components/art` 导入：

```tsx
import {
  GreatSeal, FlagScene, LibertyScene, EagleEmblem, ElephantEmblem,
  CapitolSilhouette, USMapGrid, US_TILE_MAP, ServiceIcon, IconHome, IconPrev, IconNext, IconSearch,
} from '@/components/art';
// <ServiceIcon name="shield" /> name 取值：
// shield passport gun tax medicare license subsidy refund
// house car baby business pet marriage veteran school
```

共享数据：

```tsx
import { SITE, NAV_ITEMS, FOOTER_LINKS, TOPBAR_LINKS, DISCLAIMER, todayCn, lunarCn, dcWeather } from '@/data/site';
import { SERVICES, HOT_SERVICES, findService, servicesByScope } from '@/data/services';
import { HOME_STATS, EXTRA_STATS, DOWNLOAD_RANKING, CASE_RANKING, formatNumber, formatCn } from '@/data/stats';
import { NOTICES, MARQUEE_NOTICES, findNotice } from '@/data/notices';
import { LEADERS, ACTIVITIES, findLeader } from '@/data/leaders';
import type { Article, ServiceItem, Notice, Faq, DownloadItem, Leader, ActivityItem, LetterItem, StateInfo, StatEntry } from '@/data/types';
```

---

## V. 页面骨架：每个页面的标准写法

```tsx
/**
 * <页面名>
 *
 * <这个页面是干什么的、有什么梗>
 *
 * @module pages/<module>/<File>
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Crumbs, Panel, MoreLink } from '@/components/ui';
import { useRoute } from '@/router';

export default function XxxPage() {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '栏目名', to: '/xxx' }, { label: '当前页' }]} />
      <Panel title="标题" extra={<MoreLink to="/xxx" />}>
        …
      </Panel>
    </div>
  );
}
```

**注意：** `Shell`（顶部工具条 + 站标 + 导航 + 页脚）已经由 `App.tsx` 包好了，页面**不要**再包一层。

页面首选栅格类：`.mg-layout-3col`（`> .mg-layout__left/.mg-layout__main/.mg-layout__right`）、`.mg-layout-2col`（`> .mg-layout__side/.mg-layout__main`）。
其他可复用类：`.mg-grid--2/3/4/5/6`、`.mg-chip`、`.mg-kpi`、`.mg-sec-title`、`.mg-empty`、`.mg-sidenav`、`.mg-steps`、`.mg-article`、`.mg-result`、`.mg-letter`、`.mg-dl-row`、`.mg-party-quote`、`.mg-banner-card`、`.mg-dream-card`、`.mg-tilemap`。

---

## VI. 内容写作规范（最重要的一节）

### 1. 语气

**必须**是标准公文语气：四平八稳、被动语态、名词化、层层限定。荒谬必须藏在**具体细节和数字**里，不能靠语气抖机灵。

✅ 好：
> 系统显示您已累计缴费 4,180 个月份。请注意，您今年 34 岁。

> 升级窗口：每周一至周五 09:00-17:00，周六、周日 00:00-24:00。

> 线上更新已开通，请到现场办理。

> 本调查已连续开展 12 年，累计满意度 99.8%，是该指标自设立以来唯一未出现过波动的年份区间。

❌ 差：
> 这系统真是绝了！😂
> 你猜怎么着？又要排队！

### 2. 禁用

- 感叹号（全文最多在"紧急通知"标题里出现 1 次）
- emoji（图标位除外）
- 网络流行语、缩写、拼音缩写
- 直接点名攻击真实政治人物 / 国家 / 群体
- 性、暴力、歧视内容

### 3. 黑色幽默母题库（Sub 请从这里取材，不要重复别处用过的）

| 母题 | 用法示例 |
|---|---|
| 永远在维护 | 维护窗口覆盖全天，唯一不在维护的时间是维护时间 |
| 表格地狱 | 1,147 种表格；需要的表格尚未被发明；第 3 页需另行索取 |
| 满意度调查 | 三个选项都是"满意"；12 年零波动 |
| 只增不减的数字 | 今日受理量每 1.8 秒上涨，永不回落 |
| 热线打不通 | 热线号码不存在；占线请挂机重拨，不提供回拨 |
| 一次办结 / 最多跑一次 | 达成率 99.1%，剩下 0.9% 是全部真实用户 |
| 长到离谱的时限 | 住房轮候预计 2173 年轮到 |
| 自我矛盾的规则 | 结婚当日生效，离婚最早可预约 14 个月后 |
| 两个系统不互通 | 新旧平台账号不互通，办件数据不互认 |
| 惠及全民的政策 | 补贴标准 0 至 1,200 美元，绝大多数属前者 |
| 验收/考核 | 上级要求"零投诉"，于是取消了投诉入口 |
| 领导视察 | 视察当天系统格外流畅，第二天恢复 |
| 文件落实文件 | 关于转发《关于贯彻落实……的通知》的通知的通知 |

### 4. 每个模块的幽默配额

- 每个列表页：至少 3 处"正文里的荒谬细节"
- 每个详情页：至少 1 个可以独立截图的"金句"
- 每个交互页：至少 1 个"操作后给出意料之外但完全合理的反馈"
- 每个空态/错误态：必须有一句冷幽默（如「暂无数据。本栏目自 2019 年起无新内容。」）

---

## VII. 交付纪律

1. **只改你被分配的文件**（见任务里的 write scope）。别人的文件不要碰。
2. 完成后必须本地验证：
   ```bash
   cd /Users/zexuan.peng/Content/maga-gov-website-chinese-style
   npx tsc -b --pretty false     # 必须 0 error
   pnpm run build                # 必须成功
   ```
3. 文件头注释、函数注释按 AGENTS.md 的**层次序号规范**（I. / 1. / (1) / i.）书写，全中文，`@author zexuan.peng`。
4. 提交前自查：`grep -n "border-radius" <你的文件>` 必须为空（`art/` 里的 SVG 除外）。
5. 完成后在 shared task 上 `complete`，并给 Lead 发一条**简短**消息：改了什么文件 / 验证命令与结果 / 已知问题。

---

## VIII. 参考图区块索引

`docs/reference-layout.md` 包含首页 14 个区块的逐块拆解（位置、尺寸、内容、文案）。
首页负责人 `home` 必须对照实现；其他 Sub 需要了解整体气质时也应读一遍。
