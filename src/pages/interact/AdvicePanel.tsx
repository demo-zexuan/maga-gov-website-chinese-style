/**
 * 互动交流 —— 建言献策
 *
 * I. 职责
 *
 * 1. 展示 ADVICE 列表（标题 / 日期 / 来源 / 阅读量 / 摘要），点击弹出全文。
 * 2. 「我要建言」按钮弹出简化版写信表单（复用 LetterForm 的 compact 模式）。
 *
 * II. 设计的黑色幽默
 *
 * 1. 每一条建言的办理情况都是「您的建议很好，我们已收悉」。
 * 2. 建言不设答复时限 —— 因为"已收悉"本身就是一种完整的答复。
 *
 * @module pages/interact/AdvicePanel
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Badge, Button, Modal, Panel } from '@/components/ui';
import { ADVICE } from '@/data/interact';
import type { Article } from '@/data/types';
import LetterForm from './LetterForm';

export default function AdvicePanel() {
  const [active, setActive] = useState<Article | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submittedNo, setSubmittedNo] = useState('');

  return (
    <Panel
      title={`建言献策选登（共 ${ADVICE.length} 条）`}
      extra={
        <Button size="sm" variant="primary" onClick={() => { setSubmittedNo(''); setFormOpen(true); }}>
          我要建言
        </Button>
      }
    >
      <Alert tone="yellow">
        建言献策不设答复时限。所有建言我们都会认真研究，并在本栏目选登；
        未选登的建言同样已被研究，只是未被选登。涉及具体诉求的，请通过「我要写信」提交，
        该渠道的答复时限为 60 个工作日。
      </Alert>

      <ul className="mg-it-advice">
        {ADVICE.map((a, i) => (
          <li className="mg-it-advice__item" key={a.id}>
            <div className="mg-it-advice__head">
              <span className="mg-it-advice__no">{String(i + 1).padStart(2, '0')}</span>
              <button type="button" className="mg-it-advice__title" onClick={() => setActive(a)}>
                {a.title}
              </button>
              {a.badge && <Badge tone={a.badgeTone ?? 'navy'}>{a.badge}</Badge>}
            </div>
            <div className="mg-it-advice__meta">
              <span>来源：{a.source}</span>
              <span>提交日期：{a.date}</span>
              <span>阅读：{a.views?.toLocaleString('en-US') ?? '0'}</span>
            </div>
            <div className="mg-it-advice__summary">{a.summary}</div>
            <div className="mg-it-advice__foot">
              <Button size="sm" onClick={() => setActive(a)}>
                查看建言与办理情况
              </Button>
              <span className="mg-it-note">办理情况：您的建议很好，我们已收悉。</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mg-it-note">
        本栏目收到的建言按月统计。本月收到的建言共 {ADVICE.length} 条，采纳 0 条，
        已收悉 {ADVICE.length} 条。收悉率 100%。
      </div>

      {/* 建言全文 */}
      <Modal
        open={active !== null}
        title={active ? `建言详情 —— ${active.id}` : '建言详情'}
        onClose={() => setActive(null)}
        width={640}
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
              <span>来源：{active.source}</span>
              <span>提交日期：{active.date}</span>
              <span>阅读：{active.views?.toLocaleString('en-US') ?? '0'}</span>
            </div>
            {active.body.map((p, i) => (
              <p className="mg-it-detail__p" key={i}>
                {p}
              </p>
            ))}
            <div className="mg-it-note">
              本栏目对建言的采纳情况不作逐一答复。如您需要书面答复，请通过「我要写信」提交，
              答复时限为 60 个工作日。
            </div>
          </div>
        )}
      </Modal>

      {/* 我要建言（简化表单） */}
      <Modal
        open={formOpen}
        title="我要建言"
        onClose={() => setFormOpen(false)}
        width={620}
        footer={
          <Button size="sm" onClick={() => setFormOpen(false)}>
            关闭
          </Button>
        }
      >
        <div className="mg-it-note">
          建言不设答复时限。提交后您将获得一个受理编号，该编号可用于到窗口查询。
        </div>
        {submittedNo && (
          <Alert tone="gray">
            您的建议很好，我们已收悉。受理编号 {submittedNo}。
          </Alert>
        )}
        <LetterForm compact onSubmitted={(no) => setSubmittedNo(no)} />
      </Modal>
    </Panel>
  );
}
