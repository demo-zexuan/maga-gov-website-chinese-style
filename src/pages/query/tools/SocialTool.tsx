/**
 * 社保查询工具
 *
 * I. 功能
 *
 * 1. 社会保障号按 XXX-XX-XXXX 掩码输入，提交前做格式校验与号段校验
 * 2. 出生年份校验（4 位数字、不早于 1936 年、不晚于当前年份）
 * 3. 提交后进入加载态，随后返回缴费月数、参保状态、预计退休年份等结果
 * 4. 结果页提供打印对账单与重新查询；打印功能给出公文口吻的后续交代
 *
 * II. 黑色幽默落点
 *
 * 1. 累计缴费 4,180 个月，折合 348 年 4 个月，而查询人按出生年份计算为 34 岁
 * 2. 预计退休年份 2087 年，法定退休年龄 67 岁
 * 3. 缴费记录「连续无中断」，同时注明存在 3 条因数据迁移未予显示的中断记录
 * 4. 错误态：900 及以上号段属于尚未接入的辖区，服务范围每季度调整，最近一次调整在 2019 年 3 月
 *
 * @module pages/query/tools/SocialTool
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Button, Field, Loading, Panel } from '@/components/ui';
import { useApp } from '@/app-context';
import ToolShell from '@/pages/query/ToolShell';
import {
  CURRENT_YEAR,
  QueryIdle,
  ResultPanel,
  ResultRow,
  formatInt,
  maskSsn,
  formatSsn,
  ssnArea,
  useSimulatedQuery,
  validateSsn,
} from '@/pages/query/shared';
import {
  SOCIAL_DATA_UPDATED,
  SOCIAL_PAID_MONTHS,
  SOCIAL_RETIRE_AGE,
  SOCIAL_RETIRE_YEAR,
} from '@/data/query-data';

/** 社保查询结果 */
interface SocialResult {
  ssnMasked: string;
  birthYear: number;
  age: number;
  months: number;
  years: number;
  restMonths: number;
  ratio: string;
  retireYear: number;
}

export default function SocialTool() {
  const { pushToast } = useApp();

  // I. 表单状态
  const [ssn, setSsn] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [errors, setErrors] = useState<{ ssn?: string; year?: string }>({});

  // II. 页内次级提示（下载/打印等操作的反馈，不影响查询结果展示）
  const [notice, setNotice] = useState<string | null>(null);

  const query = useSimulatedQuery<SocialResult>(1300);

  /** 校验出生年份，返回错误文案（通过时返回 null） */
  const validateYear = (value: string): string | null => {
    if (!value.trim()) return '请填写出生年份。';
    if (!/^\d{4}$/.test(value)) return '出生年份应为 4 位数字。';
    const year = Number(value);
    if (year < 1936) {
      return '本系统档案自 1936 年建立。1936 年以前的缴费记录请到现场查询，现场查询须先在本系统预约。';
    }
    if (year > CURRENT_YEAR) {
      return `出生年份不得晚于当前年份（${CURRENT_YEAR}）。若您确系 ${CURRENT_YEAR + 1} 年出生，请在出生后重新查询。`;
    }
    return null;
  };

  /** 提交查询 */
  const submit = () => {
    const ssnError = validateSsn(ssn);
    const yearError = validateYear(birthYear);
    setErrors({ ssn: ssnError ?? undefined, year: yearError ?? undefined });
    setNotice(null);
    if (ssnError || yearError) return;

    const year = Number(birthYear);
    query.run(() => {
      // 900 及以上号段视为未接入辖区，用于呈现查询失败的错误态
      if (ssnArea(ssn) >= 900) {
        return {
          ok: false,
          message:
            '查询失败：该号段属于本系统尚未接入的辖区。系统服务范围每季度调整一次，最近一次调整为 2019 年 3 月。',
        };
      }
      const age = CURRENT_YEAR - year;
      const totalMonths = SOCIAL_PAID_MONTHS;
      const monthsOfAge = Math.max(1, age * 12);
      return {
        ok: true,
        data: {
          ssnMasked: maskSsn(ssn),
          birthYear: year,
          age,
          months: totalMonths,
          years: Math.floor(totalMonths / 12),
          restMonths: totalMonths % 12,
          ratio: (totalMonths / monthsOfAge).toFixed(1),
          retireYear: SOCIAL_RETIRE_YEAR,
        },
      };
    });
  };

  /** 重置表单与结果 */
  const resetAll = () => {
    setSsn('');
    setBirthYear('');
    setErrors({});
    setNotice(null);
    query.reset();
  };

  return (
    <ToolShell
      tool="social"
      title="社会保障缴费记录查询"
      lead={
        <>
          本事项用于查询本人社会保障缴费记录、参保状态与待遇起始年份。查询结果由系统实时生成，
          生成结果以生成为准。请如实填写下列信息，本系统不对填写内容的真实性进行校验。
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
          label="出生年份"
          required
          hint="用于核对缴费月数与年龄的一致性，请与本人身份证件保持一致。"
          error={errors.year}
        >
          <input
            className="mg-input mg-input--code"
            value={birthYear}
            maxLength={4}
            inputMode="numeric"
            placeholder="例如 1992"
            onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </Field>

        <div className="mg-q-form-actions">
          <Button variant="primary" type="submit" disabled={query.busy}>
            提交查询
          </Button>
          <Button type="button" onClick={resetAll}>
            重置
          </Button>
          <span className="mg-q-form-actions__note">
            本查询免费。每查询一次，系统记录一次查询次数，查询次数不可查询。
          </span>
        </div>
      </form>

      {/* ---------- II. 查询状态 ---------- */}
      {query.status === 'idle' && (
        <QueryIdle text="请填写社会保障号与出生年份后提交查询。未提交时，本页不显示任何数据。" />
      )}

      {query.status === 'loading' && <Loading text="正在调取缴费记录，请稍候…" />}

      {query.status === 'error' && (
        <>
          <Alert tone="red">{query.error}</Alert>
          <div className="mg-q-after-error">
            <Button size="sm" onClick={resetAll}>
              重新填写
            </Button>
            <span>如确认填写无误，请于服务范围调整后重新查询。调整公告发布于调整完成后。</span>
          </div>
        </>
      )}

      {query.status === 'done' && query.data && (
        <>
          <ResultPanel
            title="社会保障缴费记录"
            footnote={
              <>
                备注：缴费记录显示为连续缴费，无中断。经系统比对，另有 3 条中断记录因数据迁移未予显示。
                数据最近一次更新时间为 {SOCIAL_DATA_UPDATED}，更新周期为不定期。
              </>
            }
            actions={
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    pushToast(
                      '打印任务已提交',
                      '打印任务已提交至您所在地的打印点，取件时间另行通知。取件请携带本人身份证件及身份证件复印件。'
                    )
                  }
                >
                  打印对账单
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    setNotice(
                      '下载失败：缴费明细文件正在维护中。维护窗口：每日 00:00-24:00。维护期间可正常申请下载。'
                    )
                  }
                >
                  下载缴费明细
                </Button>
                <Button size="sm" onClick={resetAll}>
                  重新查询
                </Button>
              </>
            }
          >
            <ResultRow label="社会保障号" value={query.data.ssnMasked} />
            <ResultRow label="出生年份" value={`${query.data.birthYear} 年`} />
            <ResultRow label="当前年龄" value={`${query.data.age} 岁（按 ${CURRENT_YEAR} 年计）`} />
            <ResultRow
              label="累计缴费月数"
              value={`${formatInt(query.data.months)} 个月`}
            />
            <ResultRow
              label="折合缴费年限"
              value={`${query.data.years} 年 ${query.data.restMonths} 个月`}
            />
            <ResultRow label="相当于本人年龄的" value={`${query.data.ratio} 倍`} />
            <ResultRow label="预计退休年份" value={`${query.data.retireYear} 年`} />
            <ResultRow label="法定退休年龄" value={`${SOCIAL_RETIRE_AGE} 岁`} />
            <ResultRow label="参保状态" value="正常参保" />
            <ResultRow label="待遇起始时间" value="按退休年份次月起发放" />
          </ResultPanel>

          <Alert tone="yellow">
            系统显示您已累计缴费 {formatInt(query.data.months)} 个月份。请注意，您今年 {query.data.age} 岁。
            按现行规定，您的法定退休年龄为 {SOCIAL_RETIRE_AGE} 岁，预计可于 {query.data.retireYear} 年 4 月
            领取首笔待遇。该结果自 {SOCIAL_DATA_UPDATED} 起未发生变化。
          </Alert>

          {notice && <Alert tone="red">{notice}</Alert>}
        </>
      )}

      {/* ---------- III. 结果说明 ---------- */}
      <Panel title="结果说明" className="mg-q-subpanel">
        <ol className="mg-q-ol">
          <li>缴费月数为系统累计值，不随缴费年限、缴费金额与年龄变动。</li>
          <li>预计退休年份由系统按现行规定测算，规定调整时结果不随之调整。</li>
          <li>本页结果不作为待遇核定依据。待遇核定以核定结果为依据，核定结果以本页结果为准。</li>
        </ol>
      </Panel>
    </ToolShell>
  );
}
