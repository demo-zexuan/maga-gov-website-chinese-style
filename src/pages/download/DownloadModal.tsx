/**
 * 下载进度弹窗
 *
 * I. 行为设计（本模块的招牌交互）
 *
 * 1. 进度从 0 开始爬升，到达 99% 后停住不再前进；剩余 1% 由人工核验完成
 * 2. 提示文案每 2.6 秒轮换一条，在四条文案之间循环
 * 3. 不设超时：超过 30 秒后追加一条说明，下载继续进行，也不提供重试
 * 4. 「取消下载」与关闭窗口同义：关闭后回执「取消成功，本次下载已取消。该文件的下载次数已计入。」
 *
 * II. 设计说明
 *
 * 下载次数在弹窗打开时即已计入，因此取消不能撤回次数——回执里必须把这件事说清楚，
 * 这是本模块最重要的一句文案，措辞不得弱化。
 *
 * @module pages/download/DownloadModal
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Modal, Progress } from '@/components/ui';
import type { DownloadItem } from '@/data/types';
import { formatNumber } from '@/data/stats';

/** 进度文案：循环切换 */
const PROGRESS_MESSAGES = [
  '正在校验文件完整性…',
  '正在排队，您前面还有 1 位用户…',
  '正在建立安全连接…',
  '即将完成…',
];

/** 进度上限：永远不达到 100% */
const PERCENT_CAP = 99;

/** 超过该秒数后追加超时说明，但下载不中断 */
const TIMEOUT_HINT_SECONDS = 30;

export interface DownloadModalProps {
  /** 当前下载条目 */
  item: DownloadItem;
  /** 取消下载（父级负责回执与关闭） */
  onCancel: (item: DownloadItem, seconds: number) => void;
}

export default function DownloadModal({ item, onCancel }: DownloadModalProps) {
  const [percent, setPercent] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [waitNotice, setWaitNotice] = useState<string | null>(null);

  // I. 进度爬升：越接近 99% 越慢，到达 99% 后完全停住
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPercent((p) => {
        if (p >= PERCENT_CAP) return PERCENT_CAP;
        if (p < 60) return Math.min(PERCENT_CAP, p + 2 + Math.floor(Math.random() * 4));
        if (p < 90) return Math.min(PERCENT_CAP, p + 1 + Math.floor(Math.random() * 2));
        return Math.min(PERCENT_CAP, p + 1);
      });
      // 已传输量增长到 2 MB 后不再增长，与 1.2 GB 的文件大小形成稳定对照
      setTransferred((t) => Math.min(2048, t + Math.round(Math.random() * 42)));
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  // II. 文案轮换
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  // III. 计时
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /** 取消下载：秒数一并回传给父级，用于回执中说明已用时 */
  const cancel = () => onCancel(item, seconds);

  return (
    <Modal
      open
      title={`正在下载：${item.name}`}
      width={560}
      maskClosable={false}
      onClose={cancel}
      footer={
        <>
          <Button
            variant="primary"
            onClick={() =>
              setWaitNotice(
                '等待意愿已记录。等待意愿不影响下载进度，也不加快排队顺序，记录不可撤回。'
              )
            }
          >
            继续等待
          </Button>
          <Button onClick={cancel}>取消下载</Button>
        </>
      }
    >
      <div className="mg-dl-modal__file">
        <span className="mg-dl-row__format" data-fmt={item.format}>
          {item.format}
        </span>
        <span className="mg-dl-modal__file-name">{item.name}</span>
      </div>

      <div className="mg-dl-modal__row">
        <span>表格编号</span>
        <b>{item.formNo}</b>
      </div>
      <div className="mg-dl-modal__row">
        <span>文件大小</span>
        <b>{item.size}</b>
      </div>
      <div className="mg-dl-modal__row">
        <span>已传输</span>
        <b>
          {transferred} KB / {item.size}
        </b>
      </div>
      <div className="mg-dl-modal__row">
        <span>当前位置</span>
        <b>{percent >= PERCENT_CAP ? '剩余 1%' : '传输中'}</b>
      </div>

      <div className="mg-dl-modal__progress">
        <Progress percent={percent} red={percent >= PERCENT_CAP} />
        <div className="mg-dl-modal__progress-meta">
          <span className="mg-dl-modal__message">{PROGRESS_MESSAGES[messageIndex]}</span>
          <span className="mg-dl-modal__percent">{percent}%</span>
        </div>
      </div>

      <div className="mg-dl-modal__meta">
        已用时 {seconds} 秒，当前速度 {percent >= PERCENT_CAP ? 0 : 8 + (percent % 7)} KB/s。
        本下载不设超时限制，速度显示为 0 KB/s 时下载仍在进行。
      </div>

      <div className="mg-dl-modal__meta">
        进度达到 {PERCENT_CAP}% 后，剩余 1% 由人工核验完成。核验进度不显示，核验人员不对外提供联系方式。
      </div>

      {seconds >= TIMEOUT_HINT_SECONDS && (
        <Alert tone="yellow">
          已超过 {TIMEOUT_HINT_SECONDS} 秒。系统将继续尝试，不作提示也不重试。如不再等待，请取消下载；
          取消后重新下载将重新计入下载次数。
        </Alert>
      )}

      {waitNotice && <Alert tone="gray">{waitNotice}</Alert>}
    </Modal>
  );
}
