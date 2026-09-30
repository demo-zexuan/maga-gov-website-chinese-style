/**
 * 政务服务 —— 办事进度查询
 *
 * I. 职责
 *
 * 1. 受理编号 + 4 位数字验证码（真实生成、真实校验）的表单。
 * 2. 提交后进度条走到 99% 即停住，永远差 1%。
 * 3. 提供 3 个示例编号一键填入，并记录每次查询（每次都是 99%）。
 *
 * II. 核心梗的写法
 *
 * 1. 99% 不是 bug，是「系统保留进度」。
 * 2. 剩余 1% 由人工确认，人工确认通道暂未开通。
 * 3. 已办结的办件同样显示 99% —— 办结与进度条互不影响。
 * 4. 每次查询都会重新走一遍动画，因此每次都在"即将办结"。
 *
 * @module pages/service/TrackPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Crumbs, Field, Panel, Progress } from '@/components/ui';
import { Link } from '@/router';
import { useApp } from '@/app-context';
import { CASE_RECORDS, findCaseRecord, SERVICE_TODAY } from '@/data/service-extra';

/* ---------------- 工具 ---------------- */

/** 生成 4 位数字验证码（1000-9999，首位不为 0） */
function makeCaptcha(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** 当前时刻 HH:mm:ss */
function nowTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

/** 受理编号格式：USPCS-年份-6 位数字 */
const RECEIPT_RE = /^USPCS-\d{4}-\d{6}$/;

/** 示例编号：取自办件公示，覆盖办理中 / 已办结 / 待补正三种状态 */
const SAMPLE_IDS = ['USPCS-2026-104301', 'USPCS-2026-104271', 'USPCS-2026-104403'];

interface QueryLog {
  seq: number;
  time: string;
  percent: number;
}

/* ---------------- 页面 ---------------- */

export default function TrackPage() {
  const { pushToast } = useApp();

  const [no, setNo] = useState('');
  const [code, setCode] = useState('');
  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [error, setError] = useState('');

  const [checked, setChecked] = useState(false);
  const [percent, setPercent] = useState(0);
  const [stalledSec, setStalledSec] = useState(0);
  const [round, setRound] = useState(0);
  const [logs, setLogs] = useState<QueryLog[]>([]);

  const record = checked ? findCaseRecord(no) : undefined;

  // 进度动画：推进到 99% 后停止，永不越过
  useEffect(() => {
    if (!checked) return;
    setPercent(0);
    setStalledSec(0);
    const timer = window.setInterval(() => {
      setPercent((p) => (p >= 99 ? 99 : Math.min(99, p + 3)));
    }, 60);
    return () => window.clearInterval(timer);
  }, [checked, round]);

  // 进度停在 99% 后开始计时，用于展示"已保持 99% 共 N 秒"
  useEffect(() => {
    if (!checked || percent < 99) return;
    const timer = window.setInterval(() => setStalledSec((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [checked, percent]);

  /** 记录一次查询并重新播放进度动画 */
  const logQuery = () => {
    setLogs((prev) => [...prev, { seq: prev.length + 1, time: nowTime(), percent: 99 }]);
    setRound((r) => r + 1);
  };

  /** 提交查询：校验受理编号与验证码 */
  const onSubmit = () => {
    const value = no.trim().toUpperCase();
    if (!value) {
      setError('请输入受理编号。受理编号为办理完成后系统给出的 18 位编号。');
      return;
    }
    if (!RECEIPT_RE.test(value)) {
      setError(
        '受理编号格式不正确。正确格式为 USPCS-2026-XXXXXX，其中 2026 为受理年度，受理年度不等于办结年度。'
      );
      return;
    }
    if (code.trim() !== captcha) {
      setError('验证码不正确。验证码不区分大小写。');
      setCaptcha(makeCaptcha());
      setCode('');
      return;
    }
    setError('');
    setNo(value);
    setChecked(true);
    logQuery();
  };

  /** 刷新进度：重新查询，结果保持不变 */
  const onRefresh = () => {
    logQuery();
    pushToast('进度更新', '进度已更新：99%。本次刷新消耗查询次数 1 次，查询次数不设上限。');
  };

  /** 结果首行文案：状态不同，进度相同 */
  const headline = () => {
    if (!record) {
      return '未查询到该受理编号的办件信息。系统仍按 99% 显示，以与其他办件的显示保持一致。';
    }
    switch (record.status) {
      case '已办结':
        return `该申请已办结，办结日期 ${record.finishDate}。办理进度 99%。`;
      case '已退回':
        return `该申请已退回。退回原因见下表。办理进度 99%。`;
      case '待补正':
        return `该申请等待补正材料。请按窗口要求补正后重新提交。办理进度 99%。`;
      case '已受理':
        return '您的申请已受理，正在排队等待办理。即将办结。';
      default:
        return '您的申请正在办理中，即将办结。';
    }
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '政务服务', to: '/service' }, { label: '办事进度查询' }]} />

      <div className="mg-layout-3col">
        {/* ---------------- 中栏：表单与结果 ---------------- */}
        <div className="mg-layout__main">
          <Panel title="办事进度查询">
            <Alert tone="yellow">
              查询服务每日 00:00-24:00 开放。每日 00:00 为系统日结时间，日结期间查询结果可能略有延迟，
              延迟时长以实际延迟时长为准。
            </Alert>

            <Field label="受理编号" required hint="形如 USPCS-2026-104271，可在受理回执上找到。">
              <input
                className="mg-input mg-svc-track__no"
                value={no}
                placeholder="USPCS-2026-"
                onChange={(e) => setNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmit();
                }}
                aria-label="受理编号"
              />
            </Field>

            <Field
              label="验证码"
              required
              hint="看不清可点击验证码刷新。验证码不区分大小写。"
              error={error || undefined}
            >
              <div className="mg-svc-captcha-row">
                <input
                  className="mg-input mg-svc-captcha-row__input"
                  value={code}
                  maxLength={4}
                  placeholder="4 位数字"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                  }}
                  aria-label="验证码"
                />
                <span
                  className="mg-svc-captcha"
                  onClick={() => {
                    setCaptcha(makeCaptcha());
                    setCode('');
                  }}
                  title="点击刷新验证码"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCaptcha(makeCaptcha());
                      setCode('');
                    }
                  }}
                >
                  {captcha}
                </span>
              </div>
            </Field>

            <div className="mg-svc-track__actions">
              <Button variant="primary" onClick={onSubmit}>
                查询进度
              </Button>
              <Button
                onClick={() => {
                  setNo('');
                  setCode('');
                  setError('');
                  setChecked(false);
                  setLogs([]);
                }}
              >
                重置
              </Button>
              <span className="mg-svc-note">
                示例编号（点击填入；验证码将一并填入，以免您因验证码错误而无法看到示例结果）：
              </span>
              {SAMPLE_IDS.map((sid) => (
                <button
                  key={sid}
                  type="button"
                  className="mg-svc-sample"
                  onClick={() => {
                    setNo(sid);
                    setCode(captcha);
                    setError('');
                  }}
                >
                  {sid}
                </button>
              ))}
            </div>
          </Panel>

          {!checked ? (
            <Panel title="查询结果">
              <div className="mg-empty">
                <div className="mg-empty__icon">※</div>
                <div>请在上方输入受理编号后查询。</div>
                <div className="mg-svc-note">
                  若您尚未提交申请，请先提交申请；提交后本页将显示 99%。
                </div>
                <div className="mg-svc-note">
                  若您已办结，本页将显示「已办结」，进度条仍为 99%。
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title={`查询结果（受理编号 ${no}）`}>
              <div className="mg-svc-track__headline">{headline()}</div>

              <div className="mg-svc-track__gauge">
                <div className="mg-svc-track__percent">{percent}%</div>
                <div className="mg-svc-track__bar">
                  <Progress percent={percent} red={percent >= 99} />
                </div>
              </div>

              <div className="mg-svc-track__stall">
                <b>
                  您的申请正在办理中，即将办结。距办结还差 {100 - percent}%。
                </b>
                <span>
                  该 {100 - percent}% 为系统保留进度，用于显示进度条，不计入办理时限。
                  当前进度已保持 {stalledSec} 秒。
                </span>
              </div>

              <div className="mg-table-scroll mg-svc-scroll--track">
                <table className="mg-table" style={{ marginTop: 8 }}>
                  <tbody>
                    <tr>
                      <th style={{ width: 150 }}>受理编号</th>
                      <td>{no}</td>
                      <th style={{ width: 150 }}>办件状态</th>
                      <td>{record ? record.status : '系统中未查询到（按已受理显示）'}</td>
                    </tr>
                    <tr>
                      <th>事项名称</th>
                      <td>{record ? record.serviceName : '综合受理事项'}</td>
                      <th>承办窗口</th>
                      <td>{record ? record.window : 'A-01 综合受理'}</td>
                    </tr>
                    <tr>
                      <th>受理日期</th>
                      <td>{record ? record.applyDate : SERVICE_TODAY}</td>
                      <th>当前环节</th>
                      <td>
                        {record && record.status === '已办结'
                          ? '已办结（共 3 个环节）'
                          : '终审（第 3 个环节，共 3 个环节）'}
                      </td>
                    </tr>
                    <tr>
                      <th>已办用时</th>
                      <td>47 个工作日</td>
                      <th>承诺办结时限</th>
                      <td>15 个工作日</td>
                    </tr>
                    <tr>
                      <th>超期天数</th>
                      <td>32 个工作日（状态：正常办理中）</td>
                      <th>队列前方</th>
                      <td>3,412 位（与上次查询一致）</td>
                    </tr>
                    <tr>
                      <th>上次进度变化</th>
                      <td>1,284 天前</td>
                      <th>当前进度</th>
                      <td>
                        {percent}%（系统保留 1%）
                      </td>
                    </tr>
                    {record?.remark && (
                      <tr>
                        <th>办件备注</th>
                        <td colSpan={3}>{record.remark}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mg-svc-track__actions">
                <Button variant="primary" size="sm" onClick={onRefresh}>
                  刷新进度
                </Button>
                <span className="mg-svc-note">
                  请勿重复提交申请。重复提交将重置您的排队顺序，重置后排名从 3,412 位重新计算。
                </span>
              </div>
            </Panel>
          )}
        </div>

        {/* ---------------- 右栏：说明与查询记录 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="查询须知">
            <div className="mg-svc-note">
              1. 受理编号是查询进度的唯一凭证。遗失受理编号的，请凭有效身份证件到窗口补打回执。
            </div>
            <div className="mg-svc-note">
              2. 进度每 24 小时更新一次。更新时间为每日 09:00；09:00 未更新的，当日不更新。
            </div>
            <div className="mg-svc-note">
              3. 进度条 99% 为正常显示，不代表办件异常。办结后进度亦显示 99%。
            </div>
            <div className="mg-svc-note">
              4. 本页面不接受加急申请。加急申请请到窗口提交，窗口不受理加急申请。
            </div>
          </Panel>

          <Panel title="本次查询记录" extra={<span className="mg-svc-note">共 {logs.length} 次</span>}>
            {logs.length === 0 ? (
              <div className="mg-empty mg-svc-empty-sm">
                <div>暂无查询记录。本栏目自您首次查询起有内容。</div>
              </div>
            ) : (
              <div className="mg-table-scroll mg-svc-scroll--log">
                <table className="mg-table mg-table--compact">
                  <thead>
                    <tr>
                      <th style={{ width: 46 }}>序号</th>
                      <th>查询时间</th>
                      <th style={{ width: 70 }}>进度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs
                      .slice()
                      .reverse()
                      .map((l) => (
                        <tr key={l.seq}>
                          <td style={{ textAlign: 'center' }}>{l.seq}</td>
                          <td>{l.time}</td>
                          <td style={{ textAlign: 'center' }}>{l.percent}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mg-svc-note">
              同一编号多次查询的进度差值恒为 0。差值为 0 表示办件状态稳定。
            </div>
          </Panel>

          <Panel title="相关服务">
            <ul className="mg-list mg-svc-links">
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/service/records" className="mg-list__text">
                  办件公示（{CASE_RECORDS.length} 条）
                </Link>
              </li>
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/service" className="mg-list__text">
                  返回办事大厅
                </Link>
              </li>
              <li className="mg-list__item">
                <span className="mg-list__bullet">•</span>
                <Link to="/service/detail/svc-refund" className="mg-list__text">
                  退税进度查询（与本站进度相互独立）
                </Link>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
