/**
 * 查询工具页面外壳
 *
 * I. 结构
 *
 * 1. 面包屑：首页 › 便民查询 › 当前事项
 * 2. 左栏：查询事项导航（6 项，当前项高亮）+ 办理方式说明
 * 3. 中栏：当前事项的表单与结果（由各工具传入）
 * 4. 右栏：本事项办理信息 + 查询须知 + 服务热线 + 各工具自定义内容
 *
 * II. 说明
 *
 * 5 个查询工具共用本外壳，保证栏目观感一致；差异部分只体现在中栏内容与
 * 右栏的裸 aside 插槽上。
 *
 * @module pages/query/ToolShell
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import type { ReactNode } from 'react';
import { Crumbs, Panel } from '@/components/ui';
import { Link } from '@/router';
import { SITE } from '@/data/site';
import { QUERY_NOTICES, QUERY_TOOLS, findQueryTool } from '@/data/query-data';
import type { QueryToolKey } from '@/data/query-data';

export interface ToolShellProps {
  /** 当前事项 key */
  tool: QueryToolKey;
  /** 中栏面板标题 */
  title: string;
  /** 标题下方的说明段（可选） */
  lead?: ReactNode;
  /** 中栏内容 */
  children: ReactNode;
  /** 右栏附加面板（可选） */
  aside?: ReactNode;
}

export default function ToolShell({ tool, title, lead, children, aside }: ToolShellProps) {
  const current = findQueryTool(tool);

  return (
    <div className="mg-page">
      <Crumbs
        items={[{ label: '便民查询', to: '/query' }, { label: current?.name ?? '查询事项' }]}
      />

      <div className="mg-layout-3col">
        {/* ---------- 左栏 ---------- */}
        <div className="mg-layout__left">
          <div className="mg-sidenav">
            <div className="mg-sidenav__head">查询事项</div>
            {QUERY_TOOLS.map((t) => (
              <Link
                key={t.key}
                to={`/query/${t.key}`}
                className={`mg-sidenav__item${t.key === tool ? ' is-active' : ''}`}
              >
                {t.name}
              </Link>
            ))}
          </div>

          <Panel title="办理方式">
            <div className="mg-q-note">
              <p>线上查询为自助服务，无需预约。</p>
              <p>如需人工协助，请到现场取号。现场号源以现场放号为准，放号数量以叫号数量为准。</p>
            </div>
          </Panel>
        </div>

        {/* ---------- 中栏 ---------- */}
        <div className="mg-layout__main">
          <Panel
            title={title}
            extra={
              <Link to="/query" className="mg-more">
                返回查询总入口
              </Link>
            }
          >
            {lead && <div className="mg-q-lead">{lead}</div>}
            {children}
          </Panel>
        </div>

        {/* ---------- 右栏 ---------- */}
        <div className="mg-layout__right">
          <Panel title="本事项办理信息">
            <div className="mg-q-facts">
              <div className="mg-q-facts__row">
                <span>主管部门</span>
                <b>{current?.department ?? '未明确'}</b>
              </div>
              <div className="mg-q-facts__row">
                <span>承诺时限</span>
                <b>{current?.duration ?? '未明确'}</b>
              </div>
              <div className="mg-q-facts__row">
                <span>法定时限</span>
                <b>{current?.legalDuration ?? '未明确'}</b>
              </div>
              <div className="mg-q-facts__row">
                <span>收费标准</span>
                <b>免费</b>
              </div>
            </div>
            <div className="mg-q-quip">{current?.quip}</div>
          </Panel>

          <Panel title="查询须知">
            <ol className="mg-q-ol">
              {QUERY_NOTICES.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="服务热线">
            <div className="mg-q-hotline">{SITE.hotline}</div>
            <div className="mg-q-hotline__note">
              服务时间：周一至周五 09:00-17:00；其余时间自动转接至语音提示。
            </div>
            <div className="mg-q-hotline__note">占线时请挂机重拨，本热线不提供回拨服务。</div>
          </Panel>

          {aside}
        </div>
      </div>
    </div>
  );
}
