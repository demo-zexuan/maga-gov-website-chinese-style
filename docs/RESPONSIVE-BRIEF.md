# 移动端适配简报（RESPONSIVE BRIEF）

> 由 Lead 维护。各模块负责人在动手前完整读一遍。与 `docs/TEAM-BRIEF.md` 冲突时，以本文为准（本文更新）。

---

## I. 背景

站点原本是**故意锁死 1400px 桌面宽度**的（`viewport=width=1400` + `#root{min-width:1400px}`），为的是像素级还原参考图。现在用户要求补上移动端适配。

Lead 已完成地基改造：

1. `index.html` → 标准响应式 viewport
2. `base.css` → `#root` 仅在 ≥1400px 时锁 1400px；容器改为 `width:100%; max-width:1400px`
3. `shell.css` → 全部外壳容器改流式；新增顶栏照片层与汉堡按钮样式
4. `responsive.css`（**新增，Lead 维护**）→ 外壳 + 通用组件的响应式
5. `src/styles/responsive/<module>.css`（**新增，11 个桩文件**）→ 各模块专属适配，已由 Lead 建好并在 `main.tsx` 注册

**你的工作就是填你自己那个文件。**

---

## II. 断点（统一，不要新增）

```
≥1400px         参考图还原区 —— 绝对不许动
≤1399px         紧凑桌面：侧栏收窄
≤1023px         平板：三栏 → 主栏满宽 + 侧栏两列；导航转汉堡
≤767px          手机：全部单列；表格横向滚
≤420px          小屏手机
```

---

## III. 三条硬约束

### 1. 不许碰 ≥1400px 的桌面观感

这是本项目的立身之本。你写的所有规则**必须**包在 `@media (max-width: ...)` 里，且选择器只作用于你自己的模块。

验证方法：改完后在 **1440px** 宽下截图，与改动前逐像素对比应当**完全一致**。

### 2. 手机端不许出现横向滚动

任何视口宽度下 `document.documentElement.scrollWidth` 都不得超过 `viewportWidth + 1`。

这是最容易踩的坑，常见来源：
- 表格列多（必须包一层 `.mg-table-scroll` 或让表格 `display:block; overflow-x:auto`）
- 固定宽度的内联 `style={{ width: 600 }}`
- 选项卡行数多且 `white-space: nowrap`
- 长英文单词 / 长数字串
- 绝对定位的装饰元素

### 3. 不许用 `display:none` 藏掉信息

优先"换行 / 堆叠 / 缩小 / 横向滚动"。只有**纯装饰**（图标、背景条、分隔线）才允许隐藏。
内容类的（栏目名、表格列、表单字段、按钮）一律保留。

---

## IV. 推荐做法

### 表格

```css
@media (max-width: 767px) {
  /* 给表格外面包一层 .mg-table-scroll（地基已提供样式） */
}
```

如果表格在 JSX 里没有包裹层，**允许你改自己模块的 tsx**，加一层
`<div className="mg-table-scroll">…</div>`。这是推荐做法，比压缩列宽可读得多。

### 多栏卡片网格

模块内如果用 `display:grid` 或 `flex` 做 N 列：
- `≤1023px`：降到 2–3 列
- `≤767px`：1–2 列

### 侧栏

`≤767px` 时侧栏内容排在主内容**后面**（`order` 或直接堆叠），不要把导航压在正文前面占满首屏。
`.mg-sidenav` 地基已处理成两列标签条，不必重复。

### 选项卡

`.mg-tabbar` 地基已改成可换行。若你的模块用了自定义 tab 容器，请一并加 `flex-wrap: wrap; height: auto`。

### 弹窗

`.mg-modal` 地基已改成 `width: calc(100vw - 24px)`。若模块内有固定宽度的内容（如结果表格），请让它可滚。

---

## V. 验收清单（每个人都要自己跑）

```bash
cd /Users/zexuan.peng/Content/maga-gov-website-chinese-style
npx tsc -b --force --pretty false   # 0 error
pnpm run build                      # 成功
```

用 Playwright（**必须用 `chromium.launch({ channel: 'chrome' })`**，本机 Chrome 可用；playwright 1.63 与本机缓存的浏览器版本不匹配，不要用 bundled chromium）在 **390×844（iPhone）、768×1024（iPad）、1440×900（桌面）** 三个视口下跑你模块的**全部路由**，断言：

- [ ] `document.documentElement.scrollWidth <= viewportWidth + 1`（无横向滚动）
- [ ] 关键内容在视口内可见（不是被裁掉）
- [ ] 0 console error / 0 pageerror / 0 破图
- [ ] **1440px 下与改动前视觉一致**（改动前后各截一张，人眼对比）

---

## VI. 归属与格式

文件：`src/styles/responsive/<你的模块>.css`（Lead 已建好带文件头的桩，替换内容即可，保留 `@module` / `@author` 注释风格）。

若需要改 JSX（加 `.mg-table-scroll` 包裹层、调 order 等），**只改你自己模块的 `src/pages/<module>/**`**，不要碰别人的。

---

## VII. 各模块归属表

| 文件 | 负责模块 | 内容 |
|---|---|---|
| `home.css` | home | 首页全部 14 区块 |
| `news.css` | news | 要闻列表/详情 + 全站搜索 |
| `gov.css` | gov | 政务公开 + 政策法规 |
| `service.css` | service | 办事大厅/指南/进度/公示 |
| `query.css` | query | 6 个查询工具 |
| `party.css` | party | 党建引领 |
| `speech.css` | speech | 讲话/推文/记者会 |
| `local.css` | local | 地方分站 |
| `download.css` | download | 下载中心 |
| `interact.css` | interact | 互动交流 |
| `static.css` | static | 静态页 + 个人中心 + 友链中转 |

> 说明：`notice.css` 不存在，公告详情页由 Lead 直接在 `responsive.css` 里处理。
