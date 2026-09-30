/**
 * 现场排队取号工具
 *
 * I. 功能
 *
 * 1. 选择业务类型后取号，取得排队号、前方等待人数与预计等待时间
 * 2. 「重新取号」生成新的号码，号码只增不减，队尾始终在队尾
 * 3. 「预约取号」给出依然需要先取号的正式答复
 *
 * II. 黑色幽默落点
 *
 * 1. 前方等待 214,882 人，按当前叫号速度预计等待 6 年 4 个月，号码当日有效
 * 2. 当日未叫到号的，次日重新取号后号码重新排至队尾
 * 3. 三个窗口中有一个暂停服务，暂停原因为设备运行正常
 *
 * @module pages/query/tools/QueueTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Button, Field, Loading, Panel } from '@/components/ui';
import ToolShell from '@/pages/query/ToolShell';
import {
  QueryIdle,
  ResultPanel,
  ResultRow,
  formatInt,
  useSimulatedQuery,
} from '@/pages/query/shared';
import {
  QUEUE_CALLING_NUMBER,
  QUEUE_SERVICE_TYPES,
  QUEUE_START_NUMBER,
  QUEUE_WINDOWS,
} from '@/data/query-data';

/** 每日叫号量（按当前叫号速度测算） */
const DAILY_CALLED = 93;

/** 排队结果 */
interface QueueResult {
  ticketNo: string;
  ahead: number;
  serviceType: string;
  etaText: string;
  isValidUntil: string;
}

/** 把等待天数折算成「N 年 M 个月」 */
function toEtaText(days: number): string {
  if (days < 1) return '当日可办';
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years === 0) return `${months} 个月`;
  return `${years} 年 ${months} 个月`;
}

export default function QueueTool() {
  // I. 表单状态
  const [serviceType, setServiceType] = useState('');
  const [error, setError] = useState<string | null>(null);

  // II. 取号序号：只增不减
  const [serial, setSerial] = useState(QUEUE_START_NUMBER);
  const [notice, setNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<QueueResult>(1100);

  /** 取号（首次取号与重新取号共用一条路径） */
  const takeNumber = () => {
    if (!serviceType) {
      setError('请选择业务类型。业务类型决定排队队列，队列之间不互通。');
      return;
    }
    setError(null);
    setNotice(null);

    // 每次取号消耗一个序号，序号只增不减
    const next = serial + 1 + Math.floor(Math.random() * 3);
    setSerial(next);

    query.run(() => {
      const ahead = next - QUEUE_CALLING_NUMBER;
      const days = Math.ceil(ahead / DAILY_CALLED);
      return {
        ok: true,
        data: {
          ticketNo: `A-${String(next).padStart(6, '0')}`,
          ahead,
          serviceType,
          etaText: toEtaText(days),
          isValidUntil: '今日 23:59',
        },
      };
    });
  };

  /** 重置 */
  const resetAll = () => {
    setServiceType('');
    setError(null);
    setNotice(null);
    query.reset();
  };

  return (
    <ToolShell
      tool="queue"
      title="现场排队取号"
      lead={
        <>
          本事项用于取得现场办事排队号。取号成功后请留意叫号，叫号不另行通知。
          号码当日有效，过号作废，作废后须重新取号。
        </>
      }
      aside={
        <Panel title="窗口状态">
          <div className="mg-q-facts">
            <div className="mg-q-facts__row">
              <span>在办窗口</span>
              <b>{QUEUE_WINDOWS} 个</b>
            </div>
            <div className="mg-q-facts__row">
              <span>暂停服务窗口</span>
              <b>1 个</b>
            </div>
            <div className="mg-q-facts__row">
              <span>暂停原因</span>
              <b>设备运行正常</b>
            </div>
            <div className="mg-q-facts__row">
              <span>当前叫号</span>
              <b>A-{String(QUEUE_CALLING_NUMBER).padStart(6, '0')}</b>
            </div>
          </div>
          <div className="mg-q-quip">叫号显示屏每 30 秒刷新一次，刷新所需时间为 30 秒。</div>
        </Panel>
      }
    >
      {/* ---------- I. 取号表单 ---------- */}
      <form
        className="mg-form"
        onSubmit={(e) => {
          e.preventDefault();
          takeNumber();
        }}
      >
        <Field
          label="业务类型"
          required
          hint="请选择与所办事项一致的业务类型。类型选择有误的，须重新取号。"
          error={error ?? undefined}
        >
          <select
            className="mg-select"
            value={serviceType}
            onChange={(e) => {
              setServiceType(e.target.value);
              setError(null);
            }}
          >
            <option value="">请选择</option>
            {QUEUE_SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <div className="mg-q-form-actions">
          <Button variant="primary" type="submit" disabled={query.busy}>
            {query.status === 'done' ? '重新取号' : '取号'}
          </Button>
          <Button
            type="button"
            onClick={() =>
              setNotice('预约取号需先取得排队号。排队号须现场取号。现场取号须先在线预约。')
            }
          >
            预约取号
          </Button>
          <Button type="button" onClick={resetAll}>
            重置
          </Button>
          <span className="mg-q-form-actions__note">
            取号免费。取号次数不限，取号次数不影响排队顺序，排队顺序以号码为准。
          </span>
        </div>
      </form>

      {notice && <Alert tone="red">{notice}</Alert>}

      {/* ---------- II. 取号状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请选择业务类型后取号。未取号时，本页不显示排队号码。" />
      )}

      {query.status === 'loading' && <Loading text="正在向叫号系统申请号码，请稍候…" />}

      {query.status === 'error' && <Alert tone="red">{query.error}</Alert>}

      {query.status === 'done' && query.data && (
        <>
          <div className="mg-q-ticket">
            <div className="mg-q-ticket__no">A-{String(serial).padStart(6, '0')}</div>
            <div className="mg-q-ticket__label">您的排队号码</div>
          </div>

          <ResultPanel
            title="排队信息"
            footnote={
              <>
                备注：预计等待时间按当前叫号速度测算，测算结果不因取号次数变动。
                叫号速度调整时，预计等待时间不随之调整。
              </>
            }
            actions={
              <>
                <Button size="sm" variant="primary" onClick={takeNumber} disabled={query.busy}>
                  重新取号（排至队尾）
                </Button>
                <Button size="sm" onClick={resetAll}>
                  清除本次号码
                </Button>
              </>
            }
          >
            <ResultRow label="排队号码" value={query.data.ticketNo} />
            <ResultRow label="业务类型" value={query.data.serviceType} />
            <ResultRow label="前方等待人数" value={`${formatInt(query.data.ahead)} 人`} />
            <ResultRow label="预计等待时间" value={query.data.etaText} />
            <ResultRow label="当前叫号" value={`A-${String(QUEUE_CALLING_NUMBER).padStart(6, '0')}`} />
            <ResultRow label="在办窗口" value={`${QUEUE_WINDOWS} 个（含 1 个暂停服务窗口）`} />
            <ResultRow label="号码有效期" value={query.data.isValidUntil} />
            <ResultRow label="过号处理" value="过号作废，须重新取号" />
          </ResultPanel>

          <Alert tone="yellow">
            本号有效期至今日 23:59。若今日未叫到号，请次日重新取号；重新取号后号码重新排至队尾。
            请勿离开现场，离开现场的请返回现场。
          </Alert>
        </>
      )}

      {/* ---------- III. 排队规则 ---------- */}
      <Panel title="排队规则" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>号码按取号顺序排列。重新取号的，号码排至队尾，原号码同时作废。</li>
          <li>叫号三次未到场的，视为过号。过号后须重新取号，重新取号不影响您已办结的事项。</li>
          <li>优先办理窗口按相关规定设置。相关规定另行公布，公布时间以公布时间为准。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
