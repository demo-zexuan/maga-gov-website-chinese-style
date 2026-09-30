/**
 * 州分站首页
 *
 * I. 页面结构
 *
 * 1. 分站横幅：用 code 哈希出的稳定配色 + 州名 / 昵称 / 首府 / 加入联邦日期 / 分站编号
 * 2. 左栏：本州概况、本州便民服务入口 6 个
 * 3. 主区：本州要闻 5 条、本州办件统计、本州公告 3 条
 *
 * II. 数据来源
 *
 * 1. 州的静态信息来自 @/data/states
 * 2. 便民服务入口来自共享的 @/data/services（按 code 确定性取样）
 * 3. 要闻、公告、统计数字全部由 statePick(code, salt, min, max) 派生。
 *    同一 code 在任何时间、任何环境都会得到同一组数字，刷新不会变。
 *
 * III. 缺失处理
 *
 * code 不存在时不跳转、不报错，而是就地渲染一个把话说完的说明页：
 * 告知本频道共收录多少个分站，并给出热门入口。
 *
 * @module pages/local/StatePage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Crumbs, Modal, NewsList, Panel, StatRow } from '@/components/ui';
import type { NewsItem } from '@/components/ui';
import { ServiceIcon } from '@/components/art';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';
import { SERVICES } from '@/data/services';
import { formatNumber } from '@/data/stats';
import {
  STATE_TOTAL,
  findState,
  hotStates,
  stateHash,
  statePick,
  statePickOne,
} from '@/data/states';
import type { StateInfo } from '@/data/types';

/** 分站配色调色板：全部取自站点令牌，按 code 哈希取值 */
const ACCENT_PALETTE = [
  'var(--c-red)',
  'var(--c-navy)',
  'var(--c-navy-light)',
  'var(--c-gold-deep)',
  'var(--c-green)',
  'var(--c-orange)',
  'var(--c-blue-badge)',
  'var(--c-red-deep)',
];

/** 分站数据的基准日期，保证确定性数据不随系统时间变化 */
const BASE_DATE = '2026-09-30';

/** 可弹出查看的条目 */
interface LocalItem {
  id: string;
  title: string;
  date: string;
  tag: string;
  body: string[];
}

/** 从基准日期往前推 n 天，返回 YYYY-MM-DD */
function dateBefore(days: number): string {
  const d = new Date(`${BASE_DATE}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * 生成本州要闻
 *
 * 从 10 套模板里按 code 哈希取起点，连续取 5 套，再填入本州专属数字。
 * 模板内容覆盖会议、上线、系统升级、督查、无障碍、满意度等常见公文题材。
 */
function buildNews(s: StateInfo): LocalItem[] {
  const c = s.code;
  const n1 = statePick(c, 11, 12, 96);
  const n2 = statePick(c, 12, 3, Math.max(4, n1 - 1));
  const n3 = statePick(c, 13, 2, 9);
  const sat = (99 + statePick(c, 14, 0, 9) / 10).toFixed(1);
  const wait = statePick(c, 15, 12, 96);
  const win = statePick(c, 16, 8, 128);
  const cases = statePick(c, 2, 120_000, 9_800_000);

  const pool: { title: string; tag: string; body: string[] }[] = [
    {
      title: `${s.name}召开本州便民服务工作推进会议`,
      tag: '要闻',
      body: [
        `${s.name}分站建设指导委员会召开本州便民服务工作推进会议，本州 ${win} 个服务窗口负责人参加。`,
        `会议通报，本州上半年网上办事大厅新增上线事项 ${n1} 项，其中在线可办 ${n2} 项，其余 ${n1 - n2} 项提供办事指南。`,
        `会议要求，各窗口要坚决克服"重痕迹、轻实效"的倾向。为掌握落实情况，会议决定各窗口按月报送台账，台账模板另行印发。`,
      ],
    },
    {
      title: `本州网上办事大厅新增上线事项 ${n1} 项`,
      tag: '服务',
      body: [
        `本州分站完成本年度第二批事项上线工作，新增上线事项 ${n1} 项。`,
        `其中在线可办 ${n2} 项，在线可预约 ${Math.max(1, Math.round(n2 / 3))} 项，在线可查看办事指南 ${n1 - n2} 项。`,
        `本州分站提示：事项上线不等于窗口受理，具体受理时间以各窗口公示为准；公示内容与本公告不一致的，以窗口现场答复为准。`,
      ],
    },
    {
      title: `本州首府 ${s.capital} 办事大厅启用智能叫号系统`,
      tag: '系统',
      body: [
        `${s.name}首府 ${s.capital} 办事大厅完成叫号系统升级，新系统即日起启用。`,
        `新系统支持手机取号、现场取号与预约取号三种方式。三种方式的号码由同一个队列统一管理，因此手机取号的用户可能被后到的现场取号用户先叫到。`,
        `系统启用首日，平均等候时长 ${wait} 分钟，与升级前基本持平。技术人员表示，系统本身运行平稳，问题主要出在用户不熟悉操作。`,
      ],
    },
    {
      title: `本州开展"最多跑一次"专项督查`,
      tag: '督查',
      body: [
        `${s.name}分站于本月组织开展"最多跑一次"专项督查，共抽查办件 ${formatNumber(n1 * 12)} 件。`,
        `督查发现，一次办结率为 ${sat}%，其余部分主要为材料补正、现场核验与跨部门协办三类。`,
        `督查组要求各窗口举一反三、立行立改。整改情况请于 3 个工作日内报本州分站，报送格式见附件，附件请在督查组处领取。`,
      ],
    },
    {
      title: '本州分站完成年度无障碍改造',
      tag: '无障碍',
      body: [
        `本州分站于本年度完成无障碍改造 ${n3} 项，包括增设轮椅通道、加装语音提示、放大页面字号等。`,
        `改造后，本州分站页面的字号可放大至原字号的两倍。放大后部分表格需要横向滚动，本州分站已记录该问题。`,
        `本州分站提示：如放大后仍无法阅读，可携带本人身份证到本州窗口现场办理，窗口提供纸质表格与放大镜。`,
      ],
    },
    {
      title: `本州推出特色便民服务，首日受理 ${n3} 件`,
      tag: '特色',
      body: [
        `${s.name}结合本州实际推出特色便民服务：${s.feature}`,
        `该服务上线首日受理 ${n3} 件，其中办结 ${Math.max(1, n3 - 2)} 件，其余 ${Math.min(2, n3)} 件转入下一工作环节。`,
        `本州分站提示：本服务由本州自行设立，联邦服务中心仅提供入口，服务内容与办理规则以本州公告为准。`,
      ],
    },
    {
      title: '本州开展群众满意度调查',
      tag: '调查',
      body: [
        `${s.name}分站于本月开展群众满意度调查，共回收问卷 ${formatNumber(n1 * 30)} 份。`,
        `调查结果显示，本州群众满意度为 ${sat}%，较上年同期上升或持平。`,
        `调查同时收集到群众意见建议 ${n3} 条，主要集中在排队时长、表格数量与热线接通率三个方面。上述建议已转本州相关窗口研究，研究结果将于年底前反馈。`,
      ],
    },
    {
      title: '本州分站完成系统升级',
      tag: '系统',
      body: [
        `${s.name}分站于本周末完成系统升级，升级后分站版本号为 2.0.${statePick(c, 17, 1, 9)}。`,
        `升级期间，分站可正常访问，仅"办件进度查询"功能暂停 ${statePick(c, 18, 2, 12)} 小时。`,
        `升级后，部分用户的历史办件记录需要重新查询。本州分站提示：如查询不到，请再次查询；再次查询仍查询不到的，请稍后再查。`,
      ],
    },
    {
      title: `本州新增分站值班窗口 ${statePick(c, 19, 2, 8)} 个`,
      tag: '服务',
      body: [
        `为缓解本州办事高峰压力，本州分站新增值班窗口 ${statePick(c, 19, 2, 8)} 个。`,
        `新增窗口由现有人员兼任，不新增编制。值班时间为工作日 09:00 至 17:00，其中 12:00 至 13:00 为用餐时间，窗口暂停服务。`,
        `本州分站提示：高峰时段为上午 09:00 至 11:00 与下午 14:00 至 16:00，建议错峰办理。错峰办理的等候时长与高峰时段基本持平。`,
      ],
    },
    {
      title: '本州办件量创同期新高',
      tag: '统计',
      body: [
        `本年度截至本月初，${s.name}分站累计受理办件 ${formatNumber(cases)} 件，较上年同期增长 ${statePick(c, 20, 1, 18)}%。`,
        `办件量增长主要来自线上渠道，线上办件占比 ${statePick(c, 21, 52, 94)}%。`,
        `本州分站提示：办件量增长不等于办结量增长，两个数据的口径不同，请勿混用。`,
      ],
    },
  ];

  const offset = stateHash(`${c}#news`) % pool.length;
  // 日期用累计偏移量推进，保证列表严格按时间倒序（每条的间隔本身仍是哈希出来的）
  let elapsed = 0;
  return Array.from({ length: 5 }, (_, i) => {
    elapsed += statePick(c, 30 + i, 3, 9);
    const tpl = pool[(offset + i) % pool.length];
    return {
      id: `${c}-news-${i + 1}`,
      title: tpl.title,
      date: dateBefore(elapsed),
      tag: tpl.tag,
      body: tpl.body,
    };
  });
}

/** 生成本州公告 */
function buildNotices(s: StateInfo): LocalItem[] {
  const c = s.code;
  const holiday = statePickOne(c, 41, ['元旦', '独立日', '劳动节', '感恩节']) ?? '法定节假日';
  const hours = statePick(c, 42, 2, 12);

  const pool: { title: string; tag: string; body: string[] }[] = [
    {
      title: '关于本州分站系统维护的公告',
      tag: '维护',
      body: [
        '为提升服务质量，本州分站将进行例行系统维护。',
        '维护窗口：每周一 00:00 至周日 24:00。维护期间分站可正常访问，仅"数据更新"功能暂停。',
        `本次维护预计影响办件进度查询 ${hours} 小时。给您带来的不便，敬请谅解。我们已记录您的谅解。`,
      ],
    },
    {
      title: `关于${holiday}期间本州办事大厅服务安排的公告`,
      tag: '节假日',
      body: [
        `${holiday}期间，本州办事大厅服务安排如下。`,
        '一、线下窗口暂停服务。二、线上服务正常提供。三、线上服务的人工客服暂停服务。',
        '四、紧急事项请拨打值班电话 1776-2026。该号码不存在，值班电话以本州另行公告为准。',
      ],
    },
    {
      title: '关于本州分站年度数据结转的公告',
      tag: '数据',
      body: [
        '本州分站每年进行一次数据结转，结转周期为 12 月 1 日至次年 11 月 30 日。',
        '结转期间，办件编号规则将作调整，新旧编号不互认，历史办件请以办件时间为准查询。',
        '结转完成后，本州分站将公示结转情况。公示内容包括结转条数、结转成功率与结转耗时，不包含结转的具体内容。',
      ],
    },
    {
      title: '关于本州分站访问高峰的提示',
      tag: '提示',
      body: [
        '本州分站访问高峰为工作日 09:00 至 17:00，高峰时段页面响应时间约为平时的 3 倍。',
        '建议非紧急事项在非高峰时段办理。经统计，非高峰时段的页面响应时间与高峰时段基本持平，原因是夜间进行系统维护。',
        '本州分站已记录该问题，并将于下一次系统升级中一并研究。',
      ],
    },
  ];

  const offset = stateHash(`${c}#notice`) % pool.length;
  let elapsed = 0;
  return Array.from({ length: 3 }, (_, i) => {
    elapsed += statePick(c, 50 + i, 2, 6);
    const tpl = pool[(offset + i) % pool.length];
    return {
      id: `${c}-notice-${i + 1}`,
      title: tpl.title,
      date: dateBefore(elapsed),
      tag: tpl.tag,
      body: tpl.body,
    };
  });
}

export interface StatePageProps {
  /** 两位邮政缩写，由路由 /local/:code 传入 */
  code?: string;
  [key: string]: string | undefined;
}

export default function StatePage(props: StatePageProps) {
  const { pushToast } = useApp();
  const [detail, setDetail] = useState<LocalItem | null>(null);
  const state = findState(props.code);

  // 确定性派生数据：state 为空时不计算（仍调用 hooks 以保持调用顺序稳定）
  const derived = useMemo(() => {
    if (!state) return null;
    const code = state.code;
    const serial = statePick(code, 1, 1, STATE_TOTAL);
    const cases = statePick(code, 2, 120_000, 9_800_000);
    const today = statePick(code, 3, 800, 24_000);
    const wait = statePick(code, 4, 4, 96);
    const windows = statePick(code, 5, 3, 128);
    const satisfaction = (99 + statePick(code, 6, 0, 9) / 10).toFixed(1);
    const offset = stateHash(`${code}#svc`) % Math.max(1, SERVICES.length);
    const services = Array.from({ length: 6 }, (_, i) => SERVICES[(offset + i) % SERVICES.length]);
    return {
      serial,
      cases,
      today,
      wait,
      windows,
      satisfaction,
      services,
      accent: ACCENT_PALETTE[stateHash(code) % ACCENT_PALETTE.length],
      news: buildNews(state),
      notices: buildNotices(state),
    };
  }, [state]);

  // ---------------- 分站不存在 ----------------
  if (!state || !derived) {
    const code = (props.code ?? '').toUpperCase() || '（空）';
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '地方频道', to: '/local' }, { label: '分站未找到' }]} />
        <Panel title="分站未找到" variant="red">
          <div className="mg-empty">
            <div className="mg-empty__icon">※</div>
            <div>未找到代码为「{code}」的分站。</div>
            <div className="mg-local-404__line">
              本频道共收录 {STATE_TOTAL} 个分站（50 个州与首都特区），您输入的代码不在其中。
              它可能属于一个尚未加入联邦的地区，也可能只是打错了一个字母。
            </div>
          </div>
          <div className="mg-local-section">也许您想访问以下分站</div>
          <div className="mg-grid mg-grid--6 mg-local-hot">
            {hotStates(6).map((s) => (
              <Link key={s.code} to={`/local/${s.code}`} className="mg-local-card">
                <div className="mg-local-card__code">{s.code}</div>
                <div className="mg-local-card__name">{s.name}</div>
                <div className="mg-local-card__meta">首府 {s.capital}</div>
                <div className="mg-local-card__heat">{formatNumber(s.heat)}</div>
              </Link>
            ))}
          </div>
          <Alert tone="gray">
            如您确信该地区确实存在，请向该地区政务部门反映。反映渠道由该地区自行确定，
            本频道不代为转交，也不对转交结果负责。
          </Alert>
          <div className="mg-local-404__action">
            <Button variant="primary" onClick={() => navigate('/local')}>
              返回地方频道
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const newsItems: NewsItem[] = derived.news.map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    badge: n.tag,
  }));
  const noticeItems: NewsItem[] = derived.notices.map((n) => ({
    id: n.id,
    title: n.title,
    date: n.date,
    badge: n.tag,
  }));

  const queryProgress = () => {
    pushToast('查询成功', `本州数据同步延迟 72 小时，当前显示的是 ${state.name}分站 3 个工作日前的进度。`);
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '地方频道', to: '/local' }, { label: state.name }]} />

      {/* 分站横幅 */}
      <div className="mg-local-banner" style={{ background: derived.accent }}>
        <div className="mg-local-banner__seal">{state.code}</div>
        <div className="mg-local-banner__text">
          <div className="mg-local-banner__name">{state.name}</div>
          <div className="mg-local-banner__en">
            {state.nameEn} · {state.nickname} · 首府 {state.capital}
          </div>
          <div className="mg-local-banner__meta">
            加入联邦 {state.admitted} · 分站编号 US-{state.code}-
            {String(derived.serial).padStart(3, '0')} · 分站热度 {formatNumber(state.heat)}
          </div>
        </div>
        <div className="mg-local-banner__stat">
          <div className="mg-local-banner__stat-label">本年度办件</div>
          <div className="mg-local-banner__stat-num">{formatNumber(derived.cases)}</div>
          <div className="mg-local-banner__stat-label">件</div>
        </div>
      </div>

      <Alert tone="yellow">
        <b>本州特色便民服务：</b>
        {state.feature}
        <div className="mg-local-note">
          该服务由本州自行设立，联邦服务中心仅提供入口，办理规则与收费标准以本州公告为准。
        </div>
      </Alert>

      <div className="mg-layout-2col">
        {/* ---------------- 左栏 ---------------- */}
        <div className="mg-layout__side">
          <Panel title="本州概况" variant="navy">
            <div className="mg-local-note mg-local-note--lead">{state.blurb}</div>
            <div className="mg-local-metrics">
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">州名</span>
                <span className="mg-local-metrics__value">{state.name}</span>
              </div>
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">邮政缩写</span>
                <span className="mg-local-metrics__value">{state.code}</span>
              </div>
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">首府</span>
                <span className="mg-local-metrics__value">{state.capital}</span>
              </div>
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">昵称</span>
                <span className="mg-local-metrics__value">{state.nickname}</span>
              </div>
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">加入联邦</span>
                <span className="mg-local-metrics__value">{state.admitted}</span>
              </div>
              <div className="mg-local-metrics__row">
                <span className="mg-local-metrics__label">服务窗口</span>
                <span className="mg-local-metrics__value">
                  {derived.windows}
                  <span className="mg-local-metrics__unit">个</span>
                </span>
              </div>
            </div>
            <div className="mg-local-note">
              以上数据由本州分站报送，报送口径由本州确定。分站与本州口径不一致时，以本州口径为准。
            </div>
          </Panel>

          <Panel
            title="本州便民服务入口"
            extra={<span className="mg-local-mini">共 6 个</span>}
          >
            {derived.services.map((svc) => (
              <Link key={svc.id} to={`/service/detail/${svc.id}`} className="mg-local-svc">
                <span className="mg-local-svc__icon">
                  <ServiceIcon name={svc.icon} width={22} height={22} />
                </span>
                <span className="mg-local-svc__body">
                  <span className="mg-local-svc__name">{svc.name}</span>
                  <span className="mg-local-svc__meta">
                    {svc.department} · 承诺 {svc.duration}
                  </span>
                </span>
              </Link>
            ))}
            <div className="mg-local-note">
              本州入口由系统按分站编号自动分配，与各州实际业务范围无关。
            </div>
          </Panel>
        </div>

        {/* ---------------- 主区 ---------------- */}
        <div className="mg-layout__main">
          <Panel
            title="本州要闻"
            variant="red"
            extra={<span className="mg-local-mini">共 5 条</span>}
          >
            <NewsList items={newsItems} onItemClick={(it) => {
              setDetail(derived.news.find((n) => n.id === it.id) ?? null);
            }} />
            <div className="mg-local-note">
              本州要闻由本州分站报送，报送数量纳入分站年度考核。点击标题可查看全文。
            </div>
          </Panel>

          <Panel title="本州办件统计" extra={<span className="mg-local-mini">数据截至今日 08:00</span>}>
            <div className="mg-local-stats">
              <StatRow label="今日受理" value={formatNumber(derived.today)} unit="件" />
              <StatRow label="本年度办件" value={formatNumber(derived.cases)} unit="件" />
              <StatRow label="平均等候" value={derived.wait} unit="分钟" />
              <StatRow label="服务窗口" value={derived.windows} unit="个" />
              <StatRow label="群众满意度" value={derived.satisfaction} unit="%" />
              <StatRow label="群众投诉" value="0" unit="件" />
            </div>
            <div className="mg-local-actions">
              <Button variant="primary" onClick={queryProgress}>
                查询本州办件进度
              </Button>
              <Button
                onClick={() =>
                  pushToast('已受理', '您的建议已记录，编号为 ' + state.code + '-' + derived.today + '，请妥善保存。')
                }
              >
                对本州服务提出建议
              </Button>
            </div>
            <div className="mg-local-note">
              统计口径：今日受理按自然日累计，本年度办件按结转年度累计，平均等候按高峰时段抽样，
              群众投诉按已受理且已办结的投诉件计算。四个口径互不换算。
            </div>
          </Panel>

          <Panel title="本州公告" extra={<span className="mg-local-mini">共 3 条</span>}>
            <NewsList
              items={noticeItems}
              onItemClick={(it) => {
                setDetail(derived.notices.find((n) => n.id === it.id) ?? null);
              }}
            />
            <div className="mg-local-note">
              本州公告由本州分站发布，联邦服务中心仅提供展示位，不对公告内容作解释。
            </div>
          </Panel>
        </div>
      </div>

      {/* 详情弹窗：要闻与公告共用 */}
      <Modal
        open={detail !== null}
        title={detail?.title ?? ''}
        onClose={() => setDetail(null)}
        width={620}
        footer={
          <Button variant="primary" onClick={() => setDetail(null)}>
            关闭
          </Button>
        }
      >
        {detail && (
          <div className="mg-local-detail">
            <div className="mg-local-detail__meta">
              <span>{detail.date}</span>
              <span>
                {state.name}分站 · {detail.tag}
              </span>
            </div>
            <div className="mg-local-detail__body">
              {detail.body.map((p, i) => (
                <p key={`${detail.id}-p${i}`}>{p}</p>
              ))}
            </div>
            <div className="mg-local-note">
              本条信息由 {state.name}分站报送，报送文号由分站自行编号。本页展示内容与分站原文
              不一致的，以分站原文为准；分站原文未公开的，以本页为准。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
