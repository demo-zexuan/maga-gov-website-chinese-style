/**
 * 全局提示层
 *
 * I. 用途
 *
 * 渲染 AppProvider 里的 toasts 队列，样式为古早网站那种深色小黄条，
 * 固定右下角堆叠。
 *
 * II. 归属
 *
 * 本文件由 Lead 维护，Sub 请勿修改；需要弹提示请使用 useApp().pushToast。
 *
 * @module components/ToastLayer
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useApp } from '@/app-context';

export function ToastLayer() {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 950 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="mg-easter-toast"
          style={{ position: 'relative', right: 'auto', bottom: 'auto', marginTop: 8 }}
          role="status"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: '1 1 auto' }}>
              <div className="mg-easter-toast__title">{t.title}</div>
              <div>{t.text}</div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="关闭提示"
              style={{
                flex: '0 0 auto',
                width: 16,
                height: 16,
                lineHeight: '14px',
                fontSize: 11,
                background: 'transparent',
                color: '#f5c542',
                border: '1px solid rgba(245,197,66,.5)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
