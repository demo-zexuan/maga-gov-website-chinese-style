/**
 * 互动交流 —— 信件选登
 *
 * I. 职责
 *
 * 1. 列表：标题 + 状态 + 承办单位 + 日期 + 群众评分，支持状态筛选、关键词检索与分页。
 * 2. 点击任一条目弹出 Modal，展示来信全文、官方回复、回复日期与评分。
 *
 * II. 设计的黑色幽默
 *
 * 1. 群众评分全部为 5.0（满分 5.0），没有一条低于满分。
 * 2. 回复齐备、格式完美，只是常常答的不是来信问的那件事。
 * 3. 未选登的信件同样已办理 —— 只是没有被选登。
 *
 * @module pages/interact/LettersPanel
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Modal, Panel, Pager } from '@/components/ui';
import { LETTERS, LETTER_STATUSES } from '@/data/interact';
import type { LetterItem } from '@/data/interact';

/** 每页条数 */
const PAGE_SIZE = 8;

/** 状态 → 角标色 */
const STATUS_TONE: Record<LetterItem['status'], 'green' | 'navy' | 'gold' | 'outline'> = {
  已办结: 'green',
  办理中: 'navy',
  已受理: 'gold',
  已转办: 'outline',
};

export default function LettersPanel() {
  const [status, setStatus] = useState<'all' | LetterItem['status']>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<LetterItem | null>(null);

  const filtered = useMemo(() => {
    const kw = q.trim();
    return LETTERS.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (!kw) return true;
      return l.title.includes(kw) || l.body.includes(kw) || l.department.includes(kw);
    });
  }, [status, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <Panel title={`信件选登（共 ${filtered.length} 件）`}>
      <Alert tone="gray">
        本栏目为部分选登。未选登的信件同样已办理，只是未被选登；选登标准为「具有代表性」，
        代表性由本栏目认定。群众评分满分为 5.0 分。
      </Alert>

      <div className="mg-it-toolbar">
        <input
          className="mg-input mg-it-search"
          value={q}
          placeholder="按标题、内容或承办单位检索"
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          aria-label="信件检索"
        />
        <select
          className="mg-select mg-it-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'all' | LetterItem['status']);
            setPage(1);
          }}
          aria-label="按状态筛选"
        >
          <option value="all">全部状态</option>
          {LETTER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => { setQ(''); setStatus('all'); setPage(1); }}>
          重置
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="mg-empty">
          <div className="mg-empty__icon">※</div>
          <div>当前条件下没有可展示的信件。本栏目自 2019 年起无新增选登。</div>
          <div className="mg-it-note">
            未被选登不代表未被办理。如需了解您的信件办理情况，请凭受理编号到窗口查询。
          </div>
        </div>
      ) : (
        <ul className="mg-it-letters">
          {rows.map((l) => (
            <li className="mg-letter" key={l.id}>
              <div className="mg-letter__head">
                <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                <span className="mg-letter__title">{l.title}</span>
                <span className="mg-it-letter__score">评分 {l.score?.toFixed(1)}</span>
              </div>
              <div className="mg-it-letter__meta">
                <span>来信人：{l.author}</span>
                <span>承办单位：{l.department}</span>
                <span>来信日期：{l.date}</span>
                <span>回复日期：{l.replyDate ?? '—'}</span>
                <span>编号：{l.id.toUpperCase()}</span>
              </div>
              <div className="mg-letter__body">{l.body}</div>
              <div className="mg-it-letter__foot">
                <Button size="sm" onClick={() => setActive(l)}>
                  {l.reply ? '查看来信与回复全文' : '查看来信全文'}
                </Button>
                <span className="mg-it-note">
                  {l.reply
                    ? '本件已办结，回复内容见全文。'
                    : '本件尚在办理中，暂无回复。答复时限为 60 个工作日。'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mg-it-pager">
        <Pager
          page={current}
          totalPages={totalPages}
          totalItems={filtered.length}
          onChange={(p) => setPage(p)}
        />
      </div>

      <Modal
        open={active !== null}
        title={active ? `信件详情 —— ${active.id.toUpperCase()}` : '信件详情'}
        onClose={() => setActive(null)}
        width={680}
        footer={
          <Button size="sm" onClick={() => setActive(null)}>
            关闭
          </Button>
        }
      >
        {active && (
          <div className="mg-it-detail">
            <div className="mg-it-detail__title">{active.title}</div>
            <div className="mg-it-letter__meta">
              <span>来信人：{active.author}</span>
              <span>承办单位：{active.department}</span>
              <span>来信日期：{active.date}</span>
              <span>办理状态：{active.status}</span>
              <span>群众评分：{active.score?.toFixed(1)} 分（满分 5.0 分）</span>
            </div>

            <div className="mg-it-detail__label">来信内容</div>
            <div className="mg-letter__body">{active.body}</div>

            {active.reply ? (
              <>
                <div className="mg-it-detail__label">官方回复</div>
                <div className="mg-letter__reply">{active.reply}</div>
                <div className="mg-it-note">回复日期：{active.replyDate}</div>
              </>
            ) : (
              <div className="mg-empty mg-it-empty-sm">
                <div>本件尚在办理中，暂无回复。</div>
                <div className="mg-it-note">
                  根据《信访条例》，我们将在 60 个工作日内答复您。感谢您的耐心等待，
                  您的等待时间不计入办理时限。
                </div>
              </div>
            )}

            <div className="mg-it-note">
              本件评分 {active.score?.toFixed(1)} 分。本栏目仅公示评价为「非常满意」的信件，
              其余评价不在公示范围内，因此本栏目自开设以来未出现过其他分值。
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  );
}
