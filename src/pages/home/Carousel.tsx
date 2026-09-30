/**
 * 首页中部轮播
 *
 * I. 功能
 *
 * 1. 5 张 16:9 配图循环播放，间隔 5 秒，鼠标悬停暂停。
 * 2. 左右圆形半透明箭头（对应 `.mg-home__carousel-nav--prev/--next`）。
 * 3. 底部标题 + 副标题浮层，浮层下方为圆点分页。
 *
 * II. 实现说明
 *
 * 1. 下标用「单调递增 + 取模回绕」而不是在 0..4 之间自增：
 *    这样左右箭头在边界处的行为一致，也方便后续加入无限滚动。
 * 2. 配图一律走 `heroAt(i)`，它内部已做取模保护，越界不会返回 undefined。
 *
 * @module pages/home/Carousel
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { IconNext, IconPrev } from '@/components/art';
import { heroAt, HERO_COUNT } from '@/data/assets';
import { HERO_SLIDES } from '@/data/home';
import { Link } from '@/router';

/** 自动播放间隔（毫秒）—— 与参考站一致的 5 秒 */
const INTERVAL = 5000;

export function Carousel() {
  // I. 单调递增的播放位置，渲染时再回绕到 [0, HERO_COUNT)
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  // II. 自动播放：悬停暂停，离开后继续
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused]);

  const index = ((tick % HERO_COUNT) + HERO_COUNT) % HERO_COUNT;
  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

  const goPrev = () => setTick((t) => t - 1);
  const goNext = () => setTick((t) => t + 1);

  return (
    <div
      className="mg-home__carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img className="mg-home__carousel-img" src={heroAt(index)} alt={slide.title} />

      <button
        type="button"
        className="mg-home__carousel-nav mg-home__carousel-nav--prev"
        aria-label="上一张"
        onClick={goPrev}
      >
        <IconPrev size={22} />
      </button>
      <button
        type="button"
        className="mg-home__carousel-nav mg-home__carousel-nav--next"
        aria-label="下一张"
        onClick={goNext}
      >
        <IconNext size={22} />
      </button>

      <div className="mg-home__carousel-caption">
        <Link to={slide.href} className="mg-home__carousel-title">
          {slide.title}
        </Link>
        <div className="mg-home__carousel-sub">{slide.sub}</div>
      </div>

      <div className="mg-home__carousel-dots">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`第 ${i + 1} 张：${s.title}`}
            className={`mg-home__carousel-dot${i === index ? ' is-active' : ''}`}
            onClick={() => setTick(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;
