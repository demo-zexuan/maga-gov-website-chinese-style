/**
 * 全站彩蛋层
 *
 * I. 彩蛋清单（全部可真实触发）
 *
 * 1. Konami 秘技 ↑↑↓↓←→←→BA —— 切换"鹰眼模式"：所有面板标题改为"已阅 ★"，并弹出成就提示；
 *    再次输入可关闭，关闭时提示"标题已恢复为本来的标题"。
 * 2. 控制台彩蛋 —— 打印 ASCII 鹰徽与招聘文案（要求：会写表格、能背热线、接受 60 个工作日答复周期）。
 * 3. 页脚标语连点 5 次（3 秒内）—— 弹出"建国 250 周年纪念"弹窗。
 * 4. 站标国徽快速连点 7 次（4 秒内）—— 弹出"内部通报"隐藏页面。
 * 5. 连续停留 60 秒 —— 弹出停留时长提示（本站用户平均停留时长的 12 倍）。
 * 6. 访问 5 个不同页面 —— 弹出"办事达人"成就。
 *
 * II. 实现约定
 *
 * 1. 解锁状态记录在 sessionStorage，同一会话内已解锁的彩蛋不重复弹窗。
 * 2. 鹰眼模式通过动态注入 <style> 到 document.head 实现，并给 <html> 加 class，
 *    不修改任何既有样式文件与 shell 组件。
 * 3. 页脚标语与站标国徽的点击使用 document 级事件委托（捕获阶段），
 *    因此无需修改 src/components/shell/index.tsx。
 *
 * @module easter
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { navigate, useRoute } from '@/router';
import { CONSOLE_FOOT, EAGLE_ASCII, RECRUIT_TEXT } from './art';

/* ================= sessionStorage 键名 ================= */

const KEY_KONAMI = 'mg.easter.konami';
const KEY_DWELL = 'mg.easter.dwell';
const KEY_FOOTER = 'mg.easter.footer';
const KEY_SEAL = 'mg.easter.seal';
const KEY_VISITED = 'mg.easter.visited';
const KEY_EXPLORER = 'mg.easter.explorer';
const KEY_CONSOLE = 'mg.easter.console';

/** 安全读取 sessionStorage（隐私模式下可能抛错） */
function ssGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 安全写入 sessionStorage */
function ssSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // 隐私模式下写入失败：彩蛋降级为"每次都可触发"，不影响功能
  }
}

/* ================= 鹰眼模式 ================= */

const EAGLE_STYLE_ID = 'mg-eagle-mode-style';

/**
 * 鹰眼模式样式
 *
 * 只作用于面板标题、侧栏标题与弹窗标题，用 ::before 显示"已阅"，不改动内容本身。
 */
const EAGLE_CSS = `
html.eagle-mode .mg-panel__head { background: var(--c-panel-head-gold); }
html.eagle-mode .mg-panel { border-color: var(--c-gold-deep); }
html.eagle-mode .mg-sidenav__head { background: var(--c-panel-head-gold); color: var(--c-navy-deep); }
html.eagle-mode .mg-panel__head-text,
html.eagle-mode .mg-sidenav__head,
html.eagle-mode .mg-modal__title {
  font-size: 0 !important;
  letter-spacing: 0 !important;
}
html.eagle-mode .mg-panel__head-text::before,
html.eagle-mode .mg-sidenav__head::before,
html.eagle-mode .mg-modal__title::before {
  content: '已阅 ★';
  font-family: var(--font-hei);
  font-size: 14px !important;
  letter-spacing: 1px;
  color: inherit;
}
html.eagle-mode .mg-panel__head-extra,
html.eagle-mode .mg-panel__head-extra a { color: var(--c-navy-deep) !important; }
`;

/** Konami 序列 */
const KONAMI_SEQUENCE = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
];

/**
 * 判断点击坐标是否落在目标元素的矩形范围内
 *
 * 站标国徽（.mg-header__seal）是绝对定位的装饰图形，实际被 .mg-header__center
 * 覆盖，点击事件不会以国徽本身为目标元素。这里用坐标命中代替事件目标判断，
 * 保证"点击国徽区域"始终有效，无需修改 shell 组件与既有样式。
 *
 * @param selector - 目标元素选择器
 * @param x        - 点击点视口坐标 X
 * @param y        - 点击点视口坐标 Y
 * @returns 命中返回 true
 */
function hitTestRect(selector: string, x: number, y: number): boolean {
  const el = document.querySelector(selector);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/* ================= 组件 ================= */

interface EggToast {
  id: number;
  title: string;
  text: string;
}

export function EasterEggLayer() {
  const { path } = useRoute();

  const [toasts, setToasts] = useState<EggToast[]>([]);
  const [anniversaryOpen, setAnniversaryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const toastId = useRef(0);
  const footerClicks = useRef<number[]>([]);
  const sealClicks = useRef<number[]>([]);

  /** 弹出一条金色彩蛋提示 */
  const eggToast = useCallback((title: string, text: string) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev.slice(-2), { id, title, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 9000);
  }, []);

  /* ---- I. 注入鹰眼模式样式，并在本会话内保持已开启状态 ---- */
  useEffect(() => {
    if (!document.getElementById(EAGLE_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = EAGLE_STYLE_ID;
      style.textContent = EAGLE_CSS;
      document.head.appendChild(style);
    }
    if (ssGet(KEY_KONAMI) === 'on') {
      document.documentElement.classList.add('eagle-mode');
    }
  }, []);

  /* ---- II. Konami 秘技 ---- */
  useEffect(() => {
    let index = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === KONAMI_SEQUENCE[index]) {
        index += 1;
        if (index === KONAMI_SEQUENCE.length) {
          index = 0;
          const root = document.documentElement;
          const turningOn = !root.classList.contains('eagle-mode');
          root.classList.toggle('eagle-mode', turningOn);
          ssSet(KEY_KONAMI, turningOn ? 'on' : 'off');

          if (turningOn) {
            if (ssGet('mg.easter.konami.achieved') === '1') {
              eggToast(
                '鹰眼模式已再次开启',
                '所有面板标题再次标记为"已阅 ★"。重复开启不增加成就，但会计入《重复操作登记表》，登记表不对外公开。'
              );
            } else {
              ssSet('mg.easter.konami.achieved', '1');
              eggToast(
                '成就解锁：鹰眼模式',
                '所有面板标题已标记为"已阅 ★"。本模式不改变任何内容的实际办理状态，也不加快任何办理进度。'
              );
            }
          } else {
            eggToast(
              '鹰眼模式已关闭',
              '标题已恢复为本来的标题。经核对，其中 1,147 个标题原本就叫作"已阅"。'
            );
          }
        }
      } else {
        index = k === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [eggToast]);

  /* ---- III. 控制台彩蛋 ---- */
  useEffect(() => {
    if (ssGet(KEY_CONSOLE) === '1') return;
    ssSet(KEY_CONSOLE, '1');

    // eslint-disable-next-line no-console
    console.log(
      `%c${EAGLE_ASCII}`,
      'color:#f5c542;font-family:monospace;font-size:11px;line-height:1.15;'
    );
    // eslint-disable-next-line no-console
    console.log(
      '%c【联邦表格之鹰 · 已就位】',
      'color:#bd0000;font-size:14px;font-weight:bold;'
    );
    for (const line of RECRUIT_TEXT) {
      // eslint-disable-next-line no-console
      console.log(`%c${line}`, 'color:#0d2a52;font-size:12px;');
    }
    // eslint-disable-next-line no-console
    console.log(`%c${CONSOLE_FOOT}`, 'color:#7a7a7a;font-size:11px;');
  }, []);

  /* ---- IV. 页脚标语连点 5 次 / 站标国徽连点 7 次 ---- */
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const now = Date.now();

      // (1) 页脚标语：3 秒内连点 5 次（同时支持坐标命中，兼容被覆盖的情形）
      const onSlogan =
        (target && typeof target.closest === 'function' && target.closest('.mg-footer__slogan') !== null) ||
        hitTestRect('.mg-footer__slogan', e.clientX, e.clientY);
      if (onSlogan) {
        footerClicks.current = [...footerClicks.current.filter((t) => now - t < 3000), now];
        if (footerClicks.current.length >= 5) {
          footerClicks.current = [];
          if (ssGet(KEY_FOOTER) !== '1') {
            ssSet(KEY_FOOTER, '1');
            setAnniversaryOpen(true);
          }
        }
      }

      // (2) 站标国徽：4 秒内连点 7 次
      const onSeal =
        (target && typeof target.closest === 'function' && target.closest('.mg-header__seal') !== null) ||
        hitTestRect('.mg-header__seal', e.clientX, e.clientY);
      if (onSeal) {
        sealClicks.current = [...sealClicks.current.filter((t) => now - t < 4000), now];
        if (sealClicks.current.length >= 7) {
          sealClicks.current = [];
          if (ssGet(KEY_SEAL) !== '1') {
            ssSet(KEY_SEAL, '1');
            setReportOpen(true);
            eggToast('您已发现隐藏页面', '内部通报已打开，请勿外传；确需外传的，请填写《外传审批表》。');
          }
        }
      }
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [eggToast]);

  /* ---- V. 连续停留 60 秒 ---- */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (ssGet(KEY_DWELL) === '1') return;
      ssSet(KEY_DWELL, '1');
      eggToast(
        '您已在本站停留 60 秒',
        '根据统计，这是本站用户平均停留时长的 12 倍。感谢您。本提示不消耗您的积分，您的积分为 0。'
      );
    }, 60000);
    return () => window.clearTimeout(timer);
  }, [eggToast]);

  /* ---- VI. 访问 5 个不同页面 ---- */
  useEffect(() => {
    let visited: string[] = [];
    try {
      const parsed: unknown = JSON.parse(ssGet(KEY_VISITED) ?? '[]');
      visited = Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      visited = [];
    }
    if (!visited.includes(path)) visited.push(path);
    ssSet(KEY_VISITED, JSON.stringify(visited));

    if (visited.length >= 5 && ssGet(KEY_EXPLORER) !== '1') {
      ssSet(KEY_EXPLORER, '1');
      eggToast('成就解锁', '办事达人——您已浏览 5 个栏目，仍需办理事项 1,019 项。');
    }
  }, [path, eggToast]);

  /* ---- 渲染 ---- */
  return (
    <>
      {toasts.map((t) => (
        <div className="mg-easter-toast" key={t.id} role="status" aria-live="polite">
          <div className="mg-easter-toast__title">{t.title}</div>
          <div>{t.text}</div>
        </div>
      ))}

      {/* 建国 250 周年纪念 */}
      <Modal
        open={anniversaryOpen}
        title="建国 250 周年纪念"
        width={640}
        onClose={() => setAnniversaryOpen(false)}
        footer={
          <div className="mg-easter__foot">
            <span className="mg-easter__foot-note">
              本彩蛋为虚构内容，不对应任何真实纪念活动，也不含任何政治含义。
            </span>
            <Button onClick={() => setAnniversaryOpen(false)}>关闭</Button>
          </div>
        }
      >
        <div className="mg-easter__anni">
          <div className="mg-easter__anni-num">250</div>
          <div className="mg-easter__anni-sub">建国 250 周年 · 纪念专栏</div>
          <p className="mg-easter__anni-text">
            值此建国 250 周年之际，本站特别推出纪念专栏，并新增纪念表格 250 种，以志纪念。
            纪念专栏入口位于首页第七屏以下，需滚动两次方可到达；纪念表格可在下载中心第 3 页下载，
            第 3 页同样位于第七屏以下。
          </p>
          <div className="mg-easter__rows">
            <div className="mg-easter__row">
              <span>纪念表格</span>
              <span>250 种</span>
            </div>
            <div className="mg-easter__row">
              <span>已填写</span>
              <span>0 种</span>
            </div>
            <div className="mg-easter__row">
              <span>填写率</span>
              <span>0%</span>
            </div>
            <div className="mg-easter__row">
              <span>纪念专栏访问量</span>
              <span>1 次（本次访问）</span>
            </div>
            <div className="mg-easter__row">
              <span>彩蛋触发方式</span>
              <span>在页脚标语上连续点击 5 次</span>
            </div>
          </div>
          <div className="mg-easter__anni-foot">
            感谢您发现本彩蛋。本次触发已记录，记录方式为不记录。
          </div>
        </div>
      </Modal>

      {/* 内部通报（隐藏页面） */}
      <Modal
        open={reportOpen}
        title="内部通报"
        width={780}
        onClose={() => setReportOpen(false)}
        footer={
          <div className="mg-easter__foot">
            <span className="mg-easter__foot-note">本通报共 1 页，第 2 页不存在。</span>
            <Button onClick={() => setReportOpen(false)}>阅知</Button>
            <Button variant="gold" onClick={() => { setReportOpen(false); navigate('/gov/policy'); }}>
              去政务公开栏目
            </Button>
          </div>
        }
      >
        <div className="mg-easter__report">
          <div className="mg-easter__report-head">美利坚合众国联邦便民服务管理局</div>
          <div className="mg-easter__report-title">内 部 通 报</div>
          <div className="mg-easter__report-docno">美内通〔2026〕250 号</div>
          <div className="mg-easter__report-body">
            <p>现将本站彩蛋工作情况通报如下：</p>
            <p>
              一、本通报属于隐藏内容，仅向在站标国徽上连续点击 7 次的用户公开。
              点击不足 7 次的用户，不视为已知悉本通报。
            </p>
            <p>
              二、本通报不属于政府信息公开范围。如申请公开，请填写《内部通报公开申请表》，
              该表第 3 页需另行索取；申请受理后 20 个工作日内答复，答复内容为"不予公开"。
            </p>
            <p>
              三、请勿外传。确需外传的，请填写《外传审批表》，审批时限 20 个工作日；
              审批期间按不宜外传处理，处理方式为不外传。
            </p>
            <p>
              四、本通报的阅读时长不计入您在站停留时长统计；您在站停留时长单独统计，
              统计口径为 60 秒一次，已在您触发本通报时提示。
            </p>
            <p>
              五、如您希望获得本站的正式文件，请通过依申请公开渠道提交申请。本站已公开信息 70 条，
              其中 69 条以"见附件"形式公开，附件另行发布。
            </p>
          </div>
          <div className="mg-easter__report-foot">
            联邦便民服务管理局办公室
            <br />
            2026 年 4 月 12 日
          </div>
        </div>
      </Modal>
    </>
  );
}
