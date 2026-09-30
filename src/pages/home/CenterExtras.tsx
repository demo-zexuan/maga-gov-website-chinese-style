/**
 * 首页中栏补充模块
 *
 * I. 为什么需要它
 *
 * 中栏原本只有「轮播 + 头条 + 选项卡列表」三块，总高明显小于左右两栏，
 * 底部会空出约 260px 的白。老政务网站从不留白：每一像素都要有栏目。
 * 因此在中栏列表下方补两个模块填满这一区间。
 *
 * II. 组成
 *
 * 1. 「网上调查」—— 一个问题 + 4 条百分比条 + 一行问卷量说明。
 *    四条选项全部为正面表述且均为 100%，是本模块的笑点所在。
 * 2. 「便民服务直通车」—— 10 个高频入口，两行排布。
 *
 * III. 注意
 *
 * 百分比条复用全站的 `.mg-progress`，不另写一套进度条样式。
 *
 * @module pages/home/CenterExtras
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { MoreLink, Panel, Progress } from '@/components/ui';
import { DIRECT_LINKS, SURVEY } from '@/data/home';
import { Link } from '@/router';

/** 网上调查：所有选项都是正面表述，所有结果都是 100% */
function SurveyPanel() {
  return (
    <Panel title="网上调查" extra={<MoreLink to="/interact" />}>
      <div className="mg-home__survey-q">{SURVEY.question}</div>
      {SURVEY.options.map((opt) => (
        <div key={opt.label} className="mg-home__survey-row">
          <span className="mg-home__survey-label">{opt.label}</span>
          <span className="mg-home__survey-bar">
            <Progress percent={opt.percent} red />
          </span>
          <span className="mg-home__survey-pct">{opt.percent}%</span>
        </div>
      ))}
      <div className="mg-home__survey-note">{SURVEY.note}</div>
    </Panel>
  );
}

/** 便民服务直通车：10 个快捷入口 */
function DirectPanel() {
  return (
    <Panel title="便民服务直通车" extra={<MoreLink to="/service" />}>
      <div className="mg-home__direct">
        {DIRECT_LINKS.map((item) => (
          <Link key={item.label} to={item.to} title={item.label}>
            {item.label}
          </Link>
        ))}
      </div>
    </Panel>
  );
}

/** 中栏底部的模块区 */
export function CenterExtras() {
  return (
    <div className="mg-home__extras">
      <SurveyPanel />
      <DirectPanel />
    </div>
  );
}

export default CenterExtras;
