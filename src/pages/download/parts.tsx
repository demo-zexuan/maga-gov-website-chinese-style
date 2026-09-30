/**
 * 下载中心可复用部件
 *
 * I. 内容清单
 *
 * 1. QrCode   —— 纯 SVG 伪二维码（点阵由文件名哈希稳定生成，不使用任何依赖）
 * 2. DlRow    —— 表格 / 指南列表行，复用 pages.css 的 .mg-dl-row 体系
 * 3. AppCard  —— 客户端卡片，含二维码、系统要求与下载入口
 *
 * II. 设计说明
 *
 * 1. 二维码为演示图形，不可识别，卡片上必须写明这一点，避免用户真的去扫。
 * 2. 列表行必须把 remark 显示出来：本模块的吐槽位全部写在各条目的 remark 里，
 *    只显示文件名的下载列表会把整个模块的笑点藏起来。
 *
 * @module pages/download/parts
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { Badge, Button } from '@/components/ui';
import type { DownloadItem } from '@/data/types';
import { formatNumber } from '@/data/stats';
import type { AppItem } from '@/data/downloads';

/* ================= 1. 伪二维码 ================= */

const QR_SIZE = 21;

/**
 * 伪二维码
 *
 * 点阵由一个稳定的散列序列生成：同一段文字永远得到同一张图，便于截图对比。
 * 生成的图形不具备二维码编码能力，仅作视觉占位。
 *
 * @param text - 参与散列的文本（通常是下载链接 id）
 * @param px   - 边长像素
 */
export function QrCode({ text, px = 84 }: { text: string; px?: number }) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= QR_SIZE - 7) || (r >= QR_SIZE - 7 && c < 7);

  const dots: { r: number; c: number }[] = [];
  for (let r = 0; r < QR_SIZE; r += 1) {
    for (let c = 0; c < QR_SIZE; c += 1) {
      if (isFinder(r, c)) continue;
      if (rand() > 0.52) dots.push({ r, c });
    }
  }

  const cell = px / QR_SIZE;
  return (
    <svg
      viewBox={`0 0 ${px} ${px}`}
      width={px}
      height={px}
      className="mg-dl-qr"
      role="img"
      aria-label="下载二维码（演示图形）"
    >
      <rect className="mg-dl-qr__bg" width={px} height={px} />
      {dots.map((d) => (
        <rect
          key={`${d.r}-${d.c}`}
          className="mg-dl-qr__dot"
          x={d.c * cell}
          y={d.r * cell}
          width={cell}
          height={cell}
        />
      ))}
      {[
        [0, 0],
        [0, QR_SIZE - 7],
        [QR_SIZE - 7, 0],
      ].map(([r0, c0]) => (
        <g key={`finder-${r0}-${c0}`} transform={`translate(${c0 * cell} ${r0 * cell})`}>
          <rect className="mg-dl-qr__dot" width={cell * 7} height={cell * 7} />
          <rect className="mg-dl-qr__bg" x={cell} y={cell} width={cell * 5} height={cell * 5} />
          <rect className="mg-dl-qr__dot" x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} />
        </g>
      ))}
    </svg>
  );
}

/* ================= 2. 列表行 ================= */

export interface DlRowProps {
  item: DownloadItem;
  /** 本次会话额外计入的下载次数 */
  extraCount: number;
  onDownload: (item: DownloadItem) => void;
}

/** 表格 / 指南列表行 */
export function DlRow({ item, extraCount, onDownload }: DlRowProps) {
  const total = item.downloads + extraCount;
  return (
    <div className="mg-dl-row">
      <span className="mg-dl-row__format" data-fmt={item.format}>
        {item.format}
      </span>
      <div className="mg-dl-row__main">
        <div className="mg-dl-row__name" title={item.name}>
          {item.name}
        </div>
        <div className="mg-dl-row__sub">
          <span className="mg-dl-row__no">{item.formNo}</span>
          <span className="mg-dl-row__dept">{item.department}</span>
        </div>
        <div className="mg-dl-row__remark">{item.remark}</div>
      </div>
      <span className="mg-dl-row__meta">
        {item.size} · {item.date}
        <span className="mg-dl-row__count">已下载 {formatNumber(total)} 次</span>
      </span>
      <Button size="sm" variant="primary" onClick={() => onDownload(item)}>
        下载
      </Button>
    </div>
  );
}

/* ================= 3. 客户端卡片 ================= */

/** 各平台的系统要求（按当前支持的平台书写，不承诺未来版本） */
export function appRequirement(platform: string): string {
  switch (platform) {
    case 'Windows':
      return '系统要求：当前仅支持 Windows 7 及以上；需 .NET Framework 4.8。';
    case 'Android':
      return '系统要求：当前仅支持 Android 8.0 及以上；需允许安装未知来源应用。';
    case 'iOS':
      return '系统要求：当前仅支持 iOS 13 及以上；需安装描述文件并在设置中信任。';
    default:
      return '系统要求：当前支持 Windows 7 及以上与 macOS 10.13 及以上；需浏览器允许运行插件。';
  }
}

export interface AppCardProps {
  app: AppItem;
  /** 本次会话额外计入的下载次数（客户端同样计入） */
  extraCount: number;
  onDownload: (app: AppItem) => void;
  onInstallNote: (app: AppItem) => void;
}

/** 客户端下载卡片 */
export function AppCard({ app, extraCount, onDownload, onInstallNote }: AppCardProps) {
  return (
    <div className="mg-app-card">
      <div className="mg-app-card__head">
        <span className="mg-app-card__name">{app.name}</span>
        <Badge tone="navy">{app.platform}</Badge>
      </div>

      <div className="mg-app-card__body">
        <div className="mg-app-card__qr">
          <QrCode text={`uspcs://download/${app.id}`} />
          <div className="mg-app-card__qr-note">扫码下载（演示图形，不可识别）</div>
        </div>
        <ul className="mg-app-card__meta">
          <li>
            版本号：<b>{app.version}</b>
          </li>
          <li>
            安装包大小：<b>{app.size}</b>
          </li>
          <li>
            更新日期：<b>{app.date}</b>
          </li>
          <li>
            本次会话下载：<b>{extraCount} 次</b>
          </li>
        </ul>
      </div>

      <div className="mg-app-card__req">{appRequirement(app.platform)}</div>
      <div className="mg-app-card__note">{app.note}</div>

      <div className="mg-app-card__actions">
        <Button size="sm" variant="primary" onClick={() => onDownload(app)}>
          下载客户端
        </Button>
        <Button size="sm" onClick={() => onInstallNote(app)}>
          查看安装说明
        </Button>
      </div>
    </div>
  );
}
