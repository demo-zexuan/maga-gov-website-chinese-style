/**
 * 互动交流 —— 在线调查
 *
 * I. 职责
 *
 * 渲染 SURVEYS 中的 3 份问卷，逐份作答、逐份提交，并展示「已收到 N 份问卷 / 满意度 100%」。
 *
 * II. 设计的黑色幽默
 *
 * 1. 所有选项都是正面表述，因此满意度恒为 100% —— 这不是统计失误，是统计口径。
 * 2. 问卷不设「不满意」选项，也不设「跳过」；有意见请走「我要写信」，答复时限 60 个工作日。
 * 3. 可以重复提交，重复提交会计入份数 —— 份数只增不减。
 *
 * @module pages/interact/SurveyPanel
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Badge, Button, Panel, Progress } from '@/components/ui';
import { useApp } from '@/app-context';
import { SURVEYS, SURVEY_BASE_COUNT } from '@/data/interact';
import type { Survey } from '@/data/interact';

export default function SurveyPanel() {
  const { pushToast } = useApp();

  /** surveyId → { questionId: option } */
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  /** surveyId → 是否已提交过 */
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  /** surveyId → 本次会话新增的份数 */
  const [extra, setExtra] = useState<Record<string, number>>({});
  /** surveyId → 校验错误 */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pick = (sid: string, qid: string, opt: string) => {
    setAnswers((prev) => ({ ...prev, [sid]: { ...(prev[sid] ?? {}), [qid]: opt } }));
  };

  const submit = (survey: Survey) => {
    const a = answers[survey.id] ?? {};
    const missing = survey.questions.filter((q) => !a[q.id]).length;
    if (missing > 0) {
      setErrors((prev) => ({
        ...prev,
        [survey.id]: `请完成全部题目，尚有 ${missing} 题未作答。本问卷不设「跳过」，也不设「不满意」。`,
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, [survey.id]: '' }));
    setSubmitted((prev) => ({ ...prev, [survey.id]: true }));
    setExtra((prev) => ({ ...prev, [survey.id]: (prev[survey.id] ?? 0) + 1 }));
    pushToast('提交成功', '感谢您的评价，您的满意度已记录。本次评价不可撤回。');
  };

  return (
    <div className="mg-it-surveys">
      <Alert tone="gray">
        <b>统计口径说明：</b>
        本栏目所有问卷的选项均为正面表述，因此满意度恒为 100%。
        如您对本项工作有不同意见，可通过「我要写信」栏目反映，答复时限为 60 个工作日。
      </Alert>

      {SURVEYS.map((s) => {
        const a = answers[s.id] ?? {};
        const done = s.questions.filter((q) => a[q.id]).length;
        const total = SURVEY_BASE_COUNT[s.id] ?? 0;
        const shown = total + (extra[s.id] ?? 0);
        const isDone = submitted[s.id] ?? false;

        return (
          <Panel
            key={s.id}
            title={s.title}
            extra={<Badge tone={isDone ? 'green' : 'navy'}>{isDone ? '已提交' : '进行中'}</Badge>}
          >
            <div className="mg-it-survey__desc">{s.desc}</div>

            <div className="mg-it-survey__metric">
              <span className="mg-it-survey__num">{shown.toLocaleString('en-US')}</span>
              <span className="mg-it-survey__unit">份</span>
              <span className="mg-it-survey__text">
                本次调查已收到 {shown.toLocaleString('en-US')} 份问卷，满意度 100%
              </span>
            </div>

            <div className="mg-it-survey__progress">
              <Progress percent={Math.round((done / s.questions.length) * 100)} />
              <span className="mg-it-note">
                已完成 {done} / {s.questions.length} 题
              </span>
            </div>

            {s.questions.map((q, qi) => (
              <div className="mg-it-survey__q" key={q.id}>
                <div className="mg-it-survey__qtext">
                  {qi + 1}. {q.text}
                </div>
                <div className="mg-it-survey__opts">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`mg-it-opt${a[q.id] === opt ? ' is-picked' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`${s.id}-${q.id}`}
                        checked={a[q.id] === opt}
                        onChange={() => pick(s.id, q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {errors[s.id] && <div className="mg-form__error">{errors[s.id]}</div>}

            <div className="mg-it-actions">
              <Button variant="primary" size="sm" onClick={() => submit(s)}>
                {isDone ? '再次提交' : '提交问卷'}
              </Button>
              <span className="mg-it-note">
                本问卷不设负面选项，以保证统计口径统一。您可以重复提交，重复提交将再次计入份数。
              </span>
            </div>

            {isDone && (
              <div className="mg-it-survey__done">
                感谢您的评价，您的满意度已记录。您的评价已计入本次调查的份数，份数只增不减。
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
