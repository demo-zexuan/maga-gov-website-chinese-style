/**
 * 站内矢量美术资源
 *
 * I. 设计说明
 *
 * 1. 全站所有徽标、剪影、图标均以 SVG 内联组件形式提供，避免额外网络请求，
 *    也保证在 Cloudflare 上零资源缺失风险。
 * 2. 风格刻意做成"土味矢量"：平涂色块 + 粗描边 + 高饱和红蓝金，贴合 2008 年
 *    前后政府网站美工的审美。
 *
 * II. 资源清单
 *
 * 1. GreatSeal      —— 圆形国徽风徽章
 * 2. FlagScene      —— 国旗 + 国会山剪影场景（站标左侧）
 * 3. LibertyScene   —— 自由女神剪影场景（站标右侧）
 * 4. EagleEmblem    —— 白头海雕徽记（左栏"伟大的美国梦"）
 * 5. ElephantEmblem —— 大象徽记（党建引领栏目）
 * 6. CapitolSilhouette —— 国会山剪影（通用装饰）
 * 7. USMapGrid      —— 美国本土 48 州方格地图
 * 8. ServiceIcons   —— 便民服务图标集
 *
 * @module components/art
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React from 'react';

/* ================= 通用接口 ================= */

export interface ArtProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/* ================= 1. 国徽 ================= */

/** 圆形国徽风徽章：外圈金字 + 中央白雕 + 星环 */
export function GreatSeal({ width = 108, height = 108, className, style }: ArtProps) {
  const stars = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(a) * 40, y: 50 + Math.sin(a) * 40 };
  });
  return (
    <svg viewBox="0 0 100 100" width={width} height={height} className={className} style={style}>
      <defs>
        <radialGradient id="seal-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#2b5fa8" />
          <stop offset="60%" stopColor="#123a72" />
          <stop offset="100%" stopColor="#071a34" />
        </radialGradient>
        <linearGradient id="seal-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a3" />
          <stop offset="50%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#a87d0a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#seal-ring)" />
      <circle cx="50" cy="50" r="43" fill="url(#seal-bg)" stroke="#071a34" strokeWidth="1" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#f5c542" strokeWidth="0.8" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="1.4" fill="#f5c542" />
      ))}
      {/* 白头海雕：极简平涂，靠轮廓辨识 */}
      <g>
        <ellipse cx="50" cy="49" rx="16" ry="9" fill="#ffffff" opacity="0.16" />
        <path
          d="M50 30c3 0 5 2 5 5v3l9-4-7 6 8 1-9 3 4 6-7-4-3 8-3-8-7 4 4-6-9-3 8-1-7-6 9 4v-3c0-3 2-5 5-5z"
          fill="#ffffff"
        />
        <path d="M43 46h14l3 3-3 3H43z" fill="#f5c542" />
        <circle cx="47" cy="46" r="1" fill="#071a34" />
        <circle cx="53" cy="46" r="1" fill="#071a34" />
        <path d="M40 60h20l-4 6H44z" fill="#ffffff" opacity="0.85" />
      </g>
      <path
        d="M22 66l6-4 6 4-6 4zM66 66l6-4 6 4-6 4z"
        fill="#f5c542"
        opacity="0.7"
      />
      <text
        x="50"
        y="79"
        textAnchor="middle"
        fontSize="6.5"
        fill="#f5c542"
        fontFamily="Times New Roman, serif"
        fontWeight="bold"
      >
        E PLURIBUS UNUM
      </text>
    </svg>
  );
}

/* ================= 2. 国旗 + 国会山 ================= */

/** 站标左侧场景：飘扬星条旗叠在国会山剪影之上 */
export function FlagScene({ width = 300, height = 132, className, style }: ArtProps) {
  const stripes = Array.from({ length: 13 }, (_, i) => i);
  const stars = Array.from({ length: 30 }, (_, i) => ({
    x: 10 + (i % 6) * 13.5,
    y: 10 + Math.floor(i / 6) * 11,
  }));
  return (
    <svg
      viewBox="0 0 300 132"
      width={width}
      height={height}
      className={className}
      style={style}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123a72" />
          <stop offset="100%" stopColor="#071a34" />
        </linearGradient>
        <linearGradient id="fs-cloth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#e2e8f2" stopOpacity="0.86" />
        </linearGradient>
        <clipPath id="fs-clip">
          {/* 旗面用波浪边裁切，模拟迎风飘扬 */}
          <path d="M0 0h300v132H0z" />
        </clipPath>
      </defs>
      <rect width="300" height="132" fill="url(#fs-sky)" />
      {/* 旗面 */}
      <g clipPath="url(#fs-clip)" opacity="0.96">
        <g transform="translate(-14 4) rotate(-3 150 66)">
          {stripes.map((i) => (
            <rect
              key={i}
              x="0"
              y={i * 10}
              width="330"
              height="10"
              fill={i % 2 === 0 ? '#b31942' : 'url(#fs-cloth)'}
            />
          ))}
          <rect x="0" y="0" width="140" height="70" fill="#0a3161" />
          {stars.map((s, i) => (
            <text
              key={i}
              x={s.x}
              y={s.y + 4}
              fontSize="7"
              fill="#ffffff"
              fontFamily="serif"
            >
              ★
            </text>
          ))}
        </g>
      </g>
      {/* 国会山剪影 */}
      <g fill="#0b1d33" opacity="0.94">
        <rect x="0" y="104" width="300" height="28" />
        <path d="M96 104v-16h108v16z" />
        <path d="M100 88l50-26 50 26z" />
        <ellipse cx="150" cy="86" rx="18" ry="8" />
        <rect x="148" y="46" width="4" height="14" />
        <circle cx="150" cy="43" r="5" />
        <path d="M60 104V92h20v12zM220 104V92h20v12z" />
      </g>
      {/* 光晕，让剪影从旗面里"跳"出来 */}
      <ellipse cx="150" cy="100" rx="140" ry="34" fill="#0b1d33" opacity="0.25" />
    </svg>
  );
}

/* ================= 3. 自由女神 ================= */

/** 站标右侧场景：自由女神剪影 + 火炬光晕 */
export function LibertyScene({ width = 260, height = 132, className, style }: ArtProps) {
  return (
    <svg
      viewBox="0 0 260 132"
      width={width}
      height={height}
      className={className}
      style={style}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2f60" />
          <stop offset="100%" stopColor="#071a34" />
        </linearGradient>
        <radialGradient id="ls-flame" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6cf" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#f5c542" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f5c542" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="260" height="132" fill="url(#ls-sky)" />
      {/* 火炬光晕 */}
      <circle cx="196" cy="26" r="46" fill="url(#ls-flame)" />
      {/* 女神剪影 */}
      <g fill="#0b1d33">
        {/* 身体（长袍） */}
        <path d="M116 132c2-30 6-52 14-66 6-10 14-14 20-14s14 4 20 14c8 14 12 36 14 66z" />
        {/* 头 */}
        <circle cx="150" cy="44" r="10" />
        {/* 冠冕 */}
        <path d="M138 40l-8-16 6 16zM144 36l-3-18 5 18zM150 35v-19l3 19zM156 36l3-18 3 18zM162 40l8-16-4 16z" />
        {/* 右臂举火炬 */}
        <path d="M170 60l26-30 6 5-26 32z" />
        <rect x="190" y="20" width="10" height="12" rx="1" />
        <path d="M195 6c5 6 8 10 8 14a8 8 0 1 1-16 0c0-4 3-8 8-14z" fill="#f5c542" />
        {/* 左臂抱法典 */}
        <path d="M118 74l-14 22 6 5 16-22z" />
        <rect x="96" y="92" width="18" height="14" fill="#123a72" opacity="0.9" />
      </g>
      {/* 基座 */}
      <rect x="104" y="126" width="92" height="6" fill="#0b1d33" />
      <text
        x="150"
        y="122"
        textAnchor="middle"
        fontSize="5.5"
        fill="#f5c542"
        opacity="0.65"
        fontFamily="Times New Roman, serif"
      >
        LIBERTY ENLIGHTENING THE WORLD
      </text>
    </svg>
  );
}

/* ================= 4. 白头海雕徽记 ================= */

/** 展翅白头海雕：左栏「伟大的美国梦」栏目标识 */
export function EagleEmblem({ width = 70, height = 56, className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 80 64" width={width} height={height} className={className} style={style}>
      <defs>
        <linearGradient id="ee-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c9d4e2" />
        </linearGradient>
      </defs>
      <g>
        {/* 双翼 */}
        <path
          d="M40 26C28 18 16 14 2 14c8 6 12 12 14 18 6-2 12-1 16 2z"
          fill="url(#ee-body)"
          stroke="#8a97a8"
          strokeWidth="0.6"
        />
        <path
          d="M40 26c12-8 24-12 38-12-8 6-12 12-14 18-6-2-12-1-16 2z"
          fill="url(#ee-body)"
          stroke="#8a97a8"
          strokeWidth="0.6"
        />
        {/* 躯干 */}
        <path d="M40 22c7 0 11 6 11 14 0 9-5 17-11 22-6-5-11-13-11-22 0-8 4-14 11-14z" fill="#ffffff" stroke="#8a97a8" strokeWidth="0.6" />
        {/* 尾羽 */}
        <path d="M32 56h16l-4 6h-8z" fill="#e8edf3" stroke="#8a97a8" strokeWidth="0.5" />
        {/* 头 */}
        <circle cx="40" cy="16" r="9" fill="#ffffff" stroke="#8a97a8" strokeWidth="0.6" />
        <path d="M47 15l10 3-10 3z" fill="#f5c542" />
        <circle cx="43" cy="14" r="1.4" fill="#071a34" />
        {/* 爪中的橄榄枝与箭 */}
        <path d="M26 44l14 6M54 44l-14 6" stroke="#8a97a8" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

/* ================= 5. 大象徽记 ================= */

/** 大象剪影徽记：党建/共和理念栏目用（讽刺语境下的"党徽"） */
export function ElephantEmblem({ width = 48, height = 48, className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" width={width} height={height} className={className} style={style}>
      <circle cx="24" cy="24" r="23" fill="#bd0000" stroke="#8b0000" strokeWidth="1.5" />
      <g fill="#fff">
        <path d="M15 16c0-4 3-7 7-7h4c4 0 7 3 7 7v10c0 3-2 5-5 5h-1v6h-4v-6h-2v6h-4v-6h-1c-3 0-5-2-5-5z" />
        <path d="M29 20c4 0 6 3 6 8 0 4-1 8-3 11-1 2-3 1-2-1 2-3 2-7 2-10 0-4-1-5-3-5z" />
        <circle cx="20" cy="18" r="1.6" fill="#bd0000" />
      </g>
      <g fill="#f5c542">
        <text x="24" y="14" textAnchor="middle" fontSize="7" fontFamily="serif">
          ★
        </text>
      </g>
    </svg>
  );
}

/* ================= 6. 国会山剪影 ================= */

export function CapitolSilhouette({ width = 120, height = 60, className, style }: ArtProps) {
  return (
    <svg viewBox="0 0 120 60" width={width} height={height} className={className} style={style}>
      <g fill="#123a72" opacity="0.85">
        <rect x="0" y="50" width="120" height="10" />
        <path d="M28 50V34h64v16z" />
        <path d="M32 34l28-18 28 18z" />
        <ellipse cx="60" cy="33" rx="12" ry="6" />
        <rect x="58" y="12" width="4" height="12" />
        <circle cx="60" cy="9" r="4" />
        <path d="M8 50V40h14v10zM98 50V40h14v10z" />
        <path d="M9 40l6-5 6 5zM99 40l6-5 6 5z" />
      </g>
    </svg>
  );
}

/* ================= 7. 美国方格地图 ================= */

/**
 * 美国本土 48 州简化方格地图
 *
 * 采用"瓦片地图"（tile grid map）形式：每个州是一个方块，按真实相对位置
 * 排列。这种画法在数据可视化里是正规做法，同时天然贴合古早网站的像素感。
 */
export const US_TILE_MAP: { code: string; row: number; col: number }[] = [
  { code: 'WA', row: 0, col: 0 }, { code: 'ID', row: 0, col: 1 }, { code: 'MT', row: 0, col: 2 },
  { code: 'ND', row: 0, col: 3 }, { code: 'MN', row: 0, col: 4 }, { code: 'WI', row: 0, col: 5 },
  { code: 'MI', row: 0, col: 6 }, { code: 'NY', row: 0, col: 8 }, { code: 'VT', row: 0, col: 9 },
  { code: 'ME', row: 0, col: 10 },
  { code: 'OR', row: 1, col: 0 }, { code: 'NV', row: 1, col: 1 }, { code: 'WY', row: 1, col: 2 },
  { code: 'SD', row: 1, col: 3 }, { code: 'IA', row: 1, col: 4 }, { code: 'IL', row: 1, col: 5 },
  { code: 'IN', row: 1, col: 6 }, { code: 'OH', row: 1, col: 7 }, { code: 'PA', row: 1, col: 8 },
  { code: 'NJ', row: 1, col: 9 }, { code: 'NH', row: 1, col: 10 },
  { code: 'CA', row: 2, col: 0 }, { code: 'UT', row: 2, col: 1 }, { code: 'CO', row: 2, col: 2 },
  { code: 'NE', row: 2, col: 3 }, { code: 'MO', row: 2, col: 4 }, { code: 'KY', row: 2, col: 5 },
  { code: 'WV', row: 2, col: 6 }, { code: 'VA', row: 2, col: 7 }, { code: 'MD', row: 2, col: 8 },
  { code: 'DE', row: 2, col: 9 }, { code: 'MA', row: 2, col: 10 },
  { code: 'AZ', row: 3, col: 1 }, { code: 'NM', row: 3, col: 2 }, { code: 'KS', row: 3, col: 3 },
  { code: 'AR', row: 3, col: 4 }, { code: 'TN', row: 3, col: 5 }, { code: 'NC', row: 3, col: 6 },
  { code: 'SC', row: 3, col: 7 }, { code: 'DC', row: 3, col: 8 }, { code: 'RI', row: 3, col: 10 },
  { code: 'OK', row: 4, col: 3 }, { code: 'LA', row: 4, col: 4 }, { code: 'MS', row: 4, col: 5 },
  { code: 'AL', row: 4, col: 6 }, { code: 'GA', row: 4, col: 7 },
  { code: 'HI', row: 5, col: 0 }, { code: 'TX', row: 5, col: 3 }, { code: 'FL', row: 5, col: 8 },
];

export interface USMapGridProps extends ArtProps {
  /** 高亮州代码 */
  highlight?: string[];
  /** 点击回调 */
  onSelect?: (code: string) => void;
  /** 每格边长（px） */
  cell?: number;
  /** 是否可交互 */
  interactive?: boolean;
}

/** 方格版美国地图 */
export function USMapGrid({
  width,
  height,
  className,
  style,
  highlight = [],
  onSelect,
  cell = 15,
  interactive = false,
}: USMapGridProps) {
  const cols = 11;
  const rows = 6;
  const gap = 1.5;
  const w = cols * (cell + gap);
  const h = rows * (cell + gap);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={width ?? w}
      height={height ?? h}
      className={className}
      style={style}
    >
      {US_TILE_MAP.map((t) => {
        const on = highlight.includes(t.code);
        return (
          <g key={t.code} transform={`translate(${t.col * (cell + gap)} ${t.row * (cell + gap)})`}>
            <rect
              width={cell}
              height={cell}
              fill={on ? '#bd0000' : '#2b6cb0'}
              stroke="#ffffff"
              strokeWidth="0.6"
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(t.code)}
            >
              <title>{t.code}</title>
            </rect>
            <text
              x={cell / 2}
              y={cell / 2 + 2.4}
              textAnchor="middle"
              fontSize={cell * 0.42}
              fill={on ? '#fff' : '#dbe8f7'}
              fontFamily="Times New Roman, serif"
              style={{ pointerEvents: 'none' }}
            >
              {t.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ================= 8. 服务图标集 ================= */

/** 便民服务图标 key 集合 */
export type ServiceIconKey =
  | 'shield'
  | 'passport'
  | 'gun'
  | 'tax'
  | 'medicare'
  | 'license'
  | 'subsidy'
  | 'refund'
  | 'house'
  | 'car'
  | 'baby'
  | 'business'
  | 'pet'
  | 'marriage'
  | 'veteran'
  | 'school';

/**
 * 便民服务图标
 *
 * 统一 40×40 视口、平涂 + 圆形红底，保证在图标格里大小观感一致。
 *
 * @param name 图标 key
 */
export function ServiceIcon({ name, className, style, width = 34, height = 34 }: ArtProps & { name: string }) {
  const common = { width, height, className, style };
  const wrap = (children: React.ReactNode, bg = '#bd0000') => (
    <svg viewBox="0 0 40 40" {...common}>
      <circle cx="20" cy="20" r="19" fill={bg} />
      <circle cx="20" cy="20" r="19" fill="none" stroke="#8b0000" strokeWidth="1" />
      <g fill="#ffffff">{children}</g>
    </svg>
  );

  switch (name) {
    case 'shield':
      return wrap(
        <>
          <path d="M20 8l10 4v9c0 6-4 11-10 13-6-2-10-7-10-13v-9z" />
          <path d="M14 20l4 4 8-8" stroke="#bd0000" strokeWidth="2.4" fill="none" />
        </>
      );
    case 'passport':
      return wrap(
        <>
          <rect x="11" y="7" width="18" height="26" rx="1" />
          <circle cx="20" cy="17" r="4.5" fill="#123a72" />
          <path d="M14 27h12v3H14z" fill="#123a72" />
        </>
      );
    case 'gun':
      return wrap(
        <>
          <path d="M8 17h18v5H8zM11 22h5v6h-5zM24 18h7l-2 4h-5z" />
          <circle cx="14" cy="25" r="3.4" fill="#123a72" />
        </>
      );
    case 'tax':
      return wrap(
        <>
          <rect x="11" y="6" width="18" height="28" rx="1" />
          <path d="M15 12h10v2H15zM15 17h10v2H15zM15 22h6v2h-6z" fill="#bd0000" />
          <path d="M24 24l6 6-2 2-6-6z" fill="#f5c542" />
        </>
      );
    case 'medicare':
      return wrap(
        <>
          <path d="M20 33S9 26 9 18a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 8-11 15-11 15z" />
          <path d="M18 15h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="#bd0000" />
        </>
      );
    case 'license':
      return wrap(
        <>
          <rect x="7" y="10" width="26" height="20" rx="1" />
          <circle cx="15" cy="19" r="4" fill="#123a72" />
          <path d="M22 16h8v2h-8zM22 21h8v2h-8zM10 26h20v2H10z" fill="#123a72" />
        </>
      );
    case 'subsidy':
      return wrap(
        <>
          <path d="M20 7l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" />
          <path d="M12 30h16v3H12z" fill="#f5c542" />
        </>
      );
    case 'refund':
      return wrap(
        <>
          <path d="M20 8a12 12 0 1 1-11 7h3.4A9 9 0 1 0 20 11v5l-7-6 7-6z" />
          <path d="M18 18h4v10h-4zM18 14h4v3h-4z" fill="#bd0000" />
        </>
      );
    case 'house':
      return wrap(
        <>
          <path d="M20 8l13 11h-4v13H11V19H7z" />
          <path d="M17 24h6v8h-6z" fill="#123a72" />
        </>
      );
    case 'car':
      return wrap(
        <>
          <path d="M9 22l3-8h16l3 8v7h-4v3h-4v-3H17v3h-4v-3H9z" />
          <circle cx="14" cy="25" r="2.4" fill="#123a72" />
          <circle cx="26" cy="25" r="2.4" fill="#123a72" />
        </>
      );
    case 'baby':
      return wrap(
        <>
          <circle cx="20" cy="14" r="6" />
          <path d="M20 20c5 0 8 4 8 9v4H12v-4c0-5 3-9 8-9z" />
          <circle cx="17.5" cy="13" r="1" fill="#bd0000" />
          <circle cx="22.5" cy="13" r="1" fill="#bd0000" />
        </>
      );
    case 'business':
      return wrap(
        <>
          <path d="M8 14h24v20H8z" />
          <path d="M15 8h10v6H15z" fill="#123a72" />
          <path d="M12 18h4v4h-4zM18 18h4v4h-4zM24 18h4v4h-4zM12 25h4v4h-4zM18 25h4v4h-4zM24 25h4v4h-4z" fill="#bd0000" />
        </>
      );
    case 'pet':
      return wrap(
        <>
          <circle cx="20" cy="24" r="7" />
          <circle cx="12" cy="16" r="3.2" />
          <circle cx="28" cy="16" r="3.2" />
          <circle cx="16" cy="11" r="3.2" />
          <circle cx="24" cy="11" r="3.2" />
        </>
      );
    case 'marriage':
      return wrap(
        <>
          <circle cx="15" cy="22" r="7" fill="none" stroke="#ffffff" strokeWidth="2.6" />
          <circle cx="25" cy="22" r="7" fill="none" stroke="#f5c542" strokeWidth="2.6" />
        </>
      );
    case 'veteran':
      return wrap(
        <>
          <path d="M20 7l2.6 6.4 7 .6-5.3 4.6 1.6 6.9L20 21.9l-5.9 3.6 1.6-6.9L10.4 14l7-.6z" />
          <path d="M13 29h14v5H13z" fill="#f5c542" />
        </>
      );
    case 'school':
      return wrap(
        <>
          <path d="M20 9l14 7-14 7-14-7z" />
          <path d="M11 20v7c0 2 4 4 9 4s9-2 9-4v-7l-9 4.5z" fill="#f5c542" />
        </>
      );
    default:
      return wrap(<circle cx="20" cy="20" r="8" />);
  }
}

/* ================= 9. 小图标（工具条 / 列表用） ================= */

export function IconHome({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 15" width={size} height={size * 0.94} aria-hidden>
      <path d="M8 0.5L15 6.5h-2v8h-3.5v-4.5h-3V14.5H3v-8H1z" fill="#ffe9a3" />
    </svg>
  );
}

export function IconPrev({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.45)" stroke="#fff" strokeWidth="1" />
      <path d="M14.5 6L8.5 12l6 6" stroke="#fff" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

export function IconNext({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.45)" stroke="#fff" strokeWidth="1" />
      <path d="M9.5 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

export function IconSearch({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
      <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
