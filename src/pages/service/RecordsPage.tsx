/**
 * 政务服务 —— 办件公示
 *
 * I. 职责
 *
 * 1. 顶部统计条：今日办结件数 / 平均耗时（小时）/ 群众评分（恒为 5.0 分）。
 * 2. 筛选：状态、事项、受理日期区间；筛选为即时生效。
 * 3. 公示表格 + 分页器（每页 8 条）。
 *
 * II. 黑色幽默位置
 *
 * 1. 群众评分只有 5.0，因为本栏目只公示「非常满意」的办件。
 * 2. 「查询」按钮不改变查询结果，只报告结果。
 * 3. 平均耗时按小时计，且声明「不含受理之前的等待时间」。
 * 4. 已退回办件的退回原因多为材料本身无法提供。
 *
 * @module pages/service/RecordsPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Crumbs, Field, Panel, Pager } from '@/components/ui';
import { useApp } from '@/app-context';
import { CASE_RECORDS, CASE_STATUSES, SERVICE_TODAY } from '@/data/service-extra';
import type { CaseStatus } from '@/data/service-extra';

/* ---------------- 常量 ---------------- */

/** 每页条数 */
const PAGE_SIZE = 8;

/** 两个日期之间的日历天数（用于平均耗时） */
function daysBetween(a: string, b: string): number {
  const t1 = new Date(`${a}T00:00:00`).getTime();
  const t2 = new Date(`${b}T00:00:00`).getTime();
  return Math.max(0, Math.round((t2 - t1) / 86_400_000));
}

/* ---------------- 页面 ---------------- */

export default function RecordsPage() {
  const { pushToast } = useApp();

  const [status, setStatus] = useState<'all' | CaseStatus>('all');
  const [serviceId, setServiceId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  /** 事项下拉选项：按公示数据中实际出现的事项去重 */
  const serviceOptions = useMemo(() => {
    const map = new Map<string, string>();
    CASE_RECORDS.forEach((r) => map.set(r.serviceId, r.serviceName));
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, []);

  /** 筛选结果 */
  const filtered = useMemo(
    () =>
      CASE_RECORDS.filter((r) => {
        if (status !== 'all' && r.status !== status) return false;
        if (serviceId !== 'all' && r.serviceId !== serviceId) return false;
        if (from && r.applyDate < from) return false;
        if (to && r.applyDate > to) return false;
        return true;
      }),
    [status, serviceId, from, to]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  /* ---------- 顶部统计 ---------- */

  const finished = CASE_RECORDS.filter((r) => r.finishDate);
  const todayFinished = finished.filter((r) => r.finishDate === SERVICE_TODAY).length;
  const avgHours =
    finished.length === 0
      ? 0
      : Math.round(
          (finished.reduce((acc, r) => acc + daysBetween(r.applyDate, r.finishDate as string) * 24, 0) /
            finished.length) *
            10
        ) / 10;

  /** 重置筛选 */
  const onReset = () => {
    setStatus('all');
    setServiceId('all');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '政务服务', to: '/service' }, { label: '办件公示' }]} />

      <div className="mg-layout-single">
        {/* ---------------- 统计条 ---------------- */}
        <div className="mg-svc-stats">
          <div className="mg-svc-stats__item">
            <div className="mg-svc-stats__num">{todayFinished}</div>
            <div className="mg-svc-stats__label">今日办结（件）</div>
          </div>
          <div className="mg-svc-stats__item">
            <div className="mg-svc-stats__num">{avgHours}</div>
            <div className="mg-svc-stats__label">平均耗时（小时）</div>
          </div>
          <div className="mg-svc-stats__item">
            <div className="mg-svc-stats__num">5.0</div>
            <div className="mg-svc-stats__label">群众评分（分）</div>
          </div>
          <div className="mg-svc-stats__item">
            <div className="mg-svc-stats__num">{CASE_RECORDS.length}</div>
            <div className="mg-svc-stats__label">公示总数（条）</div>
          </div>
          <div className="mg-svc-stats__note">
            平均耗时自受理之日起算，含夜间、周末与法定节假日，不含受理之前的等待时间。
            群众评分满分为 5.0 分，本栏目自 2014 年开设以来未出现过其他分值。
          </div>
        </div>

        <Alert tone="gray">
          <b>公示说明：</b>
          本表数据每日 09:00 更新一次。今日数据更新时间为 09:00；若 09:00 未更新，则更新时间为次日 09:00。
          公示范围仅包含评价为「非常满意」的办件，其余评价不在公示范围内，因此不予展示。
        </Alert>

        {/* ---------------- 筛选 ---------------- */}
        <Panel title="查询条件">
          <div className="mg-svc-filters">
            <Field label="办件状态">
              <select
                className="mg-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as 'all' | CaseStatus);
                  setPage(1);
                }}
              >
                <option value="all">全部状态</option>
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="办理事项">
              <select
                className="mg-select"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">全部事项</option>
                {serviceOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="受理日期起" hint="留空表示不限">
              <input
                type="date"
                className="mg-input"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </Field>
            <Field label="受理日期止" hint="含当日">
              <input
                type="date"
                className="mg-input"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </Field>
            <div className="mg-svc-filters__btns">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  pushToast(
                    '查询完成',
                    `共查询到 ${filtered.length} 条办件。本按钮不改变查询结果，筛选条件在您修改时即已生效。`
                  )
                }
              >
                查询
              </Button>
              <Button size="sm" onClick={onReset}>
                重置
              </Button>
            </div>
          </div>
        </Panel>

        {/* ---------------- 公示表 ---------------- */}
        <Panel title={`办件公示（共 ${filtered.length} 条，第 ${current} / ${totalPages} 页）`} flush>
          {rows.length === 0 ? (
            <div className="mg-empty">
              <div className="mg-empty__icon">※</div>
              <div>当前查询条件下无办件记录。本栏目自 2019 年起无新内容。</div>
              <div className="mg-svc-note">
                请调整查询条件，或等待数据于次日 09:00 更新。更新不会增加记录数。
              </div>
            </div>
          ) : (
            <div className="mg-table-scroll mg-svc-scroll--records">
              <table className="mg-table">
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>办件编号</th>
                    <th style={{ width: 150 }}>办理事项</th>
                    <th style={{ width: 130 }}>申请人</th>
                    <th style={{ width: 92 }}>受理日期</th>
                    <th style={{ width: 92 }}>办结日期</th>
                    <th style={{ width: 72 }}>状态</th>
                    <th style={{ width: 140 }}>承办窗口</th>
                    <th style={{ width: 60 }}>评价</th>
                    <th>公示备注</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mg-svc-mono">{r.id}</td>
                      <td>{r.serviceName}</td>
                      <td>{r.applicant}</td>
                      <td className="mg-svc-mono">{r.applyDate}</td>
                      <td className="mg-svc-mono">{r.finishDate ?? '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="mg-svc-status" data-status={r.status}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.window}</td>
                      <td style={{ textAlign: 'center' }}>{r.score.toFixed(1)}</td>
                      <td className="mg-svc-remark">{r.remark ?? '无'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mg-svc-pager">
            <Pager
              page={current}
              totalPages={totalPages}
              totalItems={filtered.length}
              onChange={(p) => setPage(p)}
            />
          </div>
        </Panel>

        <div className="mg-svc-footnote">
          本页所有办件编号、申请人姓名、日期与评分均为虚构演示数据，与任何真实个人或机构无关。
          申请人姓名已按脱敏规则处理；脱敏规则详见《个人信息脱敏规则》，该规则不予公开。
        </div>
      </div>
    </div>
  );
}
