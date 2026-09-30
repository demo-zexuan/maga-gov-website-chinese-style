/**
 * 交通罚单查询工具
 *
 * I. 功能
 *
 * 1. 车牌校验（2 至 8 位字母或数字）与州别校验
 * 2. 提交后进入加载态，随后渲染罚单表格：罚单编号、违章日期、事由、地点、金额、状态、备注
 * 3. 合计应缴金额按"需缴纳且系统有记录"的口径计算，并在页脚说明口径
 * 4. 在线缴纳给出支付网关的维护窗口；申诉入口给出关闭原因
 * 5. 勾选「跨州共享查询」触发系统错误态；选择「其他地区」触发未接入的空态
 *
 * II. 黑色幽默落点
 *
 * 1. 一张 1974 年的历史罚单：追缴时效届满 51 年，因系统未设注销功能而继续保留
 * 2. 一张 0 美元的罚单：无需缴纳，但结案手续须本人到场办理
 * 3. 一张"已缴纳但系统未记录"的罚单：需提供凭证，而凭证须由本系统出具
 * 4. 支付网关维护窗口为每日 00:00-24:00
 *
 * @module pages/query/tools/TicketTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Badge, Button, Field, Loading, Panel } from '@/components/ui';
import { USMapGrid } from '@/components/art';
import ToolShell from '@/pages/query/ToolShell';
import {
  QueryIdle,
  ResultPanel,
  ResultRow,
  formatMoney,
  useSimulatedQuery,
} from '@/pages/query/shared';
import { QUERY_STATES, buildTicketRecords } from '@/data/query-data';
import type { TicketRecord } from '@/data/query-data';

/** 罚单查询结果 */
interface TicketResult {
  plate: string;
  stateCode: string;
  stateName: string;
  records: TicketRecord[];
  /** 合计应缴（需缴纳且有系统记录的金额之和） */
  totalDue: number;
}

export default function TicketTool() {
  // I. 表单状态
  const [plate, setPlate] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [shared, setShared] = useState(false);
  const [errors, setErrors] = useState<{ plate?: string; state?: string }>({});

  // II. 页内提示（缴纳与申诉等次级操作的答复）
  const [notice, setNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<TicketResult>(1300);
  const stateName = QUERY_STATES.find((s) => s.code === stateCode)?.name ?? '';

  /** 校验车牌，返回错误文案（通过时返回 null） */
  const validatePlate = (value: string): string | null => {
    if (!value.trim()) return '请填写车牌号码。';
    if (!/^[A-Z0-9]{2,8}$/.test(value)) {
      return '车牌格式不符。本系统可识别的车牌为 2 至 8 位字母或数字；您所在州使用的车牌格式可能尚未纳入本系统。';
    }
    return null;
  };

  /** 提交查询 */
  const submit = () => {
    const plateError = validatePlate(plate);
    const stateError = stateCode ? null : '请选择车辆登记州别。';
    setErrors({ plate: plateError ?? undefined, state: stateError ?? undefined });
    setNotice(null);
    if (plateError || stateError) return;

    query.run(() => {
      // 实验功能：跨州共享查询，自上线以来未成功返回过数据
      if (shared) {
        return {
          ok: false,
          message:
            '跨州共享查询服务当前不可用。该功能自上线以来未成功返回过数据，请取消勾选后重新查询。',
        };
      }
      // 「其他地区」为未接入辖区，返回空态
      if (stateCode === 'OTHER') {
        return {
          ok: true,
          data: { plate, stateCode, stateName: '其他地区', records: [], totalDue: 0 },
        };
      }
      const records = buildTicketRecords(plate, stateName);
      const totalDue = records
        .filter((r) => r.amount > 0 && r.status !== '已缴纳（系统未记录）')
        .reduce((sum, r) => sum + r.amount, 0);
      return { ok: true, data: { plate, stateCode, stateName, records, totalDue } };
    });
  };

  /** 重置表单与结果 */
  const resetAll = () => {
    setPlate('');
    setStateCode('');
    setShared(false);
    setErrors({});
    setNotice(null);
    query.reset();
  };

  return (
    <ToolShell
      tool="ticket"
      title="交通罚单记录查询"
      lead={
        <>
          本事项用于查询车辆登记在本系统已接入州别的交通罚单记录。记录由各州机动车管理局提供，
          提供时间以提供时间为准。
        </>
      }
      aside={
        <Panel title="车辆登记州">
          <div className="mg-tilemap">
            <USMapGrid
              cell={12}
              highlight={stateCode && stateCode !== 'OTHER' ? [stateCode] : []}
              width={160}
            />
          </div>
          <div className="mg-q-hintline">
            红色格为本次查询所选州别。图例未标注的州别，其罚单数据可能尚未接入本系统。
          </div>
        </Panel>
      }
    >
      {/* ---------- I. 查询表单 ---------- */}
      <form
        className="mg-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field
          label="车牌号码"
          required
          hint="2 至 8 位字母或数字，不区分大小写，不需要输入空格与连字符。"
          error={errors.plate}
        >
          <input
            className="mg-input mg-input--code"
            value={plate}
            maxLength={8}
            placeholder="例如 ABC1234"
            onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          />
        </Field>

        <Field label="车辆登记州" required hint="以车辆登记证上的州别为准。" error={errors.state}>
          <select
            className="mg-select"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          >
            <option value="">请选择</option>
            {QUERY_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="查询范围">
          <label className="mg-q-agree">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
            <span>同时查询相邻州的共享记录（实验功能）</span>
          </label>
        </Field>

        <div className="mg-q-form-actions">
          <Button variant="primary" type="submit" disabled={query.busy}>
            查询罚单
          </Button>
          <Button type="button" onClick={resetAll}>
            重置
          </Button>
          <span className="mg-q-form-actions__note">
            本查询免费。查询结果不含未接入州别的记录，也不含接入州别未提供的记录。
          </span>
        </div>
      </form>

      {/* ---------- II. 查询状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请填写车牌号码并选择车辆登记州后提交查询。未提交时，本页不显示罚单记录。" />
      )}

      {query.status === 'loading' && <Loading text="正在向车辆登记州调取罚单记录，请稍候…" />}

      {query.status === 'error' && (
        <>
          <Alert tone="red">{query.error}</Alert>
          <div className="mg-q-after-error">
            <Button size="sm" onClick={resetAll}>
              重新查询
            </Button>
            <span>共享查询恢复时间以本系统公告为准。公告在恢复后发布。</span>
          </div>
        </>
      )}

      {query.status === 'done' && query.data && query.data.records.length === 0 && (
        <div className="mg-empty">
          <div className="mg-empty__icon">·</div>
          <div>暂无数据。该地区罚单数据尚未接入本系统。</div>
          <div className="mg-q-hintline">
            接入时间以本系统公告为准，公告发布于接入完成之后。接入完成的州别可在本页州别列表中查询，
            列表更新于接入完成之后。
          </div>
        </div>
      )}

      {query.status === 'done' && query.data && query.data.records.length > 0 && (
        <>
          <ResultPanel
            title={`罚单记录（${query.data.records.length} 条）`}
            footnote={
              <>
                备注：合计应缴仅统计需缴纳且系统已有记录的金额，不含金额为零的记录，
                不含状态为「已缴纳（系统未记录）」的记录。记录长期保存，本系统不提供删除服务。
              </>
            }
            actions={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setNotice(
                      '支付网关维护中。维护窗口：每日 00:00-24:00。维护期间不接受线下缴纳，线下缴纳窗口与线上维护窗口同步关闭。'
                    )
                  }
                >
                  在线缴纳
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    setNotice(
                      '申诉入口已于 2024 年 1 月关闭。关闭原因为申诉量过大。如对关闭有异议，可通过申诉入口提出。',
                    )
                  }
                >
                  提出申诉
                </Button>
                <Button size="sm" onClick={resetAll}>
                  重新查询
                </Button>
              </>
            }
          >
            <ResultRow label="车牌号码" value={query.data.plate} />
            <ResultRow label="车辆登记州" value={query.data.stateName} />
            <ResultRow label="记录条数" value={`${query.data.records.length} 条`} />
            <ResultRow
              label="合计应缴"
              value={`${formatMoney(query.data.totalDue)}（口径见下方说明）`}
            />
          </ResultPanel>

          <table className="mg-table mg-q-tickets">
            <thead>
              <tr>
                <th>罚单编号</th>
                <th>违章日期</th>
                <th>违章事由</th>
                <th>地点</th>
                <th>应缴金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {query.data.records.map((r) => (
                <tr key={r.id}>
                  <td className="mg-q-tickets__id">{r.id}</td>
                  <td className="mg-q-tickets__date">{r.date}</td>
                  <td>{r.reason}</td>
                  <td>{r.place}</td>
                  <td className="mg-q-tickets__amount">{formatMoney(r.amount)}</td>
                  <td>
                    <Badge tone={r.status === '未缴纳' || r.status === '已缴纳（系统未记录）' ? 'red' : 'outline'}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mg-q-tickets__remarks">
            {query.data.records.map((r) => (
              <div key={`${r.id}-remark`} className="mg-q-tickets__remark">
                <span className="mg-q-tickets__remark-id">{r.id}</span>
                <span>{r.remark}</span>
              </div>
            ))}
          </div>

          {notice && <Alert tone="red">{notice}</Alert>}

          <Alert tone="yellow">
            缴纳成功的记录将在 5 个工作日内更新为已缴纳。更新期间状态仍显示为未缴纳，
            此时请勿重复缴纳；重复缴纳的款项不予退还，可申请冲抵，冲抵申请须在缴纳后 5 个工作日内提出。
          </Alert>
        </>
      )}

      {/* ---------- III. 缴纳说明 ---------- */}
      <Panel title="缴纳与申诉说明" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>本系统不代收罚款，缴纳通过支付网关办理，网关维护期间无法缴纳。</li>
          <li>对罚单有异议的，可通过申诉渠道提出。申诉渠道当前关闭，关闭状态不影响本条说明的有效性。</li>
          <li>罚单记录长期保存。注销记录需提出申请，申请须在记录保存期内提出。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
