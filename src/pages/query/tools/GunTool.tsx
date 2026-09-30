/**
 * 枪支许可预约工具
 *
 * I. 功能
 *
 * 1. 本月光标日历：按真实日期生成，禁用周末、全部周二与今日之前的日期
 * 2. 选择日期后选择时段，勾选《预约承诺书》后提交
 * 3. 前两次提交返回「所选时段已被他人预约」，并把该时段标记为已满
 * 4. 第三次提交返回「您已重试 3 次，请明日再试」，同时登记候补号并给出携带证件提示
 *
 * II. 黑色幽默落点
 *
 * 1. 每时段限 1 人，单日最大承载量 6 人，号源数量以实际放号为准
 * 2. 预约失败三次后系统自动转为候补，候补号在收到通知前不生效
 * 3. 不可预约日中，周二为系统维护日，同时充当其他维护日的备用维护日
 *
 * @module pages/query/tools/GunTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Button, Loading, Panel } from '@/components/ui';
import { useApp } from '@/app-context';
import ToolShell from '@/pages/query/ToolShell';
import { QueryIdle, ResultPanel, ResultRow, formatDateCn, useSimulatedQuery } from '@/pages/query/shared';
import {
  GUN_RETRY_LIMIT,
  GUN_SLOTS,
  GUN_SLOT_TAKEN_TEXT,
  GUN_WAITLIST_PREFIX,
} from '@/data/query-data';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 预约结果 */
interface GunResult {
  waitlistNo: string;
  date: string;
  slot: string;
}

/** 生成指定月份的全部日期格（null 为月初补齐的空格） */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= dayCount; d += 1) cells.push(d);
  return cells;
}

/** 判定某日是否不可预约，并给出不可预约的原因 */
function disabledReason(date: Date, today: Date): string | null {
  const weekday = date.getDay();
  if (weekday === 0) return '周日不开放预约。';
  if (weekday === 6) return '周六不开放预约。';
  if (weekday === 2) return '周二为系统维护日，不开放预约。';
  if (date.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
    return '已过日期不可预约。';
  }
  return null;
}

export default function GunTool() {
  const { pushToast } = useApp();

  const today = new Date();

  // 本月若已无任何可预约日期（例如月末恰逢周末或周二），自动展示下月号源，
  // 保证预约入口始终可用；切换说明随日历一并公示。
  const thisMonthCells = buildMonthCells(today.getFullYear(), today.getMonth());
  const thisMonthSelectable = thisMonthCells.filter(
    (d) => d !== null && !disabledReason(new Date(today.getFullYear(), today.getMonth(), d), today)
  ).length;
  const autoNextMonth = thisMonthSelectable === 0;
  const viewBase = new Date(today.getFullYear(), today.getMonth() + (autoNextMonth ? 1 : 0), 1);
  const year = viewBase.getFullYear();
  const month = viewBase.getMonth();
  const cells = autoNextMonth ? buildMonthCells(year, month) : thisMonthCells;
  const selectableCount = cells.filter(
    (d) => d !== null && !disabledReason(new Date(year, month, d), today)
  ).length;

  // I. 预约表单状态
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // II. 预约业务状态：重试次数、已被他人预约的时段、候补结果
  const [attempts, setAttempts] = useState(0);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<GunResult>(1300);

  const toIso = (d: number): string =>
    `${year}-${`${month + 1}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`;

  /** 选择日期；已锁定时不再响应 */
  const pickDate = (d: number) => {
    if (locked) return;
    setDate(toIso(d));
    setSlot(null);
    setFormError(null);
    if (query.status === 'error') query.reset();
  };

  /** 选择时段 */
  const pickSlot = (value: string) => {
    if (locked) return;
    if (takenSlots.includes(`${date}|${value}`)) {
      setFormError('该时段已被他人预约，请选择其他时段。');
      return;
    }
    setSlot(value);
    setFormError(null);
    if (query.status === 'error') query.reset();
  };

  /** 提交预约 */
  const submit = () => {
    if (locked) {
      setFormError('本日预约额度已用尽，请明日再试。');
      return;
    }
    if (!date) {
      setFormError('请选择到访日期。');
      return;
    }
    if (!slot) {
      setFormError('请选择到访时段。');
      return;
    }
    if (!agreed) {
      setFormError('请阅读并勾选《预约承诺书》后提交。');
      return;
    }
    setFormError(null);

    const key = `${date}|${slot}`;
    const nextAttempts = attempts + 1;

    query.run(() => {
      if (nextAttempts <= GUN_RETRY_LIMIT - 1) {
        const takenCount = takenSlots.filter((s) => s.startsWith(`${date}|`)).length + 1;
        return {
          ok: false,
          message: `${GUN_SLOT_TAKEN_TEXT}本日剩余可选时段 ${GUN_SLOTS.length - takenCount} 个。`,
        };
      }
      return {
        ok: true,
        data: {
          waitlistNo: `${GUN_WAITLIST_PREFIX}-${year}-${String(3640 + nextAttempts).padStart(4, '0')}`,
          date,
          slot,
        },
      };
    });

    setAttempts(nextAttempts);
    setTakenSlots((prev) => [...prev, key]);
    if (nextAttempts >= GUN_RETRY_LIMIT) {
      setLocked(true);
      setLockNotice(`您已重试 ${GUN_RETRY_LIMIT} 次，请明日再试。`);
      setSlot(null);
    } else {
      setSlot(null);
    }
  };

  /** 重置为初始状态，模拟"次日再来" */
  const resetAll = () => {
    setDate(null);
    setSlot(null);
    setAgreed(false);
    setFormError(null);
    setAttempts(0);
    setTakenSlots([]);
    setLocked(false);
    setLockNotice(null);
    query.reset();
  };

  const takenOnDate = takenSlots.filter((s) => s.startsWith(`${date}|`)).map((s) => s.split('|')[1]);
  const remaining = GUN_SLOTS.length - takenOnDate.length;

  return (
    <ToolShell
      tool="gun"
      title="枪支许可预约"
      lead={
        <>
          本事项用于预约到指定网点提交枪支许可申请材料。预约以时段为单位，每时段限 1 人。
          预约成功后请按预约时段到场，逾期未到场的，本次预约视为未到场。
        </>
      }
      aside={
        <Panel title="不可预约日说明">
          <ol className="mg-q-ol">
            <li>周六、周日不开放预约。</li>
            <li>每周二为系统维护日，不开放预约；如遇周二为节假日，该周二照常不开放。</li>
            <li>其他维护日的备用维护日为周二。</li>
            <li>今日之前的日期不可预约，明天的日期亦不可预约，可预约日期以日历显示为准。</li>
          </ol>
        </Panel>
      }
    >
      {/* ---------- I. 日期与时段 ---------- */}
      <div className="mg-q-cal">
        <div className="mg-q-cal__head">
          <Button
            size="sm"
            onClick={() => pushToast('上月号源已关闭', '历史月份不可预约。历史预约记录请在本系统查询，本系统不提供历史预约记录查询。')}
          >
            ‹ 上月
          </Button>
          <span className="mg-q-cal__title">
            {year} 年 {month + 1} 月
          </span>
          <Button
            size="sm"
            onClick={() =>
              pushToast(
                autoNextMonth ? '号源开放时间另行通知' : '下月号源未开放',
                autoNextMonth
                  ? '当前页已展示下月号源。更后月份的号源开放时间另行通知，通知在开放之后发布。'
                  : '下月号源开放时间另行通知。通知发布于号源开放后。'
              )
            }
          >
            下月 ›
          </Button>
        </div>

        <div className="mg-q-cal__grid">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="mg-q-cal__week">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`blank-${i}`} className="mg-q-cal__blank" />;
            const cellDate = new Date(year, month, d);
            const reason = disabledReason(cellDate, today);
            const iso = toIso(d);
            const isToday = d === today.getDate();
            const isSelected = iso === date;
            const cls = [
              'mg-q-cal__day',
              reason ? 'is-disabled' : '',
              isSelected ? 'is-selected' : '',
              isToday ? 'is-today' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={iso}
                type="button"
                className={cls}
                title={reason ?? '可预约'}
                disabled={Boolean(reason) || locked}
                onClick={() => pickDate(d)}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mg-q-cal__legend">
          图例：灰底为不可预约日（周六、周日、每周二及已过日期）；红底为已选日期；方框为今日。
          本月可预约日期共 {selectableCount} 天。
          {autoNextMonth &&
            '本月已无可预约日期，系统已自动切换至下月号源，切换于本次访问时完成，切换结果即为本页显示结果。'}
        </div>
      </div>

      {/* ---------- II. 时段选择 ---------- */}
      <div className="mg-q-subtitle">选择到访时段</div>
      {!date && <div className="mg-q-hintline">请先在上方日历中选择到访日期。</div>}
      {date && (
        <>
          <div className="mg-q-slots">
            {GUN_SLOTS.map((s) => {
              const full = takenOnDate.includes(s);
              const cls = ['mg-q-slot', full ? 'is-full' : '', s === slot ? 'is-active' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={s}
                  type="button"
                  className={cls}
                  disabled={full || locked}
                  onClick={() => pickSlot(s)}
                >
                  {s}
                  {full && <span className="mg-q-slot__flag">已满</span>}
                </button>
              );
            })}
          </div>
          <div className="mg-q-hintline">
            已选日期 {formatDateCn(date)}，本日剩余可选时段 {remaining} 个。每时段限 1 人，
            该限额用于确保预约体验。
          </div>
        </>
      )}

      {/* ---------- III. 承诺书与提交 ---------- */}
      <div className="mg-q-promise">
        <div className="mg-q-promise__head">预约承诺书</div>
        <p>一、本人承诺本人到场。本人未到场时，本次预约视为未到场。</p>
        <p>二、本人承诺所填信息真实有效。本系统不对所填信息的真实性进行校验。</p>
        <p>三、本人承诺按预约时段到场。迟到超过 15 分钟的，视为未按预约时段到场。</p>
        <label className="mg-q-agree">
          <input type="checkbox" checked={agreed} disabled={locked} onChange={(e) => setAgreed(e.target.checked)} />
          <span>本人已阅读并同意《预约承诺书》</span>
        </label>
      </div>

      {formError && <Alert tone="red">{formError}</Alert>}

      <div className="mg-q-form-actions">
        <Button variant="primary" onClick={submit} disabled={query.busy || locked}>
          {locked ? '本日预约额度已用尽' : '提交预约'}
        </Button>
        <Button onClick={resetAll}>重置（模拟次日）</Button>
        <span className="mg-q-form-actions__note">
          同一申请人每日预约次数不限，可预约成功的次数以预约结果为准。
        </span>
      </div>

      {/* ---------- IV. 预约状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请选择到访日期与时段，勾选承诺书后提交预约。未提交时，本页不生成预约号。" />
      )}

      {query.status === 'loading' && <Loading text="正在核验时段可用性，请稍候…" />}

      {query.status === 'error' && <Alert tone="red">{query.error}</Alert>}

      {lockNotice && <Alert tone="red">{lockNotice}</Alert>}

      {query.status === 'done' && query.data && (
        <>
          <ResultPanel
            title="预约结果"
            footnote={
              <>
                备注：候补登记不等于预约成功。候补号在收到通知前不生效，通知在候补号生效前发出。
                本次候补登记已记入您的预约记录，记录不可修改，可重新登记。
              </>
            }
            actions={
              <>
                <Button size="sm" variant="primary" onClick={resetAll}>
                  次日重新预约
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    pushToast(
                      '预约凭证已生成',
                      '凭证已生成，请自行打印。本系统不提供打印服务，打印请到现场打印点办理，现场打印点需预约。'
                    )
                  }
                >
                  打印预约凭证
                </Button>
              </>
            }
          >
            <ResultRow label="预约号（候补）" value={query.data.waitlistNo} />
            <ResultRow label="预约日期" value={formatDateCn(query.data.date)} />
            <ResultRow label="预约时段" value={query.data.slot} />
            <ResultRow label="办理地点" value="联邦政务服务中心 第三受理大厅（东侧门进）" />
            <ResultRow label="携带材料" value="本人身份证件、本人身份证件复印件 1 份" />
            <ResultRow label="预约状态" value="候补登记中（未生效）" />
            <ResultRow label="重试次数" value={`${attempts} 次（上限 ${GUN_RETRY_LIMIT} 次）`} />
          </ResultPanel>

          <Alert tone="yellow">
            请携带本人身份证件及本人到场。本人到场为到场的前提条件，他人到场不能替代本人到场。
            到场后请在取号机取号，取号需预约，预约请在本系统办理。
          </Alert>
        </>
      )}

      {/* ---------- V. 预约规则 ---------- */}
      <Panel title="预约规则" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>每日预约名额 0 至 {GUN_SLOTS.length} 个，名额数量以当日实际放号为准。</li>
          <li>时段不可转让，不可更改。如需更改，请重新预约，重新预约须使用新的时段。</li>
          <li>连续三次预约未成功的，系统自动登记候补，候补登记次数不计入违约次数。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
