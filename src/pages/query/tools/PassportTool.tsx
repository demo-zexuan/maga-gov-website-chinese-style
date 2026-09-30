/**
 * 护照办理进度查询工具
 *
 * I. 功能
 *
 * 1. 受理编号校验（12 位：2 位字母 + 10 位数字），输入时自动转大写并过滤非法字符
 * 2. 提交后进入加载态，随后渲染四环节时间轴：已受理 → 审核中 → 制作中 → 待领取
 * 3. 时间轴恒停在「审核中」，并给出该环节已持续的工作日数
 * 4. 前置编号不在受理号段内时返回「未查询到受理编号」的错误态
 *
 * II. 黑色幽默落点
 *
 * 1. 线上结果提示「如需加急，请到现场办理」，同页公示的现场须知写着「如需加急，请在线预约」
 * 2. 承诺时限 15 个工作日，已办理 26 个工作日，超出部分不计入承诺时限
 * 3. 未查询到编号时，说明录入工作于护照制作完成后启动（即先制作、后录入）
 *
 * @module pages/query/tools/PassportTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Badge, Button, Field, Loading, Panel } from '@/components/ui';
import ToolShell from '@/pages/query/ToolShell';
import {
  QueryIdle,
  ResultPanel,
  ResultRow,
  formatDateCn,
  useSimulatedQuery,
} from '@/pages/query/shared';
import {
  PASSPORT_CODE_LENGTH,
  PASSPORT_PREFIXES,
  PASSPORT_STAGES,
  PASSPORT_STUCK_WORKDAYS,
} from '@/data/query-data';

/** 护照查询结果 */
interface PassportResult {
  code: string;
  acceptDate: string;
  stageIndex: number;
  doneWorkdays: number;
  overWorkdays: number;
}

/** 受理编号中隐含的受理日期；日期非法时返回空串 */
function readAcceptDate(code: string): string {
  const digits = code.slice(2);
  if (digits.length < 8) return '';
  const y = digits.slice(0, 4);
  const m = Number(digits.slice(4, 6));
  const d = Number(digits.slice(6, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31) return '';
  return `${y}-${`${m}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`;
}

/** 四环节时间轴：doneIndex 之前的环节显示为已完成，doneIndex 显示为进行中 */
function PassportTimeline({ acceptDate, currentIndex }: { acceptDate: string; currentIndex: number }) {
  return (
    <div className="mg-q-timeline">
      {PASSPORT_STAGES.map((stage, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const state = done ? 'is-done' : current ? 'is-current' : '';
        return (
          <div key={stage.key} className={`mg-q-timeline__item ${state}`}>
            <div className="mg-q-timeline__dot">{index + 1}</div>
            <div className="mg-q-timeline__body">
              <div className="mg-q-timeline__name">
                {stage.name}
                {done && <Badge tone="green">已完成</Badge>}
                {current && <Badge tone="red">进行中</Badge>}
                {!done && !current && <Badge tone="outline">未开始</Badge>}
              </div>
              <div className="mg-q-timeline__note">{stage.note}</div>
              <div className="mg-q-timeline__date">
                {done && acceptDate ? `完成时间：${formatDateCn(acceptDate)}` : null}
                {current
                  ? `已持续 ${PASSPORT_STUCK_WORKDAYS.toLocaleString('en-US')} 个工作日（不含法定节假日、双休日及工作日）`
                  : null}
                {!done && !current ? '进入本环节时间：另行通知' : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PassportTool() {
  // I. 表单状态
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // II. 页内提示（加急申请等次级操作的答复）
  const [notice, setNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<PassportResult>(1500);

  /** 校验受理编号，返回错误文案（通过时返回 null） */
  const validateCode = (value: string): string | null => {
    if (!value.trim()) return '请填写受理编号。受理编号见受理回执右上角。';
    if (value.length !== PASSPORT_CODE_LENGTH) {
      return `受理编号应为 ${PASSPORT_CODE_LENGTH} 位。若您的回执上为 11 位，请按回执原件上的 ${PASSPORT_CODE_LENGTH} 位编号填写。`;
    }
    if (!/^[A-Z]{2}\d{10}$/.test(value)) {
      return '受理编号格式不符。受理编号由 2 位字母与 10 位数字组成，中间不加空格与连字符。';
    }
    return null;
  };

  /** 提交查询 */
  const submit = () => {
    const codeError = validateCode(code);
    setError(codeError);
    setNotice(null);
    if (codeError) return;

    query.run(() => {
      const prefix = code.slice(0, 2);
      if (!PASSPORT_PREFIXES.includes(prefix)) {
        return {
          ok: false,
          message: `未查询到该受理编号。若编号无误，该编号可能尚未录入系统；录入工作于护照制作完成后启动。可受理的编号号段为 ${PASSPORT_PREFIXES.join(' / ')}。`,
        };
      }
      return {
        ok: true,
        data: {
          code,
          acceptDate: readAcceptDate(code),
          stageIndex: 1,
          doneWorkdays: 26,
          overWorkdays: 11,
        },
      };
    });
  };

  /** 重置表单与结果 */
  const resetAll = () => {
    setCode('');
    setError(null);
    setNotice(null);
    query.reset();
  };

  return (
    <ToolShell
      tool="passport"
      title="护照办理进度查询"
      lead={
        <>
          本事项用于按受理编号查询护照制作进度。查询结果每小时更新一次，更新期间显示上一次更新结果。
          受理编号见受理回执右上角，回执在领取护照时发放。
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
          label="受理编号"
          required
          hint={`${PASSPORT_CODE_LENGTH} 位：2 位字母 + 10 位数字，字母号段为 ${PASSPORT_PREFIXES.join(' / ')}，示例 PA2026041201。`}
          error={error ?? undefined}
        >
          <input
            className="mg-input mg-input--code"
            value={code}
            maxLength={PASSPORT_CODE_LENGTH}
            placeholder="PA2026041201"
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, PASSPORT_CODE_LENGTH)
              )
            }
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
            本查询不显示审核意见。审核意见在审核结束后以邮寄方式告知，邮寄地址以受理时填写的地址为准。
          </span>
        </div>
      </form>

      {/* ---------- II. 查询状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请填写受理编号后提交查询。未提交时，时间轴不显示任何环节。" />
      )}

      {query.status === 'loading' && <Loading text="正在调取受理记录，请稍候…" />}

      {query.status === 'error' && (
        <>
          <Alert tone="red">{query.error}</Alert>
          <div className="mg-q-after-error">
            <Button size="sm" onClick={resetAll}>
              重新填写
            </Button>
            <span>编号录入系统的次日 00:00 起可查询，录入当日不可查询。</span>
          </div>
        </>
      )}

      {query.status === 'done' && query.data && (
        <>
          <div className="mg-q-subtitle">办理环节</div>
          <PassportTimeline acceptDate={query.data.acceptDate} currentIndex={query.data.stageIndex} />

          <ResultPanel
            title="受理与时限"
            footnote={
              <>
                备注：承诺时限不计入等待时间。等待时间不计入办理时间。办理时间从本环节结束后起算。
              </>
            }
            actions={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    setNotice(
                      '加急申请已受理。加急审核时限为 15 个工作日，与普通办理时限一致。加急申请不改变办理顺序。'
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
            <ResultRow label="受理编号" value={query.data.code} />
            <ResultRow label="受理机关" value="联邦国务院领事事务局 第三受理中心" />
            <ResultRow
              label="受理日期"
              value={query.data.acceptDate ? formatDateCn(query.data.acceptDate) : '以受理回执为准'}
            />
            <ResultRow label="承诺时限" value="15 个工作日" />
            <ResultRow label="已办理" value={`${query.data.doneWorkdays} 个工作日`} />
            <ResultRow
              label="超出承诺时限"
              value={`${query.data.overWorkdays} 个工作日（不计入承诺时限）`}
            />
            <ResultRow label="当前环节" value={`审核中（已持续 ${PASSPORT_STUCK_WORKDAYS} 个工作日）`} />
            <ResultRow label="预计完成时间" value="另行通知" />
            <ResultRow label="领取方式" value="到受理网点领取或邮寄（以受理时选择的方式为准）" />
          </ResultPanel>

          {/* 互相指路的两份提示：本页最具辨识度的一处矛盾 */}
          <div className="mg-q-pair">
            <div className="mg-q-pair__box">
              <div className="mg-q-pair__head">线上查询结果提示</div>
              <p>如需加急，请到现场办理。</p>
            </div>
            <div className="mg-q-pair__box">
              <div className="mg-q-pair__head">现场办理须知（本页公示）</div>
              <p>如需加急，请在线预约。</p>
            </div>
          </div>
          <div className="mg-q-pair__foot">
            两项提示均为有效提示。具体办理方式以受理机关现场解释为准，现场解释以本页提示为准。
          </div>

          {notice && <Alert tone="red">{notice}</Alert>}
        </>
      )}

      {/* ---------- III. 加急服务说明 ---------- */}
      <Panel title="加急服务说明" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>加急服务可将办理时限缩短至 12 个工作日，前提是您不需要加急。</li>
          <li>加急审核本身需要 15 个工作日，加急审核期间不计入办理时限。</li>
          <li>加急申请一经提交不可撤销。撤销申请需另行提交，撤销审核时限为 15 个工作日。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
