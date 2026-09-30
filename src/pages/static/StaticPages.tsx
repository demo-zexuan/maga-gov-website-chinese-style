/**
 * 静态页集合
 *
 * I. 页面清单
 *
 * 1. AboutPage         —— 关于我们（含强制免责声明与"网站建设的五个坚持"）
 * 2. SitemapPage       —— 网站地图（由 NAV_ITEMS 生成的栏目树 + 全部页面链接）
 * 3. PrivacyPage       —— 隐私政策（第一条至第八条）
 * 4. TermsPage         —— 使用条款（第一条至第八条）
 * 5. ContactPage       —— 联系我们（地址、电话、邮箱、办公时间与咨询提交）
 * 6. AccessibilityPage —— 无障碍声明（含真实的字号调节器与长者模式开关）
 * 7. EnglishPage       —— 英文版简介（保留机翻质感，含 parody 声明）
 * 8. LoginPage         —— 用户登录
 * 9. RegisterPage      —— 用户注册（24 项字段，其中必填 24 项）
 * 10. NotFoundPage     —— 404
 *
 * II. 说明
 *
 * 1. 全部页面均无 props，由 App.tsx 直接具名导入，签名不可变更。
 * 2. 页面内容为虚构讽刺创作，不含任何政治倾向；所有"荒谬"均隐藏在流程与数字细节中。
 * 3. 本文件不引入任何新增依赖，表单提交使用本地状态模拟。
 *
 * @module pages/static/StaticPages
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState, type ReactNode } from 'react';
import { Alert, Button, Crumbs, Field, Panel, Progress } from '@/components/ui';
import { Link, navigate } from '@/router';
import { useApp } from '@/app-context';
import { DISCLAIMER, FOOTER_LINKS, NAV_ITEMS, SITE, TOPBAR_LINKS } from '@/data/site';

/* ================= 通用小组件 ================= */

/** 信息行组（关于我们 / 联系我们共用） */
function InfoRows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <div className="mg-static__rows">
      {rows.map((r) => (
        <div className="mg-static__row" key={r.label}>
          <span className="mg-static__row-label">{r.label}</span>
          <span className="mg-static__row-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 条款组（隐私政策 / 使用条款 / 无障碍声明共用） */
function Clauses({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="mg-static__clauses">
      {items.map((c) => (
        <div className="mg-static__clause" key={c.title}>
          <div className="mg-static__clause-title">{c.title}</div>
          <p className="mg-static__clause-body">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ================= 1. 关于我们 ================= */

/** 网站建设的五个坚持 —— 写成正经表述，荒谬藏在内容里 */
const FIVE_INSISTENCES: { title: string; body: string }[] = [
  {
    title: '一、坚持把简单的事情复杂化',
    body: '凡可一次说明白的事项，一律通过三种表格分别说明，确保流程完整、环节清晰、责任明确。',
  },
  {
    title: '二、坚持把复杂的事情再研究一遍',
    body: '已研究过的事项应当重新研究，并形成《研究情况报告》；报告页数不少于 6 页，附件不少于 3 件。',
  },
  {
    title: '三、坚持让数据多跑路',
    body: '让数据多跑路、让群众少跑腿的相关工作正在积极推进中。目前，数据与群众均处于积极推进阶段。',
  },
  {
    title: '四、坚持公开透明',
    body: '除不宜公开、暂不宜公开、正在研究是否公开，以及已公开但查询入口位于首页第七屏以下的信息外，本站信息全部公开。',
  },
  {
    title: '五、坚持长期稳定',
    body: '本站各项主要指标连续 12 年未出现波动，包括群众满意度、表格种类数量与栏目最后更新时间。',
  },
];

export function AboutPage() {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '关于我们' }]} />

      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__side">
          <Panel title="本站信息" variant="navy">
            <InfoRows
              rows={[
                { label: '主办单位', value: SITE.organizer },
                { label: '承办单位', value: SITE.operator },
                { label: '网站标识码', value: SITE.siteCode },
                { label: '服务热线', value: `${SITE.hotline}（该号码不存在）` },
                { label: '备案信息', value: SITE.icp },
                { label: '网络安全', value: SITE.police },
              ]}
            />
          </Panel>

          <Panel title="站内导航">
            <div className="mg-static__quick">
              <Link to="/sitemap">网站地图</Link>
              <Link to="/contact">联系我们</Link>
              <Link to="/privacy">隐私政策</Link>
              <Link to="/terms">使用条款</Link>
              <Link to="/accessibility">无障碍声明</Link>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__main">
          <Panel title="本站简介" variant="red">
            <div className="mg-article__body mg-static__body">
              <p>
                美利坚合众国网上便民服务中心（以下简称"本站"）是联邦政府面向群众提供网上办事服务的总入口，
                由{SITE.organizer}主办，{SITE.operator}承办，于 1776 年上线试运行，目前仍处于试运行阶段。
              </p>
              <p>
                本站现设 {NAV_ITEMS.length} 个一级栏目、47 个二级栏目，累计公开政务服务事项 1,147 项，
                提供表格下载 1,147 种。经统计，其中可全程在线办结的事项 3 项，占 0.26%，处于历史最好水平。
              </p>
              <p>
                本站坚持"以群众为中心"的建设理念，把群众最关心的事项排列在首页第七屏以下的位置，
                以缩短首屏渲染时间，提升访问速度；经实测，首屏渲染时间为 0.4 秒，群众找到目标事项的平均时间为 26 分钟。
              </p>
              <p>
                本站服务热线 {SITE.hotline} 全天候为您服务，工作时间保持畅通；占线属于畅通的持续状态。
                本热线并不存在，如有疑问，请拨打本热线咨询。
              </p>
            </div>
          </Panel>

          <Panel title="网站建设的五个坚持">
            <ol className="mg-static__five">
              {FIVE_INSISTENCES.map((f) => (
                <li className="mg-static__five-item" key={f.title}>
                  <div className="mg-static__five-title">{f.title}</div>
                  <div className="mg-static__five-body">{f.body}</div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="郑重声明" variant="navy">
            <Alert tone="red">
              <b>免责声明：</b>本站为纯娱乐讽刺作品，<b>不含任何政治倾向</b>，不对任何国家、政党、机构或个人进行评价；
              站内全部内容、数据、文号、人物、讲话、统计数字与热线号码<b>均为虚构</b>，与任何真实主体无关。
              本站不提供任何真实政务服务，页面中的"办事"仅作演示。
            </Alert>
            <p className="mg-static__disclaimer">{DISCLAIMER}</p>
            <p className="mg-static__disclaimer">
              本站所有"荒谬"均指向官僚流程本身，属于善意调侃；如您在阅读过程中产生不适，
              可填写《不适情况反映表》一式两份，分别报送本站与您本人。
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 2. 网站地图 ================= */

/**
 * 静态页链接（页脚之外的补充入口）
 *
 * I. 组成
 *
 * 1. 手写条目：登录 / 注册 / 个人中心 / English / 无障碍 / 长者模式
 * 2. 顶栏工具条条目：排除有副作用或已手写的项（English、无障碍、长者模式、登录、注册）
 *
 * II. 去重
 *
 * 顶栏工具条（TOPBAR_LINKS）未来若新增与手写条目同路径的项，
 * 这里按 path 再做一次去重，避免网站地图渲染出重复的 React key。
 */
const STATIC_PAGE_ENTRIES: { label: string; path: string }[] = [
  { label: '用户登录', path: '/login' },
  { label: '用户注册', path: '/register' },
  { label: '个人中心', path: '/user' },
  { label: 'English', path: '/english' },
  { label: '无障碍声明', path: '/accessibility' },
  { label: '长者模式说明', path: '/elder' },
  ...TOPBAR_LINKS.filter(
    (l) => !['English', '无障碍', '长者模式', '登录', '注册'].includes(l.label)
  ).map((l) => ({
    label: l.label,
    path: l.path,
  })),
];

/** 按 path 去重后的静态页链接（Map 保留最后一次出现的标签） */
const STATIC_PAGES: { label: string; path: string }[] = Array.from(
  new Map(STATIC_PAGE_ENTRIES.map((p) => [p.path, p])).values()
).filter((p) => !FOOTER_LINKS.some((g) => g.items.some((i) => i.path === p.path)));

export function SitemapPage() {
  const columnCount = NAV_ITEMS.length + 2;
  const linkCount =
    NAV_ITEMS.reduce((sum, n) => sum + 1 + (n.children?.length ?? 0), 0) +
    STATIC_PAGES.length +
    FOOTER_LINKS.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '网站地图' }]} />

      <Panel
        title="网站地图"
        extra={<span className="mg-gov__count">共 {linkCount} 个页面链接 / {columnCount} 个分组</span>}
      >
        <Alert tone="gray">
          本页收录本站全部可访问页面。未收录页面 1 个，原因为该页面不希望被收录；
          另有 3 个页面处于"正在建设"状态，建设完成时间预计为 2027 年，与上一年度预计一致。
        </Alert>

        <div className="mg-sitemap">
          {NAV_ITEMS.map((nav) => (
            <div className="mg-sitemap__group" key={nav.path + nav.label}>
              <div className="mg-sitemap__group-title">
                <Link to={nav.path}>{nav.label}</Link>
              </div>
              <ul className="mg-sitemap__links">
                {nav.children?.map((c) => (
                  <li key={`${nav.label}-${c.path}`}>
                    <Link to={c.path}>{c.label}</Link>
                  </li>
                ))}
                {!nav.children && <li className="mg-sitemap__only">（一级栏目，无二级栏目）</li>}
              </ul>
            </div>
          ))}

          <div className="mg-sitemap__group">
            <div className="mg-sitemap__group-title">用户与工具</div>
            <ul className="mg-sitemap__links">
              {STATIC_PAGES.map((p) => (
                <li key={p.path}>
                  <Link to={p.path}>{p.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_LINKS.map((g) => (
            <div className="mg-sitemap__group" key={g.label}>
              <div className="mg-sitemap__group-title">{g.label}</div>
              <ul className="mg-sitemap__links">
                {g.items.map((i) => (
                  <li key={i.path}>
                    <Link to={i.path}>{i.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mg-static__note">
          页面链接的排列顺序与栏目重要性无关；栏目重要性以《栏目重要性排序说明》为准，
          该说明位于首页第七屏以下，需滚动两次方可到达。
        </div>
      </Panel>
    </div>
  );
}

/* ================= 3. 隐私政策 ================= */

const PRIVACY_CLAUSES: { title: string; body: string }[] = [
  {
    title: '第一条 信息收集范围',
    body:
      '在您访问本站过程中，我们可能收集以下信息：您主动填写的信息、您未主动填写的信息、您以为没有填写的信息，' +
      '以及上述三类信息的复印件。信息范围的具体边界以《信息收集范围界定表》为准，该表第 3 页需另行索取。',
  },
  {
    title: '第二条 信息收集方式',
    body:
      '包括但不限于表单填写、Cookie 记录、服务器日志、页面停留时长、鼠标移动轨迹、页面滚动深度，' +
      '以及法律法规允许的其他合法方式。上述方式无需逐一告知，统一以本条概括说明。',
  },
  {
    title: '第三条 Cookie 说明',
    body:
      '本站使用 Cookie 提升您的访问体验。您可以在浏览器设置中关闭 Cookie；关闭后，本站部分功能可能无法使用，' +
      '其余功能的可用性不受影响，因为本站大部分功能本来就无法使用。',
  },
  {
    title: '第四条 信息使用与共享',
    body:
      '我们不会出售您的个人数据。为向您提供更优质的服务，我们会与 1,247 家合作伙伴共享您的数据。' +
      '合作伙伴名单属于商业秘密，不予公开；如确需查询，可向本站提交《合作伙伴名单查询申请》，答复期限 20 个工作日。',
  },
  {
    title: '第五条 信息存储与保护',
    body:
      '您的信息存储于联邦政务云，存储期限为长期。长期的具体期限另行规定。' +
      '我们采取严格的技术措施保护您的信息安全，包括但不限于访问口令，该口令每 30 天更换一次。',
  },
  {
    title: '第六条 您的权利',
    body:
      '您有权查询、更正、删除您的个人信息。查询请本人携有效身份证件到现场办理；更正需同时提交更正说明；' +
      '删除申请需填写《数据删除申请表》，该表第 3 页需另行索取。',
  },
  {
    title: '第七条 未成年人保护',
    body:
      '未满 18 周岁的用户请在监护人陪同下访问本站。监护关系的认定方式为提供监护关系证明；' +
      '该证明由本站出具，出具证明前需先行证明监护关系。',
  },
  {
    title: '第八条 政策更新',
    body:
      '本政策每两年修订一次。修订后继续使用本站即视为您同意修订后的政策；如不同意修订后的政策，' +
      '请继续使用本站，本政策不影响您的继续使用。',
  },
];

export function PrivacyPage() {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '隐私政策' }]} />
      <Panel title="隐私政策" variant="navy" extra={<span className="mg-gov__count">共 8 条</span>}>
        <Alert>
          本站为虚构的讽刺作品，本政策同样为虚构文本，不对任何真实主体的数据处理行为作出承诺或说明。
          如您需要一份真实的隐私政策，请向您所在辖区的政务服务机构索取，索取时需填写《政策索取申请表》。
        </Alert>
        <Clauses items={PRIVACY_CLAUSES} />
        <div className="mg-static__note">
          本政策自公布之日起施行；施行日期与公布日期的换算方式，由本站另行规定。
          本政策的解释权属于本站，解释申请的办理时限为 20 个工作日。
        </div>
      </Panel>
    </div>
  );
}

/* ================= 4. 使用条款 ================= */

const TERMS_CLAUSES: { title: string; body: string }[] = [
  {
    title: '第一条 条款的接受',
    body:
      '您访问本站即视为已阅读、理解并同意本条款。未阅读的，同样视为已阅读；' +
      '不同意本条款的，请勿访问本站，但您已经访问了，故视为同意。',
  },
  {
    title: '第二条 服务内容',
    body:
      '本站提供的服务包括信息浏览、表格下载、在线申请与进度查询。在线申请提交成功后，' +
      '办理结果以现场办理结果为准；进度查询的结果以窗口工作人员的口头告知为准。',
  },
  {
    title: '第三条 用户义务',
    body:
      '您应当保证所填写的信息真实、准确、完整。因信息不准确导致的后果由您承担；' +
      '因系统未能保存导致的后果由系统承担，系统是否保存以系统记录为准。',
  },
  {
    title: '第四条 账号与密码',
    body:
      '账号密码每 30 天更换一次，且不得与前 12 次使用的密码相同。连续 5 次输入错误将锁定账号，' +
      '解锁请本人携有效身份证件到现场办理，解锁办理时限为 5 个工作日。',
  },
  {
    title: '第五条 内容与知识产权',
    body:
      '本站内容版权归本站所有。欢迎转载，转载请注明来源；转载时应当同时注明"转载不代表本站观点"，' +
      '该注明不能替代转载授权。',
  },
  {
    title: '第六条 免责声明',
    body:
      '本站不对因系统维护、网络故障、表格改版、窗口调整、人员轮岗等情形造成的任何损失承担责任。' +
      '上述情形属于本站的常态化运行状态，不构成服务瑕疵。',
  },
  {
    title: '第七条 条款变更',
    body:
      '本站有权随时变更本条款。变更后不另行通知，继续使用本站即视为同意变更后的条款；' +
      '变更历史可在本站查询，查询入口与变更通知一并公布。',
  },
  {
    title: '第八条 争议解决',
    body:
      '因本站产生的争议，双方应当友好协商解决；协商不成的，可提交本站调解。' +
      '调解由本站主持，调解意见由本站作出，调解结果以本站意见为准。',
  },
];

export function TermsPage() {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '使用条款' }]} />
      <Panel title="使用条款" variant="navy" extra={<span className="mg-gov__count">共 8 条</span>}>
        <Alert tone="gray">
          本站为纯娱乐讽刺作品，本条款不具备任何法律效力，也不构成任何形式的用户协议。
          请勿将本页面内容用于任何真实的法律场景。
        </Alert>
        <Clauses items={TERMS_CLAUSES} />
        <div className="mg-static__note">
          本条款自公布之日起施行。本条款与《隐私政策》如有不一致，以本条款为准；
          本条款与《隐私政策》如有一致，也以本条款为准，以保持条款体系的统一性。
        </div>
      </Panel>
    </div>
  );
}

/* ================= 5. 联系我们 ================= */

export function ContactPage() {
  const { pushToast } = useApp();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim() || !contact.trim() || !content.trim()) {
      setError('请填写全部三项内容。本站实行"一次告知"，本次告知的内容为：请填写全部三项内容。');
      return;
    }
    setError('');
    pushToast(
      '您的咨询已提交',
      '答复期限 20 个工作日。答复将通过站内消息发送，站内消息功能正在建设中，建设完成时间另行通知。'
    );
    setName('');
    setContact('');
    setContent('');
  };

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '联系我们' }]} />

      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__main">
          <Panel title="联系方式" variant="red">
            <InfoRows
              rows={[
                { label: '办公地址', value: '华盛顿特区宾夕法尼亚大道 1600 号（虚构），联邦便民服务大厅 3 层' },
                { label: '通信地址', value: '同上。来信请在信封注明"互联网+政务服务"字样，未注明的按普通信件处理' },
                { label: '咨询电话', value: `${SITE.hotline}（本号码不存在，占线属于畅通的持续状态）` },
                { label: '电子邮箱', value: 'service@example.gov（虚构邮箱，日均收件 3 万封，平均答复周期 20 个工作日）' },
                { label: '现场咨询', value: '政务大厅 3 号窗口（咨询引导窗口）；该窗口负责告知您到综合受理窗口办理' },
                { label: '传真', value: '本站传真号码与咨询电话相同，传真功能自 2019 年起停止使用' },
              ]}
            />
          </Panel>

          <Panel title="办公时间">
            <div className="mg-static__hours">
              <div className="mg-static__hours-row">
                <span>周一至周五</span>
                <span>09:00—11:30，13:30—16:00</span>
              </div>
              <div className="mg-static__hours-row">
                <span>周六、周日</span>
                <span>不对外办公</span>
              </div>
              <div className="mg-static__hours-row">
                <span>法定节假日</span>
                <span>除外，节假日安排以本站公告为准</span>
              </div>
            </div>
            <Alert>
              关于节假日期间的办公安排，请以本站公告为准。本公告的说明为：节假日安排另行通知。
              另行通知的具体时间，将在节假日安排确定后公告。
            </Alert>
            <div className="mg-static__note">
              午休时间（11:30—13:30）窗口不对外办公；因午休期间不办理业务，
              本站已将午休时间计入"群众平均等待时长"统计口径，等待时长因此更加完整。
            </div>
          </Panel>

          <Panel title="在线咨询">
            <Field label="您的姓名" required>
              <input
                className="mg-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名，曾用名请在注册页填写"
              />
            </Field>
            <Field label="联系方式" required hint="请填写电话或邮箱；电话请勿填写无效号码，本站无法回拨">
              <input className="mg-input" value={contact} onChange={(e) => setContact(e.target.value)} />
            </Field>
            <Field label="咨询内容" required hint="内容长度不超过 200 字；超过 200 字的请另附说明，说明不设字数上限">
              <textarea
                className="mg-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请描述您的咨询事项。示例：我想咨询某个事项，但不知道该咨询哪个窗口。"
              />
            </Field>
            {error && <div className="mg-static__error">{error}</div>}
            <div className="mg-static__actions">
              <Button variant="primary" onClick={submit}>
                提交咨询
              </Button>
              <Button
                onClick={() => {
                  setName('');
                  setContact('');
                  setContent('');
                  setError('');
                }}
              >
                重新填写
              </Button>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__side">
          <Panel title="来访提示" variant="navy">
            <div className="mg-static__side-list">
              <div>· 来访请提前 1 个工作日电话预约，预约电话无法接通时视为已预约。</div>
              <div>· 大厅入口右转后第二个立柱为收费公示牌，公示牌前方为绿植。</div>
              <div>· 取号机每小时放号 60 个，号源发完后请于次日同一时段优先取号。</div>
              <div>· 大厅饮水机开放时间与大厅一致，公告牌位于饮水机右侧。</div>
            </div>
          </Panel>

          <Panel title="其他渠道">
            <div className="mg-static__quick">
              <Link to="/interact">我要写信</Link>
              <Link to="/query">便民查询</Link>
              <Link to="/service/track">办事进度查询</Link>
              <Link to="/accessibility">无障碍声明</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 6. 无障碍声明 ================= */

const A11Y_CLAUSES: { title: string; body: string }[] = [
  {
    title: '一、字号调节',
    body:
      '本站提供字号调节功能，可将全站字号放大至 200%。放大后部分内容将超出屏幕显示范围，' +
      '这是无障碍模式的设计预期，也是本站所有页面的一致表现。',
  },
  {
    title: '二、键盘导航',
    body: '本站全部链接均可通过 Tab 键聚焦，聚焦框为 3 像素黄色边框。建议使用 Tab 键浏览，可有效减少鼠标点击带来的等待。',
  },
  {
    title: '三、对比度',
    body: '本站提供高对比度模式，开启后链接、按钮与面板边框将以黄色高亮显示，以便在强光环境下识别。',
  },
  {
    title: '四、图片替代文本',
    body:
      '本站装饰性图形均已提供替代文本。需要说明的是，本站的表格共 1,147 种，其中 1,147 种的替代文本均为"表格"。',
  },
  {
    title: '五、仍存在的障碍',
    body:
      '受历史原因影响，本站部分栏目仍需滚动两次方可到达；部分公告以图片形式发布，图片中的文字无法被读屏软件识别；' +
      '上述问题已列入《无障碍改造三年计划》，计划期为 2026 年至 2029 年。',
  },
  {
    title: '六、反馈渠道',
    body:
      '如您在使用中遇到无障碍问题，可通过在线咨询反馈。反馈请说明问题所在页面、使用的辅助设备、以及您期望的呈现方式；' +
      '我们将在 20 个工作日内答复，答复方式为站内消息。',
  },
];

export function AccessibilityPage() {
  const { elderMode, toggleElderMode, a11yMode, toggleA11y } = useApp();

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '无障碍声明' }]} />
      <Panel title="无障碍声明" variant="navy" extra={<span className="mg-gov__count">共 6 条</span>}>
        <Alert>
          本站已按照《无障碍设计规范》开展改造。经自查，本站无障碍符合度为 100%；
          自查范围为本声明所列举的六项内容，不含未列举的内容。
        </Alert>

        <div className="mg-a11y__panel">
          <div className="mg-a11y__row">
            <span className="mg-a11y__label">字号调节</span>
            <span className="mg-a11y__value">当前字号：{elderMode ? '200%' : '100%'}</span>
            <Button size="sm" variant={elderMode ? 'default' : 'primary'} onClick={toggleElderMode}>
              {elderMode ? '恢复默认字号' : '放大字号 200%'}
            </Button>
          </div>
          <Progress percent={elderMode ? 100 : 50} red={elderMode} />
          <div className="mg-a11y__hint">
            字号调节范围为 100% 与 200% 两档。介于两档之间的字号需求，请提交《字号定制申请》，
            该申请需说明使用场景并提供示例截图，办理时限 20 个工作日。
          </div>

          <div className="mg-a11y__row">
            <span className="mg-a11y__label">高对比度</span>
            <span className="mg-a11y__value">当前状态：{a11yMode ? '已开启' : '未开启'}</span>
            <Button size="sm" variant={a11yMode ? 'default' : 'gold'} onClick={toggleA11y}>
              {a11yMode ? '关闭高对比度' : '开启高对比度'}
            </Button>
          </div>

          <div className="mg-a11y__row">
            <span className="mg-a11y__label">长者模式</span>
            <span className="mg-a11y__value">与"放大字号"为同一开关，两者同时生效，互不影响</span>
            <Link to="/elder" className="mg-a11y__link">
              长者模式说明
            </Link>
          </div>
        </div>

        <Clauses items={A11Y_CLAUSES} />

        <div className="mg-static__note">
          提示：开启放大字号后，本站页脚、导航与表格将出现错位。错位不影响数据准确性，
          且为本站在所有设备上的一致表现。
        </div>
      </Panel>
    </div>
  );
}

/* ================= 7. English ================= */

export function EnglishPage() {
  return (
    <div className="mg-page">
      <Crumbs items={[{ label: 'English' }]} />
      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__main">
          <Panel title="About This Site" variant="red">
            <div className="mg-static__en">
              <p className="mg-static__en-lead">
                This site is a parody. All content is fictional.
              </p>
              <p>
                Welcome to the United States Public Convenience Service Portal. This website is
                established for the purpose of serving the people better and better. We provide
                1,147 kinds of forms for your convenience. The form you need is on the third page,
                and the third page is not on this site.
              </p>
              <p>
                Office hours: Monday to Friday, 9:00-11:30 and 13:30-16:00. Holidays are excepted.
                The arrangement of holidays shall be notified separately. The separate notice has
                not been issued yet, so the holidays are currently unknown, and the office hours
                during holidays remain unknown as well.
              </p>
              <p>
                Hotline: 1776-2026, available all day. If the line is busy, please hang up and dial
                again; call-back service is not provided. This number does not exist. If you have
                any question, please call this hotline.
              </p>
              <p>
                What we insist on, in English: to make simple things complicated; to study the
                studied things again; to let data run more roads, so that people can run fewer
                roads, which is currently under active promotion.
              </p>
              <p>
                We do not sell your personal data. We share it with 1,247 partners. The list of
                partners is a business secret and cannot be disclosed. Thank you for your
                understanding, which is highly appreciated.
              </p>
              <p className="mg-static__en-foot">
                This page is provided by automatic translation and manual adjustment. If there is
                any inconsistency between the English version and the Chinese version, please refer
                to the Chinese version, and if there is any inconsistency in the Chinese version,
                please refer to the paper document.
              </p>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__side">
          <Panel title="中文版入口" variant="navy">
            <div className="mg-static__quick">
              <Link to="/">返回首页（中文）</Link>
              <Link to="/about">关于我们</Link>
              <Link to="/contact">联系我们</Link>
              <Link to="/sitemap">网站地图</Link>
            </div>
          </Panel>
          <Panel title="Notice">
            <div className="mg-static__side-list">
              <div>This website is a work of parody and satire.</div>
              <div>All data, documents and figures are fictional.</div>
              <div>No political position is expressed or implied.</div>
              <div>The hotline number does not exist. Do not dial it.</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 8. 用户登录 ================= */

export function LoginPage() {
  const { login, logout, user, pushToast } = useApp();
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [captchaTip, setCaptchaTip] = useState('');

  const submit = () => {
    if (!name.trim()) {
      setError('请输入用户名。用户名为您的社会保障号后 4 位加姓氏，示例：1776smith。');
      return;
    }
    if (!pwd.trim()) {
      setError('请输入密码。密码不少于 8 位，须包含大小写字母与数字，且不得与前 12 次相同。');
      return;
    }
    if (!captcha.trim()) {
      setError('请输入验证码。验证码图片加载失败，请本人携有效身份证件到政务大厅 3 号窗口现场领取。');
      return;
    }
    setError('');
    login(name.trim());
  };

  if (user) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '用户登录' }]} />
        <Panel title="您已登录" variant="navy">
          <Alert tone="gray">
            当前登录用户：{user.name}（{user.level}，注册于 {user.since}）。
            本站同时只允许一个账号登录，其余 6 个账号请另行登录，登录后本账号不会退出。
          </Alert>
          <div className="mg-static__actions">
            <Button variant="primary" onClick={() => navigate('/user')}>
              进入个人中心
            </Button>
            <Button onClick={logout}>退出登录</Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '用户登录' }]} />
      <div className="mg-layout-2col mg-static__body">
        <div className="mg-layout__main">
          <Panel title="用户登录" variant="red">
            <Alert tone="gray">
              本站已接入联邦统一身份认证。登录即代表您同意我们收集、存储、分析您的全部数据；
              不同意也可以，只是办不了事。
            </Alert>
            <Field label="用户名" required hint="社会保障号后 4 位 + 姓氏，示例：1776smith">
              <input className="mg-input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="密码" required hint="8 位以上，含大小写字母与数字；每 30 天须更换一次">
              <input
                className="mg-input"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
            </Field>
            <Field label="验证码" required hint="区分大小写；看不清可点击换一张，换一张功能维护中">
              <div className="mg-static__captcha">
                <input
                  className="mg-input mg-static__captcha-input"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  style={{ flex: '1 1 auto' }}
                />
                <span className="mg-static__captcha-img">图片加载失败</span>
                <button
                  type="button"
                  className="mg-static__captcha-btn"
                  onClick={() => setCaptchaTip('换一张功能正在维护，维护窗口为每日 09:00—17:00 及 00:00—24:00。')}
                >
                  换一张
                </button>
              </div>
            </Field>
            {captchaTip && <div className="mg-static__tip">{captchaTip}</div>}
            {error && <div className="mg-static__error">{error}</div>}
            <div className="mg-static__actions">
              <Button variant="primary" onClick={submit}>
                登录
              </Button>
              <Button
                onClick={() => {
                  setName('');
                  setPwd('');
                  setCaptcha('');
                  setError('');
                  setCaptchaTip('');
                }}
              >
                重置
              </Button>
              <Button
                variant="gold"
                onClick={() =>
                  pushToast('找回密码', '请本人携有效身份证件到现场办理，办理时限 5 个工作日。')
                }
              >
                忘记密码
              </Button>
            </div>
          </Panel>
        </div>

        <div className="mg-layout__side">
          <Panel title="登录须知" variant="navy">
            <div className="mg-static__side-list">
              <div>· 本站账号共 7 个，统一身份认证后保留 6 个，另 1 个为统一账号。</div>
              <div>· 连续 5 次输入错误将锁定账号，解锁请到现场办理。</div>
              <div>· 登录成功后，您的办事数据将同步至联邦政务云。</div>
              <div>· 未注册用户请先注册；注册需填写 24 项信息，其中必填 24 项。</div>
            </div>
            <div className="mg-static__actions">
              <Button onClick={() => navigate('/register')}>前往注册</Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ================= 9. 用户注册 ================= */

type RegFieldType = 'text' | 'date' | 'select' | 'radio';

interface RegField {
  label: string;
  required: boolean;
  type?: RegFieldType;
  hint?: string;
  options?: string[];
}

/** 注册表单字段：24 项，其中 23 项必填，1 项默认勾选且无法取消 */
const REG_FIELDS: RegField[] = [
  { label: '姓名', required: true, hint: '请填写与证件一致的姓名，不一致的以证件为准，证件以现场核验为准' },
  { label: '曾用名', required: true, hint: '无曾用名的请填写"无"；填写"无"同样属于必填内容' },
  { label: '社会保障号', required: true, hint: '9 位数字；请勿填写真实号码，本站为虚构站点' },
  { label: '电子邮箱', required: true, hint: '用于接收审核结果；站内消息功能建设中，邮件亦不发送' },
  { label: '手机号码', required: true, hint: '用于接收短信验证码；短信通道维护中' },
  { label: '备用手机号码', required: true, hint: '主号码停机时使用；备用号码停机时请联系主号码' },
  { label: '现居住地址', required: true, hint: '精确到门牌号；无门牌号的请填写《无门牌号说明》' },
  { label: '邮政编码', required: true, hint: '5 位数字；不确定的请填写 00000，00000 为本站通用邮编' },
  { label: '出生地', required: true, hint: '格式：州/城市，示例：弗吉尼亚州/里士满' },
  { label: '出生日期', required: true, type: 'date' },
  { label: '母亲婚前姓', required: true, hint: '用于身份核验；遗忘的可申请查询，查询需先通过身份核验' },
  { label: '父亲曾用名', required: true, hint: '父亲无曾用名的请填写"无"，与本人曾用名规则一致' },
  { label: '安全问题', required: true, type: 'select', options: ['您第一份工作的名称', '您小学的名称', '您第一辆车的品牌'] },
  { label: '安全问题答案', required: true, hint: '答案不少于 4 个字符；答案错误 3 次将锁定账号' },
  { label: '身高（英寸）', required: true, hint: '用于无障碍设施适配；该信息不用于其他用途' },
  { label: '体重（磅）', required: true, hint: '用于电梯载重核算；电梯载重核算结果不对外公布' },
  { label: '婚姻状况', required: true, type: 'radio', options: ['未婚', '已婚', '其他'] },
  { label: '是否持有护照', required: true, type: 'radio', options: ['是', '否', '正在申请'] },
  { label: '年收入区间', required: true, type: 'select', options: ['0—1 万美元', '1—5 万美元', '5 万美元以上'] },
  { label: '常用政务账号数量', required: true, type: 'select', options: ['1 个', '4 个', '7 个', '7 个以上'] },
  { label: '紧急联系人姓名', required: true, hint: '紧急情况时联系；紧急情况的认定标准另行规定' },
  { label: '紧急联系人电话', required: true, hint: '请确保该号码可接通，不可接通的按未填写处理' },
  { label: '推荐人姓名', required: true, hint: '须为在职联邦雇员；推荐人信息由本站自行核验，核验周期 20 个工作日' },
  { label: '您希望我们如何处理您的数据', required: true, type: 'radio', options: ['同意', '同意共享', '同意共享并分析'] },
];

export function RegisterPage() {
  const { pushToast } = useApp();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const setValue = (label: string, v: string) => setValues((prev) => ({ ...prev, [label]: v }));

  const missing = REG_FIELDS.filter((f) => f.required && !(values[f.label] ?? '').trim());

  const submit = () => {
    if (missing.length > 0) {
      setError(
        `本次提交被退回：共 ${missing.length} 项必填项未填写。已为您保留已填内容，请在 15 分钟内补充；` +
          '超时后页面将刷新，且内容不保留。退回原因不再另行通知。'
      );
      return;
    }
    setError('');
    setSubmitted(true);
    pushToast('注册申请已提交', '我们将在 5—10 个工作日内完成审核。审核期间您可以先浏览本站。');
  };

  if (submitted) {
    return (
      <div className="mg-page">
        <Crumbs items={[{ label: '用户注册' }, { label: '提交成功' }]} />
        <Panel title="注册申请已提交" variant="navy">
          <Alert tone="gray">
            注册申请已提交，我们将在 5—10 个工作日内完成审核。审核期间您可以先浏览本站。
          </Alert>
          <InfoRows
            rows={[
              { label: '受理编号', value: 'REG-2026-1776' },
              { label: '本次填写', value: `${REG_FIELDS.length} 项，其中必填 ${REG_FIELDS.length} 项` },
              { label: '审核时限', value: '5—10 个工作日（不含节假日、调休及审核人员休假期间）' },
              { label: '结果通知', value: '通过站内消息通知；站内消息功能正在建设中' },
              { label: '审核进度查询', value: '可在个人中心查询；个人中心需登录后访问，登录需先完成注册' },
            ]}
          />
          <div className="mg-static__note">
            审核期间，您可继续浏览本站全部内容。浏览产生的数据将同步至审核材料，作为审核参考，
            但审核不因浏览行为而加快。
          </div>
          <div className="mg-static__actions">
            <Button variant="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button
              onClick={() => {
                setSubmitted(false);
                setValues({});
              }}
            >
              重新填写
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mg-page">
      <Crumbs items={[{ label: '用户注册' }]} />
      <Panel
        title="用户注册"
        variant="red"
        extra={<span className="mg-gov__count">共 {REG_FIELDS.length} 项 / 必填 {REG_FIELDS.length} 项</span>}
      >
        <Alert>
          为向您提供更精准的服务，注册需填写 {REG_FIELDS.length} 项信息。其中必填 {REG_FIELDS.length} 项，
          选填 0 项。带 <span className="mg-static__req">*</span> 的为必填项；未带 <span className="mg-static__req">*</span> 的，
          同样必填，仅标识未加星号。
        </Alert>

        <div className="mg-static__form-grid">
          {REG_FIELDS.map((f) => (
            <Field key={f.label} label={f.label} required={f.required} hint={f.hint}>
              {f.type === 'select' ? (
                <select
                  className="mg-select"
                  value={values[f.label] ?? ''}
                  onChange={(e) => setValue(f.label, e.target.value)}
                >
                  <option value="">请选择</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === 'radio' ? (
                <span className="mg-static__radios">
                  {(f.options ?? []).map((o) => (
                    <label className="mg-static__radio" key={o}>
                      <input
                        type="radio"
                        name={f.label}
                        checked={values[f.label] === o}
                        onChange={() => setValue(f.label, o)}
                      />
                      {o}
                    </label>
                  ))}
                </span>
              ) : (
                <input
                  className="mg-input"
                  type={f.type === 'date' ? 'date' : 'text'}
                  value={values[f.label] ?? ''}
                  onChange={(e) => setValue(f.label, e.target.value)}
                />
              )}
            </Field>
          ))}

          <Field label="服务协议" required hint="本选项默认为已勾选，且无法取消">
            <label className="mg-static__radio">
              <input type="checkbox" checked readOnly />
              我已阅读并同意《使用条款》与《隐私政策》，并同意与 1,247 家合作伙伴共享我的数据
            </label>
          </Field>
        </div>

        {error && <div className="mg-static__error mg-static__error--wide">{error}</div>}

        <div className="mg-static__actions">
          <Button variant="primary" onClick={submit}>
            提交注册申请
          </Button>
          <Button onClick={() => setValues({})}>清空重填</Button>
          <span className="mg-static__actions-note">
            当前已填写 {REG_FIELDS.filter((f) => (values[f.label] ?? '').trim()).length} / {REG_FIELDS.length} 项
          </span>
        </div>
      </Panel>
    </div>
  );
}

/* ================= 10. 404 ================= */

export function NotFoundPage() {
  return (
    <div className="mg-page">
      <Panel title="页面未找到" variant="red">
        <div className="mg-404">
          <div className="mg-404__code">404</div>
          <div className="mg-404__title">您访问的页面不存在</div>
          <div className="mg-404__hint">您访问的页面可能已被归档。归档记录本身也已归档。</div>
          <ul className="mg-404__reasons">
            <li>该页面的地址已变更，变更后的地址未在本站公布。</li>
            <li>该页面正在维护，维护窗口为每日 09:00—17:00 及 00:00—24:00。</li>
            <li>该页面确实存在，但跳转链接位于首页第七屏以下。</li>
            <li>该页面从未存在，但相关表格已经印制完毕。</li>
          </ul>
          <div className="mg-404__actions">
            <Button variant="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
            <Button onClick={() => navigate('/sitemap')}>查看网站地图</Button>
            <Button variant="gold" onClick={() => navigate('/interact')}>
              写信反映
            </Button>
          </div>
          <div className="mg-404__foot">
            如确需访问该页面，请填写《页面访问申请表》，我们将在 20 个工作日内答复该页面是否存在。
            答复方式为电话通知；电话号码请在大厅公告栏查询。
          </div>
        </div>
      </Panel>
    </div>
  );
}
