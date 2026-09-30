/**
 * 互动交流 —— 常见问题（手风琴）
 *
 * I. 职责
 *
 * 1. 按关键词检索（同时匹配问题、回答与"网友补充"）。
 * 2. 按分类筛选，分类取值来自 `@/data/faqs` 的 FAQ_CATEGORIES。
 * 3. 点击问题展开回答与网友补充，可同时展开多条。
 *
 * II. 设计的黑色幽默
 *
 * 1. 「网友补充」是不承担责任的补充说明，往往比官方回答更接近真相。
 * 2. 检索无结果时的空态也给出了一条正经的替代路径（写信，60 个工作日）。
 *
 * @module pages/interact/FaqPanel
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useMemo, useState } from 'react';
import { Badge, Button, Panel } from '@/components/ui';
import { FAQS, FAQ_CATEGORIES } from '@/data/faqs';

export default function FaqPanel() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const list = useMemo(() => {
    const kw = q.trim();
    return FAQS.filter((f) => {
      if (cat !== 'all' && f.category !== cat) return false;
      if (!kw) return true;
      return (
        f.question.includes(kw) ||
        f.answer.includes(kw) ||
        (f.footnote ? f.footnote.includes(kw) : false)
      );
    });
  }, [q, cat]);

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const catLabel = (key: string) =>
    FAQ_CATEGORIES.find((c) => c.key === key)?.label ?? key;

  return (
    <Panel title={`常见问题（共 ${list.length} 条）`}>
      <div className="mg-it-toolbar">
        <input
          className="mg-input mg-it-search"
          value={q}
          placeholder="请输入关键词，如「表格」「验证码」「60 个工作日」"
          onChange={(e) => setQ(e.target.value)}
          aria-label="常见问题检索"
        />
        <Button size="sm" onClick={() => { setQ(''); setCat('all'); }}>
          重置
        </Button>
      </div>

      <div className="mg-it-cats">
        <button
          type="button"
          className={`mg-it-cat${cat === 'all' ? ' is-active' : ''}`}
          onClick={() => setCat('all')}
        >
          全部（{FAQS.length}）
        </button>
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`mg-it-cat${cat === c.key ? ' is-active' : ''}`}
            onClick={() => setCat(c.key)}
          >
            {c.label}（{FAQS.filter((f) => f.category === c.key).length}）
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mg-empty">
          <div className="mg-empty__icon">※</div>
          <div>未检索到相关问题。建议您更换关键词，或直接写信询问。</div>
          <div className="mg-it-note">
            写信的答复时限为 60 个工作日。若您的问题并不重要，建议不要写信。
          </div>
        </div>
      ) : (
        <div className="mg-it-faq">
          {list.map((f) => {
            const isOpen = !!open[f.id];
            return (
              <div className={`mg-it-faq__item${isOpen ? ' is-open' : ''}`} key={f.id}>
                <button
                  type="button"
                  className="mg-it-faq__q"
                  onClick={() => toggle(f.id)}
                  aria-expanded={isOpen}
                >
                  <span className="mg-it-faq__mark">{isOpen ? '−' : '+'}</span>
                  <span className="mg-it-faq__qtext">{f.question}</span>
                  <Badge tone="outline">{catLabel(f.category)}</Badge>
                </button>
                {isOpen && (
                  <div className="mg-it-faq__a">
                    <div className="mg-it-faq__ans">
                      <b>答：</b>
                      {f.answer}
                    </div>
                    {f.footnote && (
                      <div className="mg-it-faq__note">
                        <b>网友补充：</b>
                        {f.footnote}
                      </div>
                    )}
                    <div className="mg-it-note">
                      本栏目对网友补充内容不作核实，也不承担相应责任。
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
