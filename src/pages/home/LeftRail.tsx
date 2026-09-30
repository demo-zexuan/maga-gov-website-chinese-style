/**
 * 首页左栏（218px）
 *
 * I. 组成（自上而下，与参考图一致）
 *
 * 1. 「伟大的美国梦 / A GREATER AMERICA」卡片 —— 鹰徽 + 4 条图标项
 * 2. 「团结 · 创新 · 服务」图片横幅 —— 沙漠公路配图 + 底部浮层
 * 3. 「联邦便民服务移动端 APP」卡片 —— 蓝底标题 + 二维码 + 两条小标语
 * 4. 「致敬我们的退伍军人」图片横幅 —— 敬礼剪影 + 底部浮层
 *
 * II. 素材说明
 *
 * 配图一律取 `@/data/assets` 的常量路径（站点根路径）。
 * 站点使用 hash 路由，写相对路径会在深层路由下 404。
 *
 * @module pages/home/LeftRail
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { EagleEmblem, ServiceIcon } from '@/components/art';
import { ASSETS } from '@/data/assets';
import {
  APP_CARD,
  APP_CHIPS,
  DREAM_ITEMS,
  UNITY_BANNER,
  VETERAN_BANNER,
} from '@/data/home';
import { Link } from '@/router';

export function LeftRail() {
  return (
    <aside className="mg-home__left">
      {/* ① 伟大的美国梦 */}
      <div className="mg-dream-card">
        <div className="mg-dream-card__head">
          <EagleEmblem className="mg-home__dream-eagle" width={70} height={56} />
          <div className="mg-home__dream-head-text">
            <div className="mg-dream-card__title">伟大的美国梦</div>
            <div className="mg-dream-card__title-en">A GREATER AMERICA</div>
          </div>
        </div>

        {DREAM_ITEMS.map((item) => (
          <Link key={item.text} to="/service" className="mg-dream-card__item">
            <ServiceIcon
              className="mg-dream-card__icon"
              name={item.icon}
              width={22}
              height={22}
            />
            <span>{item.text}</span>
          </Link>
        ))}
      </div>

      {/* ② 团结 · 创新 · 服务 */}
      <div className="mg-banner-card">
        <img
          className="mg-banner-card__img mg-home__banner-img"
          src={ASSETS.desert}
          alt={UNITY_BANNER.title}
        />
        <div className="mg-banner-card__caption">
          <div className="mg-home__banner-title">{UNITY_BANNER.title}</div>
          <div className="mg-home__banner-sub">{UNITY_BANNER.sub}</div>
        </div>
      </div>

      {/* ③ 联邦便民服务移动端 APP */}
      <div className="mg-home__app">
        <div className="mg-home__app-body">
          <div className="mg-home__app-text">
            <div className="mg-home__app-title">{APP_CARD.title}</div>
            <div className="mg-home__app-title2">{APP_CARD.title2}</div>
            <div className="mg-home__app-chips">
              {APP_CHIPS.map((c) => (
                <span key={c} className="mg-home__app-chip">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="mg-home__app-qr-wrap">
            <img className="mg-home__app-qr" src={ASSETS.appQr} alt={APP_CARD.qrCaption} />
            <div className="mg-home__app-qr-caption">{APP_CARD.qrCaption}</div>
          </div>
        </div>
        <div className="mg-home__app-note">{APP_CARD.note}</div>
      </div>

      {/* ④ 致敬我们的退伍军人 */}
      <div className="mg-banner-card mg-home__card--tight">
        <img
          className="mg-banner-card__img mg-home__banner-img mg-home__banner-img--short"
          src={ASSETS.veterans}
          alt={VETERAN_BANNER.title}
        />
        <div className="mg-banner-card__caption">
          <div className="mg-home__banner-title">{VETERAN_BANNER.title}</div>
          <div className="mg-home__banner-sub">{VETERAN_BANNER.sub}</div>
        </div>
      </div>
      <div className="mg-home__banner-note">{VETERAN_BANNER.note}</div>
    </aside>
  );
}

export default LeftRail;
