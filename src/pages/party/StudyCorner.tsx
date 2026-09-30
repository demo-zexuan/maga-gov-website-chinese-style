/**
 * 学习园地（党建引领栏目右栏）
 *
 * I. 功能
 *
 * 1. 学习次数计数器：按页面停留时长自动累计，只增不减
 * 2. 在线学习：弹出答题窗，两道题、五个选项，全部导向同一个结果
 * 3. 学习标兵榜：按本人申报口径统计的学时排名
 *
 * II. 黑色幽默要点
 *
 * 1. 计数无需本人操作——停留即计数，离开页面即停止计数（回到页面继续计数）
 * 2. 第一题的两个选项措辞不同、含义相同；无论选哪个，结果都是同一句话
 * 3. 第二题"学习效果评价"的三个选项都是正向表述，且评价结果不计入统计样本
 * 4. 折算学时为次数 × 0.5，因此必然超出《学习时长统计办法》规定的年度上限，
 *    页脚以"两个口径不可比"作结
 *
 * @module pages/party/StudyCorner
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Panel, Progress } from '@/components/ui';
import { useApp } from '@/app-context';
import { STUDY_QUIZ, STUDY_RANKING } from '@/data/party';

/** 答题流程：问题 → 结果 → 评价 → 完成 */
type Step = 'quiz' | 'result' | 'evaluate' | 'done';

export default function StudyCorner() {
  const { pushToast } = useApp();

  /** 已学习次数：初始值取自上一次系统结转 */
  const [count, setCount] = useState(1247);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('quiz');
  const [picked, setPicked] = useState('');
  const [sessions, setSessions] = useState(1);

  // I. 停留即学习：每 8 秒自动累计一次，无需用户操作
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCount((c) => c + 1);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = (count * 0.5).toFixed(1);

  const startStudy = () => {
    setStep('quiz');
    setPicked('');
    setOpen(true);
  };

  const answerQuiz = (label: string) => {
    setPicked(label);
    setStep('result');
    setCount((c) => c + 1);
    setSessions((s) => s + 1);
    pushToast('学习成功', '本次学习已记录');
  };

  const answerEvaluate = (label: string) => {
    setPicked(label);
    setStep('done');
    pushToast('评价已提交', STUDY_QUIZ.evaluate.result);
  };

  const footer = () => {
    switch (step) {
      case 'quiz':
        return <span className="mg-party-quiz__foot">本题为单选题，两个选项均为有效答案。</span>;
      case 'result':
        return (
          <Button variant="primary" onClick={() => setStep('evaluate')}>
            下一步：学习效果评价
          </Button>
        );
      case 'evaluate':
        return <span className="mg-party-quiz__foot">本题为必答题，三个选项均为有效答案。</span>;
      default:
        return (
          <Button variant="primary" onClick={() => setOpen(false)}>
            关闭
          </Button>
        );
    }
  };

  return (
    <div>
      {/* I. 学习园地 */}
      <Panel
        title="学习园地"
        variant="red"
        extra={<span className="mg-party-mini">只增不减</span>}
      >
        <div className="mg-party-study">
          <div className="mg-party-study__counter">
            <span className="mg-party-study__num">{count.toLocaleString('en-US')}</span>
            <span className="mg-party-study__unit">次</span>
          </div>
          <div className="mg-party-study__label">您已学习（本计数由系统自动累计）</div>

          <div className="mg-party-metrics">
            <div className="mg-party-metrics__row">
              <span className="mg-party-metrics__label">折算学时</span>
              <span className="mg-party-metrics__value">
                {hours}
                <span className="mg-party-metrics__unit">学时</span>
              </span>
            </div>
            <div className="mg-party-metrics__row">
              <span className="mg-party-metrics__label">账户余额</span>
              <span className="mg-party-metrics__value">
                {hours}
                <span className="mg-party-metrics__unit">学时（不清零）</span>
              </span>
            </div>
            <div className="mg-party-metrics__row">
              <span className="mg-party-metrics__label">今日学习</span>
              <span className="mg-party-metrics__value">
                {sessions}
                <span className="mg-party-metrics__unit">次</span>
              </span>
            </div>
          </div>

          <div className="mg-party-study__progress">
            <div className="mg-party-study__progress-head">
              <span>本月学时达标进度</span>
              <span>100%</span>
            </div>
            <Progress percent={100} red />
            <div className="mg-party-study__hint">
              达标线为 0.5 学时。超出达标线的部分同样记录，但不再重复计为达标。
            </div>
          </div>

          <div className="mg-party-study__actions">
            <Button variant="primary" size="lg" onClick={startStudy}>
              在线学习
            </Button>
            <span className="mg-party-study__hint">
              点击后需完成一道单选题。答题时间不计入学时，也不计入办事时限。
            </span>
          </div>
        </div>
      </Panel>

      {/* II. 学习标兵榜 */}
      <Panel title="学习标兵榜" extra={<span className="mg-party-mini">按申报口径</span>}>
        {STUDY_RANKING.map((r, i) => (
          <div className="mg-party-rank__row" key={r.id}>
            <span className={`mg-party-rank__no${i === 0 ? ' is-top' : ''}`}>{i + 1}</span>
            <span className="mg-party-rank__name">{r.name}</span>
            <span className="mg-party-rank__dept">{r.dept}</span>
            <span className="mg-party-rank__hours">{r.hours.toLocaleString('en-US')}</span>
          </div>
        ))}
        <div className="mg-party-metrics__note">
          排行榜按本人申报口径统计。年度申报上限已于 9 月由 3,000 学时调整为 3,600 学时，
          调整前已申报部分不追溯调整。
        </div>
      </Panel>

      {/* III. 温馨提示 */}
      <Alert tone="yellow">
        在线学习平台维护时间：每周二 00:00—24:00。维护期间可正常学习，但学时不予记录，
        可于次日通过"手动申报"补录，每人每日限 1 次。
      </Alert>

      {/* IV. 答题窗 */}
      <Modal
        open={open}
        title={`在线学习 · 今日第 ${sessions} 次`}
        onClose={() => setOpen(false)}
        width={520}
        footer={footer()}
      >
        {step === 'quiz' && (
          <div className="mg-party-quiz">
            <div className="mg-party-quiz__q">{STUDY_QUIZ.question}</div>
            <div className="mg-party-quiz__opts">
              {STUDY_QUIZ.options.map((o) => (
                <Button key={o.key} variant="primary" size="lg" onClick={() => answerQuiz(o.label)}>
                  {o.label}
                </Button>
              ))}
            </div>
            <div className="mg-party-quiz__note">
              说明：本次学习为线上学习，时长 0.5 学时。答题即视为完成学习，无需另行提交学习笔记。
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="mg-party-quiz">
            <div className="mg-party-quiz__result">学习成功，本次学习已记录</div>
            <div className="mg-party-quiz__note">
              您选择的是「{picked}」。系统按同一口径记录本次学习：学习时长 0.5 学时，
              已计入个人学时账户，同时计入本月达标进度。
            </div>
            <div className="mg-party-quiz__note">
              重复提交不重复记录，重复记录不重复计算；本句已在本年度内重复出现 1,204 次。
            </div>
          </div>
        )}

        {step === 'evaluate' && (
          <div className="mg-party-quiz">
            <div className="mg-party-quiz__q">{STUDY_QUIZ.evaluate.question}</div>
            <div className="mg-party-quiz__opts">
              {STUDY_QUIZ.evaluate.options.map((o) => (
                <Button key={o} variant="default" size="lg" onClick={() => answerEvaluate(o)}>
                  {o}
                </Button>
              ))}
            </div>
            <div className="mg-party-quiz__note">
              评价结果用于改进学习组织工作。由于样本量已足够，评价结果不计入满意度统计样本。
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mg-party-quiz">
            <div className="mg-party-quiz__result">{STUDY_QUIZ.evaluate.result}</div>
            <div className="mg-party-quiz__note">
              您本次选择的是「{picked}」。本次学习用时由系统自动记录，用时长短不影响学时认定。
            </div>
            <div className="mg-party-quiz__note">{STUDY_QUIZ.note}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
