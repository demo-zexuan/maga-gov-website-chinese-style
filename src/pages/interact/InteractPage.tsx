/**
 * 互动交流 —— 栏目主页面
 *
 * I. 职责
 *
 * 1. 路由 `/interact`（我要写信）与 `/interact/:tab`（tab ∈ advice | survey | faq | letters）
 *    共用本组件，当前子栏目由 props.tab 决定，切换子栏目直接改 URL，不使用本地状态。
 * 2. 左栏为子栏目导航（我要写信 / 建言献策 / 在线调查 / 常见问题 / 信件选登），
 *    中栏按 tab 渲染对应面板，右栏展示互动统计、办理时限与温馨提示。
 *
 * II. 设计说明
 *
 * 1. 「互动交流」是全站官僚主义讽刺最密集的栏目：写信、建言、问卷、常见问题、信件选登
 *    五个入口构成一个闭环 —— 每个入口都通向另一个入口，最终都通向 60 个工作日。
 * 2. 所有数字都只增不减，所有评分都是满分，所有回复都格式完美。
 *
 * @module pages/interact/InteractPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Crumbs, Panel, StatRow } from '@/components/ui';
import { Link } from '@/router';
import LetterForm from './LetterForm';
import AdvicePanel from './AdvicePanel';
import SurveyPanel from './SurveyPanel';
import FaqPanel from './FaqPanel';
import LettersPanel from './LettersPanel';

/* ---------------- 类型与常量 ---------------- */

type TabKey = 'letter' | 'advice' | 'survey' | 'faq' | 'letters';

/** 左栏子栏目导航 */
const TABS: { key: TabKey; label: string; to: string }[] = [
  { key: 'letter', label: '我要写信', to: '/interact' },
  { key: 'advice', label: '建言献策', to: '/interact/advice' },
  { key: 'survey', label: '在线调查', to: '/interact/survey' },
  { key: 'faq', label: '常见问题', to: '/interact/faq' },
  { key: 'letters', label: '信件选登', to: '/interact/letters' },
];

/** 面包屑与当前页名称 */
const TAB_LABEL: Record<TabKey, string> = {
  letter: '我要写信',
  advice: '建言献策',
  survey: '在线调查',
  faq: '常见问题',
  letters: '信件选登',
};

/** 把路由参数规范化为子栏目键：无法识别时按「我要写信」处理 */
function normalizeTab(tab?: string): TabKey {
  if (tab === 'advice' || tab === 'survey' || tab === 'faq' || tab === 'letters') return tab;
  return 'letter';
}

/* ---------------- 页面 ---------------- */

export default function InteractPage({ tab }: { tab?: string }) {
  const tabKey = normalizeTab(tab);
  const unknownTab = tab !== undefined && tabKey === 'letter' && tab !== 'letter';

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '互动交流', to: '/interact' }, { label: TAB_LABEL[tabKey] }]} />

      <div className="mg-layout-3col">
        {/* ---------------- 左栏：子栏目导航 ---------------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">互动交流</div>
            {TABS.map((t) => (
              <Link
                key={t.key}
                to={t.to}
                className={`mg-sidenav__item${t.key === tabKey ? ' is-active' : ''}`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <Panel title="办理时限">
            <div className="mg-it-note">
              根据《信访条例》，信件答复时限为 <b>60 个工作日</b>。
            </div>
            <div className="mg-it-note">感谢您的耐心等待，您的等待时间不计入办理时限。</div>
            <div className="mg-it-note">
              办理时限自转交完成之日起算。转交完成之日另行通知。
            </div>
          </Panel>

          <Panel title="留言量统计">
            <StatRow label="今日来信" value="1,204" unit="封" />
            <StatRow label="今日答复" value="1,204" unit="封" />
            <StatRow label="待答复" value="0" unit="封" />
            <div className="mg-it-note">
              今日答复数与今日来信数保持一致，以免出现答复积压的误读。
              待答复一项只统计已答复的信件。
            </div>
          </Panel>
        </div>

        {/* ---------------- 中栏：当前子栏目 ---------------- */}
        <div className="mg-layout__main">
          <div className="mg-it-banner">
            <div className="mg-it-banner__title">网上互动交流平台</div>
            <div className="mg-it-banner__sub">来信必复 · 建议必研 · 问卷必收</div>
            <div className="mg-it-banner__note">
              本平台受理咨询、投诉、建议与表扬。答复时限 60 个工作日，您的等待时间不计入办理时限。
            </div>
          </div>

          {unknownTab && (
            <div className="mg-it-note mg-it-note--block">
              您访问的子栏目不存在，已为您显示「我要写信」。本平台不提供子栏目纠错功能。
            </div>
          )}

          {tabKey === 'letter' && (
            <>
              <Panel title="我要写信">
                <LetterForm />
              </Panel>

              <Panel title="信件办理流程">
                <div className="mg-steps">
                  {['提交', '转交', '办理', '答复', '评价'].map((s, i) => (
                    <div className="mg-steps__item" key={s}>
                      <div className="mg-steps__num">{i + 1}</div>
                      <div className="mg-steps__text">{s}</div>
                    </div>
                  ))}
                </div>
                <div className="mg-it-note">
                  共 5 个环节。其中「办理」环节用时最长；「评价」环节仅提供「非常满意」一个选项。
                </div>
                <div className="mg-it-note">
                  「转交」环节可多次重复：转交部门在 5 个工作日内确认是否属于本部门职责，
                  不属于的转交其他部门，转交次数不设上限，转交期间不计入办理时限。
                </div>
              </Panel>
            </>
          )}

          {tabKey === 'advice' && <AdvicePanel />}
          {tabKey === 'survey' && <SurveyPanel />}
          {tabKey === 'faq' && <FaqPanel />}
          {tabKey === 'letters' && <LettersPanel />}
        </div>

        {/* ---------------- 右栏：统计与提示 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="互动统计">
            <StatRow label="累计来信" value="1,842,006" unit="封" />
            <StatRow label="累计答复" value="1,842,006" unit="封" />
            <StatRow label="平均答复用时" value="58.4" unit="个工作日" />
            <StatRow label="群众满意度" value="100" unit="%" />
            <div className="mg-it-note">
              累计来信与累计答复始终相等。平均答复用时 58.4 个工作日，未超过 60 个工作日的答复时限。
            </div>
            <div className="mg-it-note">
              满意度为正面评价份数除以总份数。本栏目问卷不设负面选项，故满意度恒为 100%。
            </div>
          </Panel>

          <Panel title="温馨提示">
            <div className="mg-it-note">
              1. 请勿就同一事项重复提交。重复提交将合并为一件办理，合并后时限自最后一件提交之日起算。
            </div>
            <div className="mg-it-note">
              2. 未填写联系方式的信件同样受理，但无法回复；无法回复的信件不计入答复率统计。
            </div>
            <div className="mg-it-note">
              3. 涉及诉讼、仲裁、行政复议的事项不属于本栏目受理范围，请通过相应法定渠道提出。
            </div>
            <div className="mg-it-note">
              4. 本栏目不受理匿名表扬，但匿名表扬同样会被记录在案。
            </div>
          </Panel>

          <Panel title="常见问题">
            <ul className="mg-list mg-it-links">
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/interact/faq" className="mg-list__text">
                  信件提交后多久能得到答复？
                </Link>
              </li>
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/interact/faq" className="mg-list__text">
                  为什么我的信件没有被选登？
                </Link>
              </li>
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/interact/faq" className="mg-list__text">
                  满意度调查为什么没有「不满意」选项？
                </Link>
              </li>
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/interact/faq" className="mg-list__text">
                  「网友补充」是谁写的？
                </Link>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
