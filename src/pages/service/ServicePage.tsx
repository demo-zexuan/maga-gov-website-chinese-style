/**
 * 政务服务 —— 办事大厅 / 分类办事
 *
 * I. 职责
 *
 * 1. 路由 `/service`（全部事项）、`/service/personal`（个人办事）、`/service/business`（企业办事）
 *    共用本组件；当前分类由 props.scope 决定，切换分类直接改 URL，不使用本地状态，
 *    这样从任一入口进入都能正确高亮，浏览器的前进/后退也符合直觉。
 * 2. 主区展示「今日可办 / 在线可办 / 平均等待」横幅与服务卡片网格。
 * 3. 右栏展示常见问题与办事网点（含排队人数，实时性由文案保证）。
 *
 * II. 黑色幽默位置
 *
 * 1. 横幅小字：数据只显示上升
 * 2. 维护公告：维护窗口覆盖全天
 * 3. 卡片：承诺时限短于法定期限，且「自受理之日起计算」而受理之日另行认定
 * 4. 操作反馈：线下事项点「预约办理」必然得到号源已发完的答复
 *
 * @module pages/service/ServicePage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Crumbs, Panel, StatRow, TabBar } from '@/components/ui';
import { ServiceIcon } from '@/components/art';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';
import { SERVICES, servicesByScope } from '@/data/services';
import type { ServiceItem } from '@/data/types';
import { faqsByCategory } from '@/data/faqs';
import { OFFICES, averageWaitMinutes } from '@/data/service-extra';

/* ---------------- 类型与常量 ---------------- */

/** 右栏「常见问题」取政务服务分类（数据实体由互动交流模块维护，此处只消费） */
const SERVICE_FAQS = faqsByCategory('service');

type ScopeKey = 'all' | 'personal' | 'business';

/** 左侧栏目导航 */
const SIDE_LINKS: { label: string; to: string; key: ScopeKey | 'other' }[] = [
  { label: '办事大厅', to: '/service', key: 'all' },
  { label: '个人办事', to: '/service/personal', key: 'personal' },
  { label: '企业办事', to: '/service/business', key: 'business' },
  { label: '办件公示', to: '/service/records', key: 'other' },
  { label: '办事进度查询', to: '/service/track', key: 'other' },
];

/** 把路由参数规范化为分类键：无法识别时按「全部」处理 */
function normalizeScope(scope?: string): ScopeKey {
  return scope === 'personal' || scope === 'business' ? scope : 'all';
}

/* ---------------- 页面 ---------------- */

export default function ServicePage({ scope }: { scope?: string }) {
  const { pushToast } = useApp();
  const scopeKey = normalizeScope(scope);
  const [keyword, setKeyword] = useState('');

  const scopeItems = useMemo<ServiceItem[]>(
    () => (scopeKey === 'all' ? SERVICES : servicesByScope(scopeKey)),
    [scopeKey]
  );

  // 关键词过滤：事项名称 / 主管部门
  const items = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return scopeItems;
    return scopeItems.filter((s) => s.name.includes(kw) || s.department.includes(kw));
  }, [scopeItems, keyword]);

  const onlineCount = scopeItems.filter((s) => s.online).length;
  const waitAvg = averageWaitMinutes();

  /** 分类切换：直接跳路由，保证地址栏与页面内容一致 */
  const onTabChange = (key: string) => {
    if (key === 'personal') navigate('/service/personal');
    else if (key === 'business') navigate('/service/business');
    else navigate('/service');
  };

  /**
   * 卡片主操作
   *
   * 在线可办事项跳转办事指南；不支持在线办理的事项给出预约结果。
   * 反馈与按钮文案严格对应，不存在承诺与结果不符的情况。
   */
  const onCardAction = (s: ServiceItem) => {
    if (s.online) {
      navigate(`/service/detail/${s.id}`);
      return;
    }
    pushToast(
      '预约结果',
      '您所在网点的预约号源已发放完毕，本次未生成预约号。下一批号源发放时间为下一批号源发放之时。'
    );
  };

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '政务服务', to: '/service' },
          scopeKey === 'personal'
            ? { label: '个人办事' }
            : scopeKey === 'business'
              ? { label: '企业办事' }
              : { label: '办事大厅' },
        ]}
      />

      <div className="mg-layout-3col">
        {/* ---------------- 左栏：栏目导航与统计 ---------------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">政务服务</div>
            {SIDE_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`mg-sidenav__item${l.key === scopeKey ? ' is-active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <Panel title="办事统计">
            <StatRow label="今日受理" value="8,888,888" unit="件" />
            <StatRow label="今日办结" value="8,888,888" unit="件" />
            <StatRow label="事项总数" value={SERVICES.length} unit="项" />
            <StatRow label="在线可办" value={onlineCount} unit="项" />
            <div className="mg-svc-note">
              今日办结数与今日受理数保持一致，以免出现办件积压的误读。
            </div>
          </Panel>

          <Panel title="服务满意度">
            <div className="mg-kpi">99.8%</div>
            <div className="mg-svc-note">
              本调查已连续开展 12 年，是该指标自设立以来唯一未出现过波动的年份区间。
            </div>
            <div className="mg-svc-note">
              评价入口位于办事大厅 3 号门左侧。3 号门暂停使用。
            </div>
          </Panel>
        </div>

        {/* ---------------- 中栏：横幅 + 筛选 + 卡片 ---------------- */}
        <div className="mg-layout__main">
          <div className="mg-svc-banner">
            <div className="mg-svc-banner__item">
              <div className="mg-svc-banner__num">{scopeItems.length}</div>
              <div className="mg-svc-banner__label">今日可办事项（项）</div>
            </div>
            <div className="mg-svc-banner__item">
              <div className="mg-svc-banner__num">{onlineCount}</div>
              <div className="mg-svc-banner__label">在线可办（项）</div>
            </div>
            <div className="mg-svc-banner__item">
              <div className="mg-svc-banner__num">{waitAvg}</div>
              <div className="mg-svc-banner__label">平均等待（分钟）</div>
            </div>
            <div className="mg-svc-banner__note">
              以上数据每 1.8 秒更新一次，仅显示上升。平均等待时间不含排队时间。
            </div>
          </div>

          <Alert tone="yellow">
            <b>系统维护通知：</b>
            本平台维护窗口为每日 00:00-24:00。请在非维护时段办理业务；非维护时段的界定详见维护公告，
            维护公告于维护期间不对外发布。
          </Alert>

          <Panel title={`服务事项（共 ${items.length} 项）`}>
            <div className="mg-svc-toolbar">
              <TabBar
                tabs={[
                  { key: 'all', label: '全部事项', count: SERVICES.length },
                  { key: 'personal', label: '个人办事', count: servicesByScope('personal').length },
                  { key: 'business', label: '企业办事', count: servicesByScope('business').length },
                ]}
                active={scopeKey}
                onChange={onTabChange}
              />
              <div className="mg-svc-search">
                <input
                  className="mg-input"
                  value={keyword}
                  placeholder="按事项名称或主管部门检索"
                  onChange={(e) => setKeyword(e.target.value)}
                  aria-label="服务事项检索"
                />
                <Button size="sm" onClick={() => setKeyword('')}>
                  重置
                </Button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="mg-empty">
                <div className="mg-empty__icon">※</div>
                <div>未检索到相关事项。建议更换关键词，或前往大厅咨询台现场咨询。</div>
                <div className="mg-svc-note">咨询台位于大厅咨询台（自东门进入后直行）。</div>
              </div>
            ) : (
              <div className="mg-grid mg-grid--3 mg-svc-cards">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="mg-svc-card"
                    onClick={() => navigate(`/service/detail/${s.id}`)}
                    title="查看办事指南"
                  >
                    <div className="mg-svc-card__head">
                      <ServiceIcon name={s.icon} width={30} height={30} />
                      <div className="mg-svc-card__title">
                        <span className="mg-svc-card__name">{s.name}</span>
                        {s.hot && <Badge tone="gold">热门</Badge>}
                        {!s.online && <Badge tone="outline">需到场</Badge>}
                      </div>
                    </div>
                    <div className="mg-svc-card__dept">{s.department}</div>
                    <div className="mg-svc-card__meta">
                      <span>
                        承诺时限：<b>{s.duration}</b>
                      </span>
                      <span>法定时限：{s.legalDuration}</span>
                    </div>
                    <div className="mg-svc-card__actions">
                      <Button
                        size="sm"
                        variant={s.online ? 'primary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardAction(s);
                        }}
                      >
                        {s.online ? '在线办理' : '预约办理'}
                      </Button>
                      <Link
                        to={`/service/detail/${s.id}`}
                        className="mg-svc-card__guide"
                        onClick={(e) => e.stopPropagation()}
                      >
                        办事指南 »
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="mg-svc-footnote">
            本页所列事项名称、主管部门、时限与收费标准均为演示数据。实际办理要求以受理窗口当场提出的要求为准，
            当场未提出的要求可在领取办理结果时补充提出。
          </div>
        </div>

        {/* ---------------- 右栏：常见问题与网点 ---------------- */}
        <div className="mg-layout__right">
          <Panel
            title="常见问题"
            extra={<span className="mg-svc-note">共 {SERVICE_FAQS.length} 条</span>}
          >
            <dl className="mg-svc-faq">
              {SERVICE_FAQS.map((f) => (
                <div className="mg-svc-faq__item" key={f.id}>
                  <dt className="mg-svc-faq__q">{f.question}</dt>
                  <dd className="mg-svc-faq__a">
                    {f.answer}
                    {f.footnote && <span className="mg-svc-faq__note">补充：{f.footnote}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="办事网点"
            extra={
              <Link to="/service/records" className="mg-more">
                办件公示
              </Link>
            }
          >
            <ul className="mg-svc-offices">
              {OFFICES.map((o) => (
                <li className="mg-svc-office" key={o.id}>
                  <div className="mg-svc-office__head">
                    <span className="mg-svc-office__name">{o.name}</span>
                    <span className="mg-svc-office__queue" data-status={o.status}>
                      {o.status === '暂停对外办公' ? '暂停' : `排队 ${o.queue} 人`}
                    </span>
                  </div>
                  <div className="mg-svc-office__addr">{o.address}</div>
                  <div className="mg-svc-office__meta">
                    开放窗口 {o.windows} 个 · 预计等待 {o.waitMinutes} 分钟 · {o.phone}
                  </div>
                  {o.remark && <div className="mg-svc-office__remark">{o.remark}</div>}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="办理提示">
            <div className="mg-svc-note">
              1. 请携带全部材料的原件与复印件。复印件不能代替原件，原件不能代替复印件。
            </div>
            <div className="mg-svc-note">
              2. 请于受理次日起查询进度。受理当日查询将显示「尚未受理」。
            </div>
            <div className="mg-svc-note">
              3. 如系统提示「数据同步中」，请等待同步完成；同步完成时间以同步完成为准。
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
