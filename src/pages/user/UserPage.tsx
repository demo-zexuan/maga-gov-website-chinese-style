/**
 * 个人中心
 *
 * I. 页面结构
 *
 * 1. 未登录：提示登录，说明登录后可以被"更好地服务"
 * 2. 已登录：我的资料 / 我的积分（左栏）+ 我的办件（表格）+ 我的消息（右主区）
 *
 * II. 说明
 *
 * 1. 全部办件、消息、积分均为虚构演示数据，不产生任何真实记录。
 * 2. 办件状态与消息内容刻意保持"永远在办理中"，与全站口径一致。
 *
 * @module pages/user/UserPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Alert, Button, Crumbs, Panel, Progress } from '@/components/ui';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';

/* ================= 演示数据 ================= */

/** 我的办件（全部为"办理中"的变体） */
const MY_CASES: {
  id: string;
  name: string;
  date: string;
  status: string;
  due: string;
  note: string;
}[] = [
  {
    id: 'CASE-2026-1776',
    name: '联邦表格印刷申请（第 3 页）',
    date: '2026-01-11',
    status: '办理中',
    due: '2026-02-08',
    note: '材料齐全，等待系统升级完成后继续办理',
  },
  {
    id: 'CASE-2026-1777',
    name: '社会保障号后 4 位变更',
    date: '2026-02-03',
    status: '已受理',
    due: '2026-03-03',
    note: '受理成功；变更结果以变更后结果为准',
  },
  {
    id: 'CASE-2026-1778',
    name: '电子证照导出（PDF）',
    date: '2026-02-19',
    status: '材料补正中',
    due: '2026-03-19',
    note: '需补交《材料补正说明》，该说明本身即为需补正的材料',
  },
  {
    id: 'CASE-2026-1779',
    name: '政务服务账号合并（7 合 1）',
    date: '2026-03-06',
    status: '正在办理中',
    due: '2026-04-03',
    note: '合并后保留 1 个账号，其余 6 个继续有效',
  },
  {
    id: 'CASE-2026-1780',
    name: '群众满意度调查问卷（回收）',
    date: '2026-03-21',
    status: '办理中',
    due: '2026-04-18',
    note: '问卷已提交，系统显示"未收到"，正在核对',
  },
  {
    id: 'CASE-2026-1781',
    name: '办不成事反映（反映办不成事）',
    date: '2026-04-02',
    status: '已转办',
    due: '2026-04-30',
    note: '已转办至原承办窗口，转办后由原窗口继续办理',
  },
];

/** 我的消息：全部是"正在办理中"的不同说法 */
const MY_MESSAGES: { date: string; title: string; body: string }[] = [
  {
    date: '2026-04-12',
    title: '您的申请正在办理中',
    body: '您提交的《联邦表格印刷申请》正在办理中。办理期间无需重复提交，重复提交不影响办理顺序。',
  },
  {
    date: '2026-04-09',
    title: '您的申请仍在办理中',
    body: '系统于本日对您的办件进行了一次状态核查，核查结论为：正在办理中。',
  },
  {
    date: '2026-04-05',
    title: '关于您的办件办理进度的说明',
    body: '您的办件办理进度为"办理中"。如对进度有疑问，可拨打热线咨询；热线占线属于畅通的持续状态。',
  },
  {
    date: '2026-04-01',
    title: '系统维护通知',
    body: '系统将于维护窗口进行例行维护，维护期间您的办件状态仍显示为"办理中"，维护不影响状态的一致性。',
  },
];

/* ================= 页面 ================= */

export default function UserPage() {
  const { user, logout, pushToast } = useApp();

  /* ---- 未登录 ---- */
  if (!user) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '个人中心' }]} />
        <Panel title="个人中心" variant="navy">
          <Alert>
            您尚未登录，无法查看个人办件信息。未登录用户也可以浏览本站全部内容；
            登录后，我们会把您浏览过的内容记录下来，以便更好地为您服务，以及更好地向您推荐表格。
          </Alert>
          <div className="mg-user__guest">
            <div className="mg-user__guest-row">
              <span className="mg-user__guest-label">可浏览栏目</span>
              <span className="mg-user__guest-value">11 个一级栏目（与登录用户相同）</span>
            </div>
            <div className="mg-user__guest-row">
              <span className="mg-user__guest-label">可办理事项</span>
              <span className="mg-user__guest-value">0 项（登录后仍为 0 项，需另行到现场办理）</span>
            </div>
            <div className="mg-user__guest-row">
              <span className="mg-user__guest-label">可查看办件</span>
              <span className="mg-user__guest-value">0 件（登录后显示 6 件，均为办理中）</span>
            </div>
            <div className="mg-user__guest-row">
              <span className="mg-user__guest-label">积分</span>
              <span className="mg-user__guest-value">0 分（登录后仍为 0 分）</span>
            </div>
          </div>
          <div className="mg-static__actions">
            <Button variant="primary" onClick={() => navigate('/login')}>
              立即登录
            </Button>
            <Button onClick={() => navigate('/register')}>注册新账号</Button>
            <Link to="/" className="mg-user__home-link">
              先去逛逛
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  /* ---- 已登录 ---- */
  const doneCount = MY_CASES.filter((c) => c.status === '已办结').length;

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '个人中心' }]} />

      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__side">
          <Panel title="我的资料" variant="navy">
            <div className="mg-static__rows">
              <div className="mg-static__row">
                <span className="mg-static__row-label">用户名</span>
                <span className="mg-static__row-value">{user.name}</span>
              </div>
              <div className="mg-static__row">
                <span className="mg-static__row-label">用户等级</span>
                <span className="mg-static__row-value">{user.level}</span>
              </div>
              <div className="mg-static__row">
                <span className="mg-static__row-label">注册日期</span>
                <span className="mg-static__row-value">{user.since}</span>
              </div>
              <div className="mg-static__row">
                <span className="mg-static__row-label">实名状态</span>
                <span className="mg-static__row-value">已认证（认证材料未收到，按已认证处理）</span>
              </div>
              <div className="mg-static__row">
                <span className="mg-static__row-label">绑定账号</span>
                <span className="mg-static__row-value">7 个（统一认证后保留 6 个）</span>
              </div>
              <div className="mg-static__row">
                <span className="mg-static__row-label">最近登录</span>
                <span className="mg-static__row-value">本次登录（上一次登录时间不予展示）</span>
              </div>
            </div>
          </Panel>

          <Panel title="我的积分" variant="red">
            <div className="mg-user__points">
              <div className="mg-user__points-value">0</div>
              <div className="mg-user__points-unit">分</div>
            </div>
            <Progress percent={0} />
            <div className="mg-user__points-note">
              距离下一等级还需 10,000 分。等级共 5 级，当前为第 1 级；
              第 2 级至第 5 级的积分要求分别为 10,000 / 50,000 / 200,000 / 1,000,000 分。
            </div>
            <div className="mg-static__note">
              积分规则：每办结 1 件获得 10 分；积分于办结后 60 个工作日内到账。
              因系统升级，积分到账时间另行通知，本年度暂不到账。
            </div>
            <div className="mg-static__actions">
              <Button
                size="sm"
                onClick={() =>
                  pushToast('积分兑换', '当前积分为 0 分，可兑换商品 0 件。兑换需积分满 10,000 分，且需到现场办理。')
                }
              >
                积分兑换
              </Button>
            </div>
          </Panel>

          <Panel title="退出登录">
            <div className="mg-static__note">退出后，您的浏览记录将保留在本地，以便下次为您提供更连贯的服务。</div>
            <div className="mg-static__actions">
              <Button onClick={logout}>退出当前账号</Button>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__main">
          <Panel
            title="我的办件"
            extra={<span className="mg-gov__count">共 {MY_CASES.length} 件 / 已办结 {doneCount} 件</span>}
          >
            <Alert tone="gray">
              本页办件数据每 30 分钟同步一次。同步时间为每日 00:00—24:00，同步期间数据不更新，
              属正常现象，不影响办件本身。
            </Alert>
            <div className="mg-gov__table-wrap">
              <table className="mg-table mg-table--compact mg-gov__table">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>办件编号</th>
                    <th>事项名称</th>
                    <th style={{ width: 100 }}>提交日期</th>
                    <th style={{ width: 110 }}>当前状态</th>
                    <th style={{ width: 100 }}>预计办结</th>
                    <th style={{ width: 260 }}>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {MY_CASES.map((c) => (
                    <tr key={c.id}>
                      <td className="mg-gov__docno">{c.id}</td>
                      <td>{c.name}</td>
                      <td className="mg-gov__num">{c.date}</td>
                      <td>
                        <span className={`mg-user__status${c.status === '办理中' ? ' is-pending' : ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="mg-gov__num">{c.due}</td>
                      <td className="mg-gov__remark">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mg-static__note">
              预计办结时间为承诺时限；实际办结时间以办结时间为准。
              如已超过预计办结时间，说明办件仍在办理中，请耐心等待或重新提交（重新提交需重新排队）。
            </div>
          </Panel>

          <Panel
            title="我的消息"
            extra={<span className="mg-gov__count">共 {MY_MESSAGES.length} 条 / 未读 0 条</span>}
          >
            <div className="mg-user__msgs">
              {MY_MESSAGES.map((m) => (
                <div className="mg-user__msg" key={m.date + m.title}>
                  <div className="mg-user__msg-head">
                    <span className="mg-user__msg-title">{m.title}</span>
                    <span className="mg-user__msg-date">{m.date}</span>
                  </div>
                  <div className="mg-user__msg-body">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="mg-static__note">
              全部 {MY_MESSAGES.length} 条消息均为"正在办理中"类通知，属正常情况。
              消息不支持删除与标记已读，以保证消息的完整性。
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
