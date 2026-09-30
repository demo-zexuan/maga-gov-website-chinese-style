/**
 * 友情链接中转页
 *
 * I. 页面逻辑
 *
 * 1. 依据路由参数 id 查出目标站点名称，提示"您即将离开本站"
 * 2. 5 秒倒计时（进度条同步推进），倒计时结束后提示目标站点无法访问
 * 3. 提供"返回本站"与"重新倒计时"两个出口，中转页本身永不真正跳转
 *
 * II. 说明
 *
 * 本站所有友情链接均为虚构演示入口，中转页不会发起任何真实跳转请求，
 * 页面中展示的域名仅作为文字说明。
 *
 * @module pages/link/LinkPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Crumbs, Panel, Progress } from '@/components/ui';
import { Link, navigate } from '@/router';

/* ================= 常量 ================= */

/** 倒计时总秒数 */
const COUNTDOWN_SECONDS = 5;

/** 友情链接目标（与页脚 FOOTER_LINKS 的 /link/:id 一一对应） */
const LINK_TARGETS: Record<string, { name: string; domain: string; note: string }> = {
  whitehouse: {
    name: '白宫官网',
    domain: 'www.whitehouse.gov（仅作文字说明，本站不发起跳转）',
    note: '该站点首页同样设有大量栏目，其中与我们业务相关的内容位于第 7 屏以下。',
  },
  loc: {
    name: '国会图书馆',
    domain: 'www.loc.gov（仅作文字说明，本站不发起跳转）',
    note: '该站点藏有本站全部历史表格的纸质版本，查阅需办理读者证，办理周期 20 个工作日。',
  },
  irs: {
    name: '国内税务局',
    domain: 'www.irs.gov（仅作文字说明，本站不发起跳转）',
    note: '该站点的表格数量为 1,147 种，与本站表格数量一致，属历史巧合。',
  },
  ssa: {
    name: '社会保障署',
    domain: 'www.ssa.gov（仅作文字说明，本站不发起跳转）',
    note: '该站点可查询缴费月份，系统显示的月份数可能大于您的实际年龄。',
  },
  usps: {
    name: '联邦邮政',
    domain: 'www.usps.com（仅作文字说明，本站不发起跳转）',
    note: '本站所有办理结果均通过该渠道邮寄，邮寄费用由申请人承担。',
  },
  voa: {
    name: '美国之音',
    domain: 'www.voanews.com（仅作文字说明，本站不发起跳转）',
    note: '该站点以多种语言播报，本站的办事进度不属于其播报范围。',
  },
};

/* ================= 页面 ================= */

export interface LinkPageProps {
  /** 友情链接标识，例如 whitehouse */
  id?: string;
  /** 路由 query 透传（本页暂未使用） */
  [key: string]: unknown;
}

export default function LinkPage({ id }: LinkPageProps) {
  const key = typeof id === 'string' ? id.trim() : '';
  const target = LINK_TARGETS[key];
  const name = target ? target.name : '未登记的友情链接';

  const [left, setLeft] = useState(COUNTDOWN_SECONDS);
  const [failed, setFailed] = useState(false);

  // 倒计时：每秒递减，减到 0 时切换为"无法访问"
  useEffect(() => {
    setLeft(COUNTDOWN_SECONDS);
    setFailed(false);
  }, [key]);

  useEffect(() => {
    if (failed) return;
    if (left <= 0) {
      setFailed(true);
      return;
    }
    const timer = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left, failed]);

  const retry = () => {
    setLeft(COUNTDOWN_SECONDS);
    setFailed(false);
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '友情链接' }, { label: name }]} />

      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__main">
          <Panel title="友情链接中转" variant="red">
            {!failed ? (
              <div className="mg-linkpage__pending">
                <div className="mg-linkpage__lead">
                  您即将离开本站，前往 <b>{name}</b>。
                </div>
                <div className="mg-linkpage__count">
                  <span className="mg-linkpage__count-num">{left}</span>
                  <span className="mg-linkpage__count-unit">秒后自动跳转</span>
                </div>
                <Progress percent={((COUNTDOWN_SECONDS - left) / COUNTDOWN_SECONDS) * 100} red />
                <div className="mg-linkpage__hint">
                  跳转过程中请勿关闭页面。关闭页面不影响跳转结果，跳转结果由目标站点决定。
                </div>
              </div>
            ) : (
              <div className="mg-linkpage__failed">
                <div className="mg-linkpage__failed-title">目标站点暂时无法访问，请稍后再试。</div>
                <Alert tone="red">
                  经检测，目标站点（{name}）当前无法访问。可能原因：目标站点正在进行例行维护、
                  本站未开通对外跳转权限、或该链接自 2019 年起已停止维护。
                </Alert>
                <div className="mg-linkpage__failed-note">
                  本次跳转已计入对外链接访问统计。统计显示，本站对外链接累计跳转成功 0 次，
                  累计尝试跳转 1,204 次，成功率 0%，长期保持稳定。
                </div>
                <div className="mg-static__actions">
                  <Button variant="primary" onClick={() => navigate('/')}>
                    返回本站
                  </Button>
                  <Button onClick={retry}>重新倒计时</Button>
                  <Button variant="gold" onClick={() => navigate('/contact')}>
                    反馈链接失效
                  </Button>
                </div>
              </div>
            )}

            <div className="mg-linkpage__info">
              <div className="mg-static__rows">
                <div className="mg-static__row">
                  <span className="mg-static__row-label">目标名称</span>
                  <span className="mg-static__row-value">{name}</span>
                </div>
                <div className="mg-static__row">
                  <span className="mg-static__row-label">目标地址</span>
                  <span className="mg-static__row-value">
                    {target ? target.domain : '未登记（该链接已于 2019 年停止维护，链接本身仍在）'}
                  </span>
                </div>
                <div className="mg-static__row">
                  <span className="mg-static__row-label">跳转方式</span>
                  <span className="mg-static__row-value">倒计时自动跳转；倒计时结束前可手动返回</span>
                </div>
                <div className="mg-static__row">
                  <span className="mg-static__row-label">责任说明</span>
                  <span className="mg-static__row-value">
                    目标站点的内容由目标站点负责；本站不对其内容、可用性与表格数量负责
                  </span>
                </div>
              </div>
              <div className="mg-static__note">{target ? target.note : '如需访问该站点，请另行确认其现行地址。'}</div>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__side">
          <Panel title="其他友情链接" variant="navy">
            <ul className="mg-linkpage__list">
              {Object.entries(LINK_TARGETS).map(([k, v]) => (
                <li key={k} className={k === key ? 'is-active' : ''}>
                  <Link to={`/link/${k}`}>{v.name}</Link>
                </li>
              ))}
            </ul>
            <div className="mg-static__note">
              共登记友情链接 6 家，其中可正常访问 0 家。新增友链需提交《友情链接申请》，
              并附目标站点首页截图一张（分辨率不低于 300dpi，文件不超过 200KB）。
            </div>
          </Panel>

          <Panel title="离开本站提示">
            <div className="mg-static__side-list">
              <div>· 离开本站后，您的访问数据不再由本站记录。</div>
              <div>· 本站不对外跳转的行为承担任何责任。</div>
              <div>· 如遇目标站点要求填写表格，请优先确认是否需要第 3 页。</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
