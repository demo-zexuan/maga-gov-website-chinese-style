/**
 * 退税进度查询工具
 *
 * I. 功能
 *
 * 1. 社会保障号校验 + 申报金额校验（必填、正数、不超过单笔处理上限）
 * 2. 提交后进入加载态，返回固定进度条（61%）与状态文案
 * 3. 无论输入什么，状态恒为「处理中」，并给出预计到账时间 21 个工作日
 * 4. 页内提供「申请加急」，给出通道关闭的正式答复
 *
 * II. 黑色幽默落点
 *
 * 1. 状态自 2019 年 3 月 14 日起未发生变化，页面同时给出精确的已持续天数
 * 2. 进度条为固定展示值，与处理进度无关
 * 3. 加急通道在状态冻结的同一天关闭
 * 4. 错误态：记录正在异地处理，而本系统不显示异地处理中的记录
 *
 * @module pages/query/tools/TaxRefundTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Button, Field, Loading, Panel, Progress } from '@/components/ui';
import ToolShell from '@/pages/query/ToolShell';
import {
  QueryIdle,
  ResultPanel,
  ResultRow,
  daysSince,
  formatDateCn,
  formatMoney,
  formatSsn,
  maskSsn,
  useSimulatedQuery,
  validateSsn,
} from '@/pages/query/shared';
import {
  TAX_ACCEPTED_DATE,
  TAX_ETA_WORKDAYS,
  TAX_PROGRESS_PERCENT,
} from '@/data/query-data';

/** 单笔申报金额上限 */
const AMOUNT_LIMIT = 1_000_000;

/** 退税查询结果 */
interface TaxRefundResult {
  ssnMasked: string;
  amount: number;
  acceptedDate: string;
  frozenDays: number;
}

export default function TaxRefundTool() {
  // I. 表单状态
  const [ssn, setSsn] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ ssn?: string; amount?: string }>({});

  // II. 页内提示（加急申请等次级操作的答复）
  const [notice, setNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<TaxRefundResult>(1400);

  /** 校验申报金额，返回错误文案（通过时返回 null） */
  const validateAmount = (value: string): string | null => {
    const trimmed = value.replace(/,/g, '').trim();
    if (!trimmed) return '请填写申报金额。';
    const n = Number(trimmed);
    if (Number.isNaN(n)) return '申报金额应为数字，可保留两位小数。';
    if (n <= 0) {
      return '申报金额应大于 0。零金额申报属无效申报，本系统仍会将其记录为一次有效查询。';
    }
    if (n > AMOUNT_LIMIT) {
      return `申报金额超过本系统单笔处理上限（${formatMoney(AMOUNT_LIMIT)}）。请分次申报，分次申报金额合计不得超过单笔上限。`;
    }
    return null;
  };

  /** 提交查询 */
  const submit = () => {
    const ssnError = validateSsn(ssn);
    const amountError = validateAmount(amount);
    setErrors({ ssn: ssnError ?? undefined, amount: amountError ?? undefined });
    setNotice(null);
    if (ssnError || amountError) return;

    const parsed = Number(amount.replace(/,/g, '').trim());
    query.run(() => {
      // 末四位为 0000 的号段视为异地处理记录，用于呈现查询失败的错误态
      if (ssn.replace(/\D/g, '').endsWith('0000')) {
        return {
          ok: false,
          message:
            '查询失败：该申报记录正在异地处理中。本系统不显示异地处理中的记录，异地处理进度请在本系统查询。',
        };
      }
      return {
        ok: true,
        data: {
          ssnMasked: maskSsn(ssn),
          amount: parsed,
          acceptedDate: TAX_ACCEPTED_DATE,
          frozenDays: daysSince(TAX_ACCEPTED_DATE),
        },
      };
    });
  };

  /** 重置表单与结果 */
  const resetAll = () => {
    setSsn('');
    setAmount('');
    setErrors({});
    setNotice(null);
    query.reset();
  };

  return (
    <ToolShell
      tool="tax-refund"
      title="退税申报进度查询"
      lead={
        <>
          本事项用于查询个人所得税退税申报的处理进度。查询结果为本系统实时状态，
          状态未发生变化时，本系统仍显示上一个状态。
        </>
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
          label="社会保障号"
          required
          hint="格式 XXX-XX-XXXX，输入数字后自动补连字符。"
          error={errors.ssn}
        >
          <input
            className="mg-input"
            value={ssn}
            maxLength={11}
            inputMode="numeric"
            placeholder="000-00-0000"
            onChange={(e) => setSsn(formatSsn(e.target.value))}
          />
        </Field>

        <Field
          label="申报金额"
          required
          hint="单位：美元。请填写申报表上的金额，系统不对金额进行核对。"
          error={errors.amount}
        >
          <input
            className="mg-input mg-input--code"
            value={amount}
            inputMode="decimal"
            placeholder="例如 1200.00"
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, '').slice(0, 12))}
          />
        </Field>

        <div className="mg-q-form-actions">
          <Button variant="primary" type="submit" disabled={query.busy}>
            查询进度
          </Button>
          <Button type="button" onClick={resetAll}>
            重置
          </Button>
          <span className="mg-q-form-actions__note">
            同一申报记录重复查询不产生新结果。如产生新结果，说明状态已更新。
          </span>
        </div>
      </form>

      {/* ---------- II. 查询状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请填写社会保障号与申报金额后提交查询。本查询不校验申报金额的准确性。" />
      )}

      {query.status === 'loading' && <Loading text="正在连接退税处理系统，请稍候…" />}

      {query.status === 'error' && (
        <>
          <Alert tone="red">{query.error}</Alert>
          <div className="mg-q-after-error">
            <Button size="sm" onClick={resetAll}>
              重新填写
            </Button>
            <span>异地处理中的记录将在处理完成后转入本系统，转入时间以转入时间为准。</span>
          </div>
        </>
      )}

      {query.status === 'done' && query.data && (
        <>
          <ResultPanel
            title="退税申报处理进度"
            footnote={
              <>
                备注：进度条每月更新一次，上次更新时间为 {formatDateCn(TAX_ACCEPTED_DATE)}。
                该数值为固定展示值，与实际处理进度无关。
              </>
            }
            actions={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setNotice(
                      `加急通道已于 ${formatDateCn(TAX_ACCEPTED_DATE)} 关闭。加急申请须在通道开放期间提交，通道关闭期间的加急申请不予受理。`
                    )
                  }
                >
                  申请加急
                </Button>
                <Button size="sm" onClick={resetAll}>
                  重新查询
                </Button>
              </>
            }
          >
            <ResultRow label="查询人" value={query.data.ssnMasked} />
            <ResultRow label="申报金额" value={formatMoney(query.data.amount)} />
            <ResultRow label="受理日期" value={formatDateCn(query.data.acceptedDate)} />
            <ResultRow label="当前状态" value="处理中" />
            <ResultRow
              label="状态持续天数"
              value={`${query.data.frozenDays.toLocaleString('en-US')} 天（自 ${query.data.acceptedDate} 起）`}
            />
            <ResultRow label="预计到账时间" value={`${TAX_ETA_WORKDAYS} 个工作日`} />
            <ResultRow label="承办部门" value="联邦国内税务局 退税处理中心（第三分中心）" />
            <ResultRow label="款项支付方式" value="原路退回（原路已不可用，届时另行通知）" />
          </ResultPanel>

          <div className="mg-q-progress">
            <div className="mg-q-progress__head">
              <span>处理进度</span>
              <span>{TAX_PROGRESS_PERCENT}%（上次更新：{formatDateCn(TAX_ACCEPTED_DATE)}）</span>
            </div>
            <Progress percent={TAX_PROGRESS_PERCENT} red />
          </div>

          <Alert tone="yellow">
            无论申报金额多少，本页面显示的状态均为处理中。该状态自 {formatDateCn(TAX_ACCEPTED_DATE)}{' '}
            起未发生变化，已持续 {query.data.frozenDays.toLocaleString('en-US')} 天。
            如 {TAX_ETA_WORKDAYS} 个工作日后仍未到账，请于 {TAX_ETA_WORKDAYS} 个工作日后再次查询。
          </Alert>

          {notice && <Alert tone="red">{notice}</Alert>}
        </>
      )}

      {/* ---------- III. 到账时间说明 ---------- */}
      <Panel title="到账时间说明" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>预计到账时间为 {TAX_ETA_WORKDAYS} 个工作日，自受理之日起算，起算之日不计入工作日。</li>
          <li>到账时间不因查询次数、查询频率或查询语气发生变动。</li>
          <li>款项到账后，本页面状态将更新为已到账；更新所需时间为 21 个工作日。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
