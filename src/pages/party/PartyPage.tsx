/**
 * 党建引领栏目页
 *
 * I. 路由与栏目的对应关系
 *
 * 1. `/party`         —— 党建要闻（默认）
 * 2. `/party/study`   —— 理论学习（渲染核心理念块 + 理论文章列表）
 * 3. `/party/model`   —— 先进典型
 * 4. `/party/clean`   —— 廉政建设
 *
 * 栏目由路由参数决定，切换选项卡走真实跳转，因此刷新与分享链接都能回到同一栏目。
 * 详情视图不单独占一条路由，而是在列表位置就地渲染，返回列表时分页状态不丢失。
 *
 * II. 布局
 *
 * 顶部红色横幅（标语 + 考核得分牌）之下，是「左栏导航 / 主区列表 / 右栏学习园地」
 * 三栏栅格。左中右比例沿用全站内页栅格 218 / 自适应 / 300。
 *
 * III. 可深链的查询参数
 *
 * 1. `?id=pty-s001` —— 直接打开某篇文章（用于"学习材料直链"）
 * 2. `?page=2`      —— 直接打开某一页
 *
 * @module pages/party/PartyPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Crumbs, NewsList, Pager, Panel, TabBar } from '@/components/ui';
import type { NewsItem } from '@/components/ui';
import { navigate } from '@/router';
import {
  DOC_CHAIN,
  PARTY_TABS,
  PARTY_TOTAL,
  PRINCIPLES,
  findPartyArticle,
  normalizePartyTab,
} from '@/data/party';
import type { PartyTabKey } from '@/data/party';
import PartyArticleView from './PartyArticleView';
import PartyBanner from './PartyBanner';
import PartySideNav from './PartySideNav';
import StudyCorner from './StudyCorner';

/** 每页条数：与全站列表页保持一致 */
const PAGE_SIZE = 8;

/** 文件落实链条的层级角标色调 */
const CHAIN_TONE: Record<string, 'red' | 'gold' | 'navy' | 'green' | 'outline'> = {
  上级: 'navy',
  本级: 'red',
  再转发: 'outline',
  再再转发: 'outline',
  落实: 'green',
  结果: 'gold',
};

export interface PartyPageProps {
  /** 来自路由 `/party/:tab` */
  tab?: string;
  /** 来自查询串 `?id=` */
  id?: string;
  /** 来自查询串 `?page=` */
  page?: string;
  [key: string]: string | undefined;
}

/**
 * 核心理念块
 *
 * 用 .mg-party-quote 渲染每条理念。理念的格式是「价值判断 + 技术性限定」，
 * 限定部分单独成行，并标注为"践行要求"。
 */
function PrinciplesBlock() {
  return (
    <>
      <div className="mg-sec-title">核心理念（{PRINCIPLES.length} 条）</div>
      <div className="mg-party-principles__note">
        每条理念均配有践行要求。践行要求的落实情况以本单位自评为主，自评结果不计入考核扣分。
      </div>
      <div className="mg-party-principles">
        {PRINCIPLES.map((p, i) => (
          <div className="mg-party-quote mg-party-principle" key={p.id}>
            <div className="mg-party-principle__head">
              <span className="mg-party-principle__no">{String(i + 1).padStart(2, '0')}</span>
              <span className="mg-party-quote__text">{p.title}</span>
            </div>
            {p.en && <div className="mg-party-principle__en">{p.en}</div>}
            <div className="mg-party-principle__desc">{p.desc}</div>
            {p.requirement && (
              <div className="mg-party-principle__req">践行要求：{p.requirement}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function PartyPage(props: PartyPageProps) {
  // I. 栏目解析：非法 tab 回退到党建要闻，并给出提示
  const activeKey = normalizePartyTab(props.tab);
  const activeTab = PARTY_TABS.find((t) => t.key === activeKey) ?? PARTY_TABS[0];
  const unknownTab = props.tab !== undefined && props.tab !== '' && props.tab !== activeKey;

  // II. 分页与详情：详情可由查询串直接指定
  const [page, setPage] = useState(() => {
    const n = Number.parseInt(props.page ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  const [selectedId, setSelectedId] = useState<string | undefined>(props.id);
  const prevTab = useRef<PartyTabKey>(activeKey);

  // 切换栏目时回到第一页并关闭详情（首次挂载不重置，以免抹掉直链参数）
  useEffect(() => {
    if (prevTab.current === activeKey) return;
    prevTab.current = activeKey;
    setPage(1);
    setSelectedId(undefined);
  }, [activeKey]);

  const list = activeTab.articles;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems: NewsItem[] = list
    .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    .map((a) => ({
      id: a.id,
      title: a.title,
      date: a.date,
      badge: a.badge,
      badgeTone: a.badgeTone,
      summary: a.summary,
    }));

  const selected = selectedId !== undefined ? findPartyArticle(selectedId) : undefined;
  const selectedMissing = selectedId !== undefined && selected === undefined;

  const switchTab = (key: string) => {
    const target = PARTY_TABS.find((t) => t.key === key);
    if (target) navigate(target.path);
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '党建引领', to: '/party' }, { label: activeTab.label }]} />

      {/* 顶部横幅 */}
      <PartyBanner />

      {unknownTab && (
        <Alert tone="yellow">
          您访问的栏目「{props.tab}」不存在，已为您展示「党建要闻」。本栏目自设立以来，
          栏目不存在的情况共发生 0 次。
        </Alert>
      )}

      <div className="mg-layout-3col">
        {/* 左栏：栏目树 + 考核指标 */}
        <div className="mg-layout__left">
          <PartySideNav active={activeKey} />
        </div>

        {/* 主区：列表 或 详情 */}
        <div className="mg-layout__main">
          {selected ? (
            <PartyArticleView article={selected} onBack={() => setSelectedId(undefined)} />
          ) : selectedMissing ? (
            <Panel title="文章未找到">
              <div className="mg-empty">
                <div className="mg-empty__icon">※</div>
                <div>
                  未找到编号为 {selectedId} 的文稿。该文可能已被合并至另一篇通知，
                  请从列表重新进入。
                </div>
                <div className="mg-party-empty__action">
                  <Button size="sm" onClick={() => setSelectedId(undefined)}>
                    返回列表
                  </Button>
                </div>
              </div>
            </Panel>
          ) : (
            <>
              <Panel
                title={activeTab.label}
                variant={activeKey === 'news' ? 'red' : 'navy'}
                extra={
                  <span className="mg-party-mini">
                    全栏目 {PARTY_TOTAL} 条 · 今日新增 {activeKey === 'news' ? 3 : 1} 条
                  </span>
                }
              >
                <TabBar
                  tabs={PARTY_TABS.map((t) => ({
                    key: t.key,
                    label: t.label,
                    count: t.articles.length,
                  }))}
                  active={activeKey}
                  onChange={switchTab}
                />

                {/* 理论学习：先理念，后文章 */}
                {activeKey === 'study' && <PrinciplesBlock />}

                <div className="mg-party-listhead">
                  <span className="mg-party-listhead__count">
                    {activeKey === 'study' ? '理论文章' : '条目'} 共 {list.length} 条 · 本页{' '}
                    {pageItems.length} 条
                  </span>
                  <span className="mg-party-listhead__blurb">{activeTab.blurb}</span>
                </div>

                <NewsList
                  items={pageItems}
                  headlineFirst={safePage === 1}
                  emptyText="暂无数据。本栏目自 2019 年起无新内容。"
                  onItemClick={(it) => setSelectedId(it.id)}
                />

                <Pager
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={list.length}
                  onChange={setPage}
                />
              </Panel>

              {/* 文件落实链条：一份上级文件在本局的完整落地过程 */}
              <Panel
                title="文件落实链条（示例）"
                extra={<span className="mg-party-mini">链条完整率 100%</span>}
              >
                <div className="mg-party-chain__hint">
                  以下为一份上级文件在本局的完整落实过程：转发 3 次、报送 1 次、通报 1 次，
                  每一步均有文件、有台账、有留痕。
                </div>
                {DOC_CHAIN.map((d) => (
                  <div className="mg-party-chain__item" key={d.id}>
                    <Badge tone={CHAIN_TONE[d.level] ?? 'outline'}>{d.level}</Badge>
                    <div className="mg-party-chain__body">
                      <div className="mg-party-chain__title">{d.title}</div>
                      <div className="mg-party-chain__note">{d.note}</div>
                    </div>
                  </div>
                ))}
                <div className="mg-party-metrics__note">
                  链条中每一份文件的语言、格式、文号均符合规范。规范本身另有一份文件规定，
                  该文件未列入本链条。
                </div>
              </Panel>
            </>
          )}
        </div>

        {/* 右栏：学习园地 */}
        <div className="mg-layout__right">
          <StudyCorner />
        </div>
      </div>
    </div>
  );
}
