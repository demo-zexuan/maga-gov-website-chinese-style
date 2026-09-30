/**
 * 站点外壳组件
 *
 * I. 组成
 *
 * 1. TopUtilityBar —— 顶部系统工具条
 * 2. SiteHeader     —— 红色渐变站标横幅
 * 3. MainNav        —— 藏青主导航
 * 4. SiteFooter     —— 页脚
 * 5. Shell          —— 上述四者的组合
 *
 * II. 还原要点
 *
 * 1. 工具条永远显示"今天"，日期与农历同步，永不更新年份（这是原站的真实行为）。
 * 2. 搜索框回车或点「搜索」都会跳转到 /search?q=xxx。
 * 3. 页脚必须有备案号、"政府网站标识码"与"让美国再次伟大"竖排标语。
 *
 * @module components/shell
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import React, { useState } from 'react';
import { Link, navigate, useIsActive, useRoute } from '@/router';
import { useApp } from '@/app-context';
import {
  FOOTER_LINKS,
  SITE,
  TOPBAR_LINKS,
  dcWeather,
  lunarCn,
  todayCn,
} from '@/data/site';
import { FlagScene, GreatSeal, IconHome, LibertyScene } from '@/components/art';
import { Button, Field, Modal } from '@/components/ui';

/* ================= 1. 顶部工具条 ================= */

/** 顶部系统工具条：日期 / 天气 / 语言 / 登录 / 搜索 / 热线 */
export function TopUtilityBar() {
  const { user, logout, elderMode, toggleElderMode, a11yMode, toggleA11y, setSearchKeyword, pushToast } =
    useApp();
  const [kw, setKw] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const doSearch = () => {
    const q = kw.trim();
    if (!q) {
      pushToast('搜索提示', '请输入关键字。本站支持模糊查询，但不保证查得到。');
      return;
    }
    setSearchKeyword(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="mg-topbar">
      <div className="mg-topbar__inner">
        <div className="mg-topbar__left">
          <span>{todayCn()}</span>
          <span className="mg-topbar__sep">|</span>
          <span>{lunarCn()}</span>
          <span className="mg-topbar__sep">|</span>
          <span className="mg-topbar__weather">
            华盛顿特区 <b>{dcWeather().icon} {dcWeather().text}</b> {dcWeather().low}°C ~{' '}
            {dcWeather().high}°C
          </span>
        </div>

        <div className="mg-topbar__right">
          {/*
            I. 只渲染 TOPBAR_LINKS 里"纯跳转"的项（目前是 English）。
            2. 登录 / 注册 / 长者模式 / 无障碍 都在下面单独渲染 —— 它们有副作用
               （弹窗、切换全局状态），不能走普通的 Link 分支，否则会重复出现两次。
          */}
          {TOPBAR_LINKS.filter(
            (l) => !['登录', '注册', '长者模式', '无障碍'].includes(l.label)
          ).map((l) => (
            <React.Fragment key={l.label}>
              <Link to={l.path} className="mg-topbar__link">
                {l.label}
              </Link>
              <span className="mg-topbar__sep">|</span>
            </React.Fragment>
          ))}

          {user ? (
            <>
              <a
                className="mg-topbar__link"
                href="#/user"
                onClick={(e) => {
                  e.preventDefault();
                  pushToast('个人中心', '该功能仍在建设中，预计 2027 年上线。');
                }}
              >
                {user.name}
              </a>
              <span className="mg-topbar__sep">|</span>
              <a
                className="mg-topbar__link"
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                退出
              </a>
            </>
          ) : (
            <>
              <a
                className="mg-topbar__link"
                href="#/login"
                onClick={(e) => {
                  e.preventDefault();
                  setShowLogin(true);
                }}
              >
                登录
              </a>
              <span className="mg-topbar__sep">|</span>
              <Link to="/register" className="mg-topbar__link">
                注册
              </Link>
            </>
          )}
          <span className="mg-topbar__sep">|</span>

          {/* 长者模式 / 无障碍：真实政务网站必备，这里做了但效果夸张 */}
          <a
            className={`mg-topbar__link${elderMode ? ' is-strong' : ''}`}
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              toggleElderMode();
              pushToast(
                elderMode ? '已退出长者模式' : '已进入长者模式',
                elderMode ? '字号恢复默认。' : '字号已放大 200%，祝您看得清楚。'
              );
            }}
          >
            长者模式
          </a>
          <span className="mg-topbar__sep">|</span>
          <a
            className={`mg-topbar__link${a11yMode ? ' is-strong' : ''}`}
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              toggleA11y();
            }}
          >
            无障碍
          </a>
          <span className="mg-topbar__sep">|</span>

          {/* 站内搜索 */}
          <span className="mg-topsearch">
            <input
              type="text"
              value={kw}
              placeholder="请输入关键字"
              aria-label="站内搜索"
              onChange={(e) => setKw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch();
              }}
            />
            <button type="button" onClick={doSearch}>
              搜索
            </button>
          </span>

          {/* 服务热线：古早网站的镇站之宝 */}
          <span className="mg-topbar__hotline">
            <span style={{ fontSize: 16 }}>☎</span>
            <span>
              服务热线：{SITE.hotline}
              <small>{SITE.hotlineNote}</small>
            </span>
          </span>
        </div>
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

/** 登录弹窗（就地实现，避免与 /login 页面重复） */
function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, pushToast } = useApp();
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setErr('请输入用户名');
      return;
    }
    if (pwd.length < 6) {
      setErr('密码长度不得少于 6 位');
      return;
    }
    setErr('');
    login(name.trim());
    onClose();
    pushToast('实名核验通过', '您的身份已与联邦数据库比对，相似度 0.03%。');
  };

  return (
    <Modal
      open={open}
      width={420}
      title="用户登录 — 统一身份认证平台"
      onClose={() => {
        setErr('');
        onClose();
      }}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit}>
            登录
          </Button>
        </>
      }
    >
      <Field label="用户名" required error={err}>
        <input
          className="mg-input"
          value={name}
          placeholder="请输入身份证号 / 护照号 / 社保号"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="密码" required hint="6-32 位，区分大小写，不建议使用 123456">
        <input
          className="mg-input"
          type="password"
          value={pwd}
          placeholder="请输入密码"
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
      </Field>
      <div className="mg-alert mg-alert--gray" style={{ marginTop: 8 }}>
        <span className="mg-alert__icon">i</span>
        <div>
          本站已接入联邦统一身份认证。登录即代表您同意我们收集、存储、分析、转售您的全部数据。
          不同意也可以，只是办不了事。
        </div>
      </div>
    </Modal>
  );
}

/* ================= 2. 站标横幅 ================= */

export function SiteHeader() {
  return (
    <div className="mg-header">
      <div className="mg-header__inner">
        <FlagScene className="mg-header__flag" />
        <GreatSeal className="mg-header__seal" />
        <LibertyScene className="mg-header__liberty" />

        <div className="mg-header__center">
          <h1 className="mg-header__title">{SITE.title}</h1>
          <div className="mg-header__subtitle">{SITE.titleEn}</div>
          <div className="mg-header__slogan">
            {SITE.slogan.map((s, i) => (
              <React.Fragment key={s}>
                <span>{s}</span>
                {i < SITE.slogan.length - 1 && <span>·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mg-header__claims">
          {SITE.claims.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= 3. 主导航 ================= */

export function MainNav() {
  const { pushToast } = useApp();
  return (
    <nav className="mg-nav">
      <div className="mg-nav__inner">
        {NAV_ITEMS_RUNTIME.map((item) => (
          <NavLinkItem key={item.path} item={item} onTip={pushToast} />
        ))}
      </div>
    </nav>
  );
}

/* 从 site.ts 引入后再包一层，保持单一真源 */
import { NAV_ITEMS } from '@/data/site';
const NAV_ITEMS_RUNTIME = NAV_ITEMS;

function NavLinkItem({
  item,
  onTip,
}: {
  item: (typeof NAV_ITEMS)[number];
  onTip: (title: string, text: string) => void;
}) {
  const active = useIsActive(item.path);
  const hasChildren = !!item.children && item.children.length > 0;

  // I. 结构说明
  //
  // 一级栏目与二级下拉必须是兄弟节点，不能把下拉嵌在 <a> 里面 ——
  // 那样会产生 <a> 套 <a> 的非法 HTML，浏览器会把嵌套的 <a> 拆开，
  // 导致下拉菜单在部分浏览器下无法点击。
  return (
    <div className={`mg-nav__cell${active ? ' is-active' : ''}`}>
      <Link to={item.path} className="mg-nav__item">
        {item.isHome && <IconHome />}
        {item.label}
      </Link>

      {hasChildren && (
        <span className="mg-nav__sub">
          {item.children!.map((c) => (
            <Link key={c.path + c.label} to={c.path}>
              {c.label}
            </Link>
          ))}
          {item.label === '互动交流' && (
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onTip('温馨提示', '该子栏目由实习生维护，更新频率视其心情而定。');
              }}
            >
              意见征集（暂停）
            </a>
          )}
        </span>
      )}
    </div>
  );
}

/* ================= 4. 页脚 ================= */

export function SiteFooter() {
  const { path } = useRoute();
  void path;
  return (
    <footer className="mg-footer">
      <div className="mg-footer__links">
        <div className="mg-footer__links-inner">
          {FOOTER_LINKS.map((group) => (
            <React.Fragment key={group.label}>
              <span className="mg-footer__label">{group.label}：</span>
              {group.items.map((it) => (
                <Link key={it.path} to={it.path}>
                  {it.label}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="mg-footer__main">
        <div className="mg-footer__brand">
          <div className="mg-footer__org">{SITE.organizer}</div>
          <div className="mg-footer__org-en">{SITE.titleEn}</div>
          <div className="mg-footer__meta">
            {SITE.copyright} &nbsp;|&nbsp; {SITE.icp} &nbsp;|&nbsp; {SITE.police}
            <br />
            政府网站标识码：{SITE.siteCode} &nbsp;|&nbsp; 承办：{SITE.operator} &nbsp;|&nbsp;
            违法和不良信息举报电话：{SITE.hotline}
            <br />
            <span style={{ color: '#6f88a8' }}>
              本站为纯娱乐讽刺作品，不含任何政治倾向，全部内容均为虚构。
            </span>
          </div>
        </div>

        <div className="mg-footer__badges">
          <div className="mg-footer__badge">
            <b>1776</b>
            建国年份
          </div>
          <div className="mg-footer__badge">
            <b>99.8%</b>
            群众满意度
          </div>
          <div className="mg-footer__badge">
            <b>0</b>
            未办结事项
          </div>
        </div>

        <div className="mg-footer__follow">
          <span>Follow Us：</span>
          <a href="#/" title="X" onClick={(e) => e.preventDefault()}>
            𝕏
          </a>
          <a href="#/" title="Facebook" onClick={(e) => e.preventDefault()}>
            f
          </a>
          <a href="#/" title="Instagram" onClick={(e) => e.preventDefault()}>
            ◎
          </a>
        </div>

        <div className="mg-footer__slogan">{SITE.footerSlogan}</div>
      </div>
    </footer>
  );
}

/* ================= 5. 组合外壳 ================= */

/** 页面外壳：所有内页都应包在 Shell 内 */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopUtilityBar />
      <SiteHeader />
      <MainNav />
      <div className="mg-container">{children}</div>
      <SiteFooter />
    </>
  );
}
