/**
 * 党建引领栏目顶部横幅
 *
 * I. 结构
 *
 * 1. 左侧：大象徽记（本栏目的视觉符号，与 MAGA 美术风格统一）
 * 2. 中间：主标语 + 副标语 + 数据条
 * 3. 右侧：党建考核得分牌
 *
 * II. 设计说明
 *
 * 1. 红色大幅面横幅是古早政府网站栏目页的标准开头，横幅之下才是正文，
 *    这个顺序本身就是"栏目气质"的一部分。
 * 2. 副标语刻意写成两个"心坎"：群众的心坎与上级的心坎。二者并列时不需要
 *    任何评论，荒谬自明。
 * 3. 得分牌显示满分，是因为该指标的统计口径由本单位确定。
 *
 * @module pages/party/PartyBanner
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { ElephantEmblem } from '@/components/art';

export default function PartyBanner() {
  return (
    <div className="mg-party-banner">
      {/* I. 徽记 */}
      <div className="mg-party-banner__emblem">
        <ElephantEmblem width={62} height={62} />
      </div>

      {/* II. 标语 */}
      <div className="mg-party-banner__text">
        <div className="mg-party-banner__main">坚持以共和党先进治理理念 引领便民服务工作</div>
        <div className="mg-party-banner__sub">
          把服务做到群众心坎上，把台账做到上级心坎上，把学时记到每一位同志头上
        </div>
        <div className="mg-party-banner__meta">
          全局党员 1,204 名 · 党支部 38 个 · 党员示范岗 100 个 · 本年度学习时长达标率 100% ·
          补记台账占比 63.4%
        </div>
      </div>

      {/* III. 考核得分牌 */}
      <div className="mg-party-banner__seal">
        <div className="mg-party-banner__seal-line">党建考核</div>
        <div className="mg-party-banner__seal-score">100</div>
        <div className="mg-party-banner__seal-line">分 / 满分 100 分</div>
        <div className="mg-party-banner__seal-note">附加分 3 分不计入</div>
      </div>
    </div>
  );
}
