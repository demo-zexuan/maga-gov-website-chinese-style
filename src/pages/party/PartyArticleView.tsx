/**
 * 党建文章详情视图
 *
 * I. 展示内容
 *
 * 1. 文章标题、导语、来源 / 日期 / 文号 / 阅读量
 * 2. 正文段落（3—6 段）
 * 3. 原文摘录：自动从正文中挑出"数字最多"的一句话，作为可单独截图的段落
 * 4. 学习记录条：点击「学习本文」写入学习时长
 *
 * II. 设计说明
 *
 * 1. 「原文摘录」不是在正文里随便挑一句，而是挑数字最密集的一句。理由很朴素：
 *    这个栏目的荒谬全部藏在数字里，数字最多的那句，通常就是笑点所在。
 * 2. 详情视图不单独占一条路由，而是由栏目页在列表位置就地渲染，
 *    这样从列表进入详情、返回列表都不会丢失分页状态。
 *
 * @module pages/party/PartyArticleView
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Alert, Badge, Button } from '@/components/ui';
import { useApp } from '@/app-context';
import type { Article } from '@/data/types';

/** 栏目名（用于详情页脚注） */
const CATEGORY_LABEL: Record<string, string> = {
  news: '党建要闻',
  study: '理论学习',
  model: '先进典型',
  clean: '廉政建设',
};

/**
 * 从正文中挑选一句最适合单独摘录的话
 *
 * I. 规则
 *
 * 1. 把正文切成句子（以句号、分号为界），逐句统计数字个数
 * 2. 取数字最多的一句；数字相同时取较长的一句（上限 60 字参与比较）
 * 3. 命中句超过 140 字时截断，避免摘录框被撑满
 *
 * II. 为什么以数字多少为尺度
 *
 * 本栏目的荒谬全部藏在具体数字里，数字最密集的一句话，通常就是最适合截图的那句。
 *
 * @param body - 正文段落
 * @returns 可独立成段的摘录文字
 */
function pickQuote(body: string[]): string {
  const sentences: string[] = [];
  body.forEach((p) => {
    p.split(/(?<=[。；])/).forEach((s) => {
      const t = s.trim();
      if (t) sentences.push(t);
    });
  });

  let best = '';
  let bestScore = -1;
  sentences.forEach((s) => {
    const digits = (s.match(/\d/g) ?? []).length;
    const score = digits * 10 + Math.min(s.length, 60);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  });

  const fallback = best || body[0] || '';
  return fallback.length > 140 ? `${fallback.slice(0, 140)}……` : fallback;
}

export interface PartyArticleViewProps {
  article: Article;
  /** 返回列表 */
  onBack: () => void;
}

export default function PartyArticleView({ article, onBack }: PartyArticleViewProps) {
  const { pushToast } = useApp();
  const categoryLabel = CATEGORY_LABEL[article.category] ?? '党建要闻';

  return (
    <div className="mg-panel">
      <div className="mg-article">
        <h1 className="mg-article__title">{article.title}</h1>
        {article.summary && <div className="mg-article__subtitle">{article.summary}</div>}

        <div className="mg-article__meta">
          <span>{article.source}</span>
          <span>{article.date}</span>
          {article.docNo && <span>{article.docNo}</span>}
          <span className="mg-article__meta-right">
            <span>阅读 {article.views?.toLocaleString('en-US') ?? '—'}</span>
            <Button size="sm" onClick={onBack}>
              返回列表
            </Button>
          </span>
        </div>

        <div className="mg-article__body">
          {article.body.map((p, i) => (
            <p key={`${article.id}-p${i}`}>{p}</p>
          ))}

          <blockquote>
            <div className="mg-party-quote-label">原文摘录</div>
            {pickQuote(article.body)}
          </blockquote>
        </div>

        <div className="mg-article__foot">
          <div className="mg-party-detail__tags">
            <Badge tone="navy">{categoryLabel}</Badge>
            {article.badge && <Badge tone={article.badgeTone ?? 'red'}>{article.badge}</Badge>}
            {article.top && <Badge tone="gold">置顶</Badge>}
            <span>本文已收入《{categoryLabel}汇编（2026）》第 {article.id.slice(-3)} 页</span>
          </div>

          <div className="mg-party-detail__study">
            <Button
              variant="primary"
              onClick={() =>
                pushToast('学习成功', '本次学习已记录')
              }
            >
              学习本文
            </Button>
            <span className="mg-party-detail__study-note">
              学完本文折算 0.5 学时。同一篇文章重复学习不重复计入学时，但重复学习仍会记录为一次学习。
            </span>
          </div>

          <Alert tone="gray">
            本文为学习材料，如需引用请以印发文件为准；印发文件与本页不一致的，以印发文件为准；
            印发文件已归档且暂不外借的，以本页为准。
          </Alert>
        </div>
      </div>
    </div>
  );
}
