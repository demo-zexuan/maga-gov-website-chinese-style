/**
 * 政务服务 —— 办事指南（事项详情）
 *
 * I. 职责
 *
 * 1. 按 props.id 取事项，渲染办理流程步骤条、办理材料清单、办理信息表与注意事项。
 * 2. 提供「在线办理」假流程：身份核验 → 材料上传 → 提交，三步均有进度条，
 *    最后给出受理编号与「预计办结时间：请以实际为准」。
 * 3. 页面底部以小字展示该事项的 `quip`（数据真源里的吐槽位）。
 *
 * II. 假流程的设计意图
 *
 * 1. 每一步都"成功"，但每一步的成功都不产生任何法律效力 —— 这是全站的一贯基调。
 * 2. 第二步必然有一项材料上传失败并被"推荐跳过"，跳过又声明不影响办理结果。
 * 3. 第三步的进度条停在 99%，剩余 1% 由人工确认，而人工确认通道暂未开通，
 *    三秒后系统自行跳过该环节，属于正常情况。
 *
 * @module pages/service/ServiceDetailPage
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Crumbs, Field, Modal, Panel, Progress, StatRow } from '@/components/ui';
import { ServiceIcon } from '@/components/art';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';
import { SERVICES, findService } from '@/data/services';
import { OFFICES, WINDOWS } from '@/data/service-extra';

/* ---------------- 常量 ---------------- */

/** 假办理流程的三个环节 */
const FLOW_STEPS = ['身份核验', '材料上传', '提交申请'];

/** 材料表的「备注」轮换文案 */
const MATERIAL_REMARKS = [
  '原件当场核验后归还。归还需另行预约。',
  '复印件需为原件复印件。',
  '本材料自 2019 年起不再收取，但仍需提供。',
  '如无法提供，请提供无法提供的书面说明；该说明需由出具单位盖章。',
  '表格第 3 页需另行索取。',
  '照片需为近 6 个月内拍摄。拍摄时间以拍摄时间为准。',
];

/** 材料表的「形式要求」轮换文案 */
const MATERIAL_FORMS = ['当场核验后退还', '留存复印件', '核验原件、收复印件'];

/* ---------------- 页面 ---------------- */

export default function ServiceDetailPage({ id }: { id: string }) {
  const { pushToast, user } = useApp();
  const svc = useMemo(() => findService(id), [id]);

  /* ---------- 假流程状态 ---------- */
  // step: 0 身份核验 / 1 材料上传 / 2 提交申请 / 3 办理结果
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [receipt, setReceipt] = useState('');

  // 进度条推进：提交环节刻意停在 99%
  useEffect(() => {
    if (!open) return;
    setPercent(0);
    const target = step === 2 ? 99 : 100;
    const timer = window.setInterval(() => {
      setPercent((p) => (p >= target ? target : Math.min(target, p + (step === 1 ? 9 : 5))));
    }, 70);
    return () => window.clearInterval(timer);
  }, [open, step]);

  // 提交环节：99% 停留 1.8 秒，随后由系统"代为人工确认"
  useEffect(() => {
    if (!open || step !== 2 || percent < 99) return;
    const timer = window.setTimeout(() => setStep(3), 1800);
    return () => window.clearTimeout(timer);
  }, [open, step, percent]);

  // 生成受理编号
  useEffect(() => {
    if (step === 3 && !receipt) {
      setReceipt(`USPCS-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`);
    }
  }, [step, receipt]);

  if (!svc) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '政务服务', to: '/service' }, { label: '事项不存在' }]} />
        <Panel title="未找到该事项">
          <div className="mg-empty">
            <div className="mg-empty__icon">※</div>
            <div>未找到编号为 {id} 的服务事项。</div>
            <div className="mg-svc-note">
              该事项可能已更名、已合并，或尚未被发明。建议您返回办事大厅重新选择。
            </div>
            <div className="mg-svc-note">
              <Link to="/service">返回办事大厅 »</Link>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const related = SERVICES.filter((s) => s.scope === svc.scope && s.id !== svc.id).slice(0, 4);
  const serviceWindows = WINDOWS.filter((w) => w.serviceIds.includes(svc.id));
  const windows = serviceWindows.length > 0 ? serviceWindows.slice(0, 3) : [WINDOWS[0]];

  /** 打开假办理流程 */
  const openFlow = () => {
    setStep(0);
    setPercent(0);
    setReceipt('');
    setOpen(true);
  };

  /** 关闭并复位 */
  const closeFlow = () => {
    setOpen(false);
    setStep(0);
    setPercent(0);
  };

  /** 完成办理：给出反馈并复位 */
  const finishFlow = () => {
    const no = receipt || `USPCS-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    pushToast('办理结果', `受理编号 ${no}。预计办结时间请以实际为准，本提示不构成任何承诺。`);
    closeFlow();
  };

  /* ---------- 弹窗底部按钮 ---------- */
  const foot = (
    <div className="mg-svc-flow__foot">
      <span className="mg-svc-note">
        {step < 3 ? `第 ${step + 1} 步 / 共 ${FLOW_STEPS.length} 步` : '办理结果已生成'}
      </span>
      <span className="mg-svc-flow__foot-btns">
        {step > 0 && step < 3 && (
          <Button size="sm" onClick={() => setStep(step - 1)}>
            上一步
          </Button>
        )}
        {step < 2 && (
          <Button
            size="sm"
            variant="primary"
            disabled={percent < 100}
            onClick={() => setStep(step + 1)}
          >
            {percent < 100 ? '处理中…' : '下一步'}
          </Button>
        )}
        {step === 2 && (
          <Button size="sm" disabled>
            人工确认（暂未开通）
          </Button>
        )}
        {step === 3 && (
          <>
            <Button
              size="sm"
              onClick={() => {
                closeFlow();
                navigate('/service/track');
              }}
            >
              查询进度
            </Button>
            <Button size="sm" variant="primary" onClick={finishFlow}>
              完成
            </Button>
          </>
        )}
      </span>
    </div>
  );

  return (
    <div className="mg-page">
      <Crumbs
        items={[
          { label: '政务服务', to: '/service' },
          { label: svc.scope === 'personal' ? '个人办事' : '企业办事', to: `/service/${svc.scope}` },
          { label: svc.name },
        ]}
      />

      {/* ---------------- 事项头部 ---------------- */}
      <div className="mg-svc-detail__head">
        <ServiceIcon name={svc.icon} width={44} height={44} />
        <div className="mg-svc-detail__titlebox">
          <div className="mg-svc-detail__title">
            {svc.name}
            {svc.hot && <Badge tone="gold">热门</Badge>}
            <Badge tone={svc.online ? 'green' : 'outline'}>
              {svc.online ? '支持在线申请' : '需到现场办理'}
            </Badge>
          </div>
          <div className="mg-svc-detail__meta">
            <span>主管部门：{svc.department}</span>
            <span>承诺时限：{svc.duration}</span>
            <span>法定期限：{svc.legalDuration}</span>
            <span>收费标准：{svc.fee}</span>
            <span>事项编号：{svc.id}</span>
          </div>
        </div>
        <div className="mg-svc-detail__cta">
          <Button variant="primary" size="lg" onClick={openFlow}>
            在线办理
          </Button>
          {!svc.online && (
            <span className="mg-svc-note">
              本事项暂不支持在线办理，该按钮用于预约登记。
            </span>
          )}
          <Button
            size="sm"
            onClick={() =>
              pushToast(
                '预约结果',
                '现场预约号源已发放完毕。下一批号源发放时间为下一批号源发放之时。'
              )
            }
          >
            现场预约
          </Button>
          <Button
            size="sm"
            onClick={() =>
              pushToast('下载提示', '申请表下载链接正在维护中，请到窗口现场领取纸质表格。')
            }
          >
            下载申请表
          </Button>
        </div>
      </div>

      <div className="mg-layout-3col">
        {/* ---------------- 中栏：流程 / 材料 / 信息 ---------------- */}
        <div className="mg-layout__main">
          <Panel title="办理流程">
            <div className="mg-steps">
              {svc.steps.map((t, i) => (
                <div className="mg-steps__item" key={t}>
                  <div className="mg-steps__num">{i + 1}</div>
                  <div className="mg-steps__text">{t}</div>
                </div>
              ))}
            </div>
            <div className="mg-svc-note">
              共 {svc.steps.length} 个环节。其中「{svc.steps[Math.min(2, svc.steps.length - 1)]}」
              环节需另行预约，预约号源每日 00:00 发放。
            </div>
          </Panel>

          <Panel title={`办理材料（共 ${svc.materials.length} 项）`} flush>
            {svc.materials.length === 0 ? (
              <div className="mg-empty">
                <div className="mg-empty__icon">※</div>
                <div>本事项无需提交材料。如系统提示缺少材料，请以系统提示为准。</div>
              </div>
            ) : (
              <table className="mg-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>序号</th>
                    <th>材料名称</th>
                    <th style={{ width: 130 }}>份数</th>
                    <th style={{ width: 140 }}>形式要求</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {svc.materials.map((m, i) => (
                    <tr key={m}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td>{m}</td>
                      <td>{i === 0 ? '原件 1 份' : i % 3 === 0 ? '原件 1 份、复印件 2 份' : '复印件 2 份'}</td>
                      <td>{MATERIAL_FORMS[i % MATERIAL_FORMS.length]}</td>
                      <td>{MATERIAL_REMARKS[i % MATERIAL_REMARKS.length]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="办理信息" flush>
            <table className="mg-table">
              <tbody>
                <tr>
                  <th style={{ width: 140 }}>主管部门</th>
                  <td>{svc.department}</td>
                  <th style={{ width: 140 }}>是否面签</th>
                  <td>{svc.faceToFace ? '需要本人到场' : '无需本人到场（结果仍可能要求到场领取）'}</td>
                </tr>
                <tr>
                  <th>承诺办结时限</th>
                  <td>
                    {svc.duration}
                    <div className="mg-svc-note">承诺时限自材料齐全之日起计算。材料是否齐全由受理窗口认定。</div>
                  </td>
                  <th>法定办结时限</th>
                  <td>
                    {svc.legalDuration}
                    <div className="mg-svc-note">自受理之日起计算；受理之日的认定另见《受理之日认定办法》。</div>
                  </td>
                </tr>
                <tr>
                  <th>收费标准</th>
                  <td>
                    {svc.fee}
                    <div className="mg-svc-note">费用不含复印件费用、照片费用与前往网点的交通费用。</div>
                  </td>
                  <th>在线办理</th>
                  <td>
                    {svc.online ? '支持在线申请，仍需现场核验一次' : '不支持在线办理，本页按钮仅用于预约登记'}
                  </td>
                </tr>
                <tr>
                  <th>办理地点</th>
                  <td>{OFFICES[0].address}</td>
                  <th>咨询电话</th>
                  <td>
                    (202) 555-0147
                    <div className="mg-svc-note">接听时间：工作日上午 09:00-09:15。占线请挂机重拨，不提供回拨。</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Panel>

          <Panel title="受理条件与注意事项">
            <ol className="mg-svc-cond">
              <li>申请材料齐全、符合法定形式。材料是否齐全由受理窗口当场认定，认定结果不出具书面说明。</li>
              <li>申请人对所提交材料的真实性负责。窗口工作人员不对材料真实性进行核对。</li>
              <li>本事项承诺「一次办结」。需要补正材料的，补正次数不计入「一次」。</li>
              <li>
                办结结果可现场领取或邮寄送达。邮寄费用由申请人承担，邮费标准另行公布；公布前按现场标准执行。
              </li>
              <li>法定节假日不受理。法定节假日的调休安排以调休安排为准。</li>
            </ol>
          </Panel>

          <div className="mg-svc-quip">
            <b>本事项办理提示：</b>
            {svc.quip}
          </div>
        </div>

        {/* ---------------- 右栏：窗口 / 相关事项 / 提示 ---------------- */}
        <div className="mg-layout__right">
          <Panel title="承办窗口">
            <ul className="mg-svc-offices">
              {windows.map((w) => (
                <li className="mg-svc-office" key={w.id}>
                  <div className="mg-svc-office__head">
                    <span className="mg-svc-office__name">
                      {w.code} {w.name}
                    </span>
                    <span className="mg-svc-office__queue" data-status={w.status}>
                      {w.status === '暂停服务' ? '暂停' : w.status === '已满号' ? '已满号' : `排队 ${w.queue} 人`}
                    </span>
                  </div>
                  <div className="mg-svc-office__meta">
                    {w.staff} · 开放时间：{w.openHours}
                  </div>
                  {w.remark && <div className="mg-svc-office__remark">{w.remark}</div>}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="相关事项">
            <ul className="mg-list mg-svc-links">
              {related.map((s) => (
                <li className="mg-list__item" key={s.id}>
                  <span className="mg-list__bullet">•</span>
                  <Link to={`/service/detail/${s.id}`} className="mg-list__text">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="办件量">
            <StatRow label="本月受理" value="1,204" unit="件" />
            <StatRow label="本月办结" value="1,204" unit="件" />
            <StatRow label="一次办结率" value="99.1" unit="%" />
            <div className="mg-svc-note">
              未一次办结的 0.9% 为需要补正材料的办件。补正不属于二次办理，因此本指标始终为 99.1%。
            </div>
          </Panel>
        </div>
      </div>

      {/* ---------------- 假办理流程弹窗 ---------------- */}
      <Modal
        open={open}
        title={`在线办理 —— ${svc.name}`}
        onClose={closeFlow}
        width={620}
        footer={foot}
        maskClosable={false}
      >
        <div className="mg-svc-flow__steps">
          {FLOW_STEPS.map((t, i) => (
            <div
              key={t}
              className={`mg-svc-flow__step${i === step ? ' is-active' : ''}${
                i < step ? ' is-done' : ''
              }`}
            >
              <span className="mg-svc-flow__step-num">{i + 1}</span>
              <span className="mg-svc-flow__step-text">{t}</span>
            </div>
          ))}
        </div>

        {step < 3 && (
          <Alert tone="gray">
            本流程共 {FLOW_STEPS.length} 步，预计用时 2 分钟。实际用时以实际用时为准。
          </Alert>
        )}

        {/* ---------- 第 1 步：身份核验 ---------- */}
        {step === 0 && (
          <div className="mg-svc-flow__body">
            <Field label="申请人">
              <input className="mg-input" value={user ? user.name : '本站访客（未登录）'} readOnly />
            </Field>
            <Field label="证件类型" hint="系统已自动选择您上次使用的证件类型。如与本次不符，请到窗口更正。">
              <select className="mg-select" defaultValue="ssn">
                <option value="ssn">社会保障号（SSN）</option>
                <option value="passport">护照</option>
                <option value="license">驾照</option>
                <option value="other">其他（需到窗口确认）</option>
              </select>
            </Field>
            <Field label="证件号码">
              <input className="mg-input" value="••••••••••4821" readOnly />
            </Field>
            <Field label="联系手机" hint="用于接收办理结果通知。短信功能维护中，通知将以短信形式发送。">
              <input className="mg-input" value="(202) 555-0•••" readOnly />
            </Field>
            <div className="mg-svc-flow__progress">
              <Progress percent={percent} />
              <div className="mg-svc-flow__caption">
                {percent < 100
                  ? '正在进行身份核验…'
                  : '核验通过。本次核验不与任何数据库比对，核验结果仅供参考。'}
              </div>
            </div>
          </div>
        )}

        {/* ---------- 第 2 步：材料上传 ---------- */}
        {step === 1 && (
          <div className="mg-svc-flow__body">
            <div className="mg-svc-flow__progress">
              <Progress percent={percent} />
              <div className="mg-svc-flow__caption">正在上传材料…完整度 {percent}%</div>
            </div>
            <table className="mg-table mg-table--compact">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>序号</th>
                  <th>材料名称</th>
                  <th style={{ width: 150 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {(svc.materials.length > 0
                  ? svc.materials
                  : ['无需提交材料（系统仍要求上传 1 项）']
                ).map((m, i) => {
                  const per = 100 / Math.max(1, svc.materials.length);
                  const own = Math.max(0, Math.min(100, Math.round(((percent - i * per) / per) * 100)));
                  const skipped = i === 2 && svc.materials.length > 2;
                  return (
                    <tr key={`${m}-${i}`}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td>{m}</td>
                      <td style={{ textAlign: 'center' }}>
                        {skipped ? (
                          <span className="mg-svc-flow__skip">已跳过（推荐）</span>
                        ) : own >= 100 ? (
                          '已完成'
                        ) : own > 0 ? (
                          `上传中 ${own}%`
                        ) : (
                          '等待上传'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mg-svc-note">
              第 3 项材料上传失败（该文件格式不受支持：PDF）。系统已自动跳过。跳过不影响本次办理结果。
            </div>
            <div className="mg-svc-note">材料完整度 100%（不含已跳过的第 3 项）。</div>
          </div>
        )}

        {/* ---------- 第 3 步：提交 ---------- */}
        {step === 2 && (
          <div className="mg-svc-flow__body">
            <div className="mg-svc-flow__progress">
              <Progress percent={percent} red={percent >= 99} />
              <div className="mg-svc-flow__caption">
                {percent < 99
                  ? '正在提交申请…'
                  : '已提交 99%。剩余 1% 由人工确认，正在接通人工确认通道…'}
              </div>
            </div>
            {percent >= 99 && (
              <Alert tone="red">
                提交进度已保持 99%。请勿关闭本窗口；关闭后需重新提交，重新提交后受理编号将变更。
                人工确认通道暂未开通，系统将在稍后自动跳过该环节。
              </Alert>
            )}
            <div className="mg-result">
              <div className="mg-result__row">
                <span className="mg-result__label">受理事项</span>
                <span className="mg-result__value">{svc.name}</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">承办窗口</span>
                <span className="mg-result__value">{windows[0].code} {windows[0].name}</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">承诺办结时限</span>
                <span className="mg-result__value">{svc.duration}</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">提交进度</span>
                <span className="mg-result__value">{percent}%（系统保留 1%，用于显示进度条）</span>
              </div>
            </div>
          </div>
        )}

        {/* ---------- 结果 ---------- */}
        {step === 3 && (
          <div className="mg-svc-flow__body">
            <Alert tone="gray">您的申请已提交。请记录以下受理编号，该编号是查询进度的唯一凭证。</Alert>
            <div className="mg-svc-flow__receipt">{receipt}</div>
            <div className="mg-result">
              <div className="mg-result__row">
                <span className="mg-result__label">受理编号</span>
                <span className="mg-result__value">{receipt}</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">办理事项</span>
                <span className="mg-result__value">{svc.name}</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">预计办结时间</span>
                <span className="mg-result__value">请以实际为准</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">当前进度</span>
                <span className="mg-result__value">99%（查询时将重新从 0% 计算）</span>
              </div>
              <div className="mg-result__row">
                <span className="mg-result__label">短信通知</span>
                <span className="mg-result__value">已发送（短信功能维护中，暂未发出）</span>
              </div>
            </div>
            <div className="mg-svc-note">
              {svc.online
                ? '本事项支持在线申请。受理结果仍需现场核验一次，核验时间将另行通知。'
                : '本事项不支持在线办理，本次提交已按预约登记处理，该受理编号仅用于本次预约查询。'}
            </div>
            <div className="mg-svc-note">
              受理编号已同步至您的个人中心。个人中心入口位于页脚，页脚可点击。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
