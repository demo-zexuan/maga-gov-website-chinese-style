/**
 * 互动交流 —— 写信表单
 *
 * I. 职责
 *
 * 1. 「我要写信」的完整表单：姓名 / 联系方式 / 证件号 / 信件类型 / 标题 / 正文 /
 *    验证码 / 同意条款，全部校验都是真实生效的，不存在"随便填填也能过"的字段。
 * 2. `compact` 模式供「建言献策」的「我要建言」复用，只保留姓名、标题、正文、验证码。
 * 3. 提交成功后给出受理编号，并按《信访条例》告知 60 个工作日答复时限。
 *
 * II. 校验设计的黑色幽默
 *
 * 1. 每个字段的报错文案都顺手交代了"这项为什么必须填"，理由都很充分。
 * 2. 提交成功后的提示信息齐备而完整 —— 唯一没说的是"什么时候真的会答复"。
 * 3. 验证码不区分大小写（本表单的验证码是纯数字）。
 *
 * @module pages/interact/LetterForm
 * @author zexuan.peng <pengzexuan2001@gmail.com>
 * @created 2026-09-30
 */
import { useState } from 'react';
import { Alert, Button, Field } from '@/components/ui';
import { useApp } from '@/app-context';

/* ---------------- 常量 ---------------- */

/** 信件类型 */
const LETTER_TYPES = ['咨询', '投诉', '建议', '表扬'];

/** 正文最少字数 */
const MIN_BODY = 20;

/** 标题最少字数 */
const MIN_TITLE = 6;

/** 生成 4 位数字验证码（1000-9999，首位不为 0） */
function makeCaptcha(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** 提交受理编号：LT-年份-6 位数字 */
function makeReceipt(): string {
  return `LT-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

/* ---------------- 类型 ---------------- */

interface FieldErrors {
  name?: string;
  contact?: string;
  idNo?: string;
  title?: string;
  body?: string;
  captcha?: string;
  agree?: string;
}

export interface LetterFormProps {
  /** 简化模式：仅姓名 / 标题 / 正文 / 验证码（建言献策用） */
  compact?: boolean;
  /** 提交成功回调（参数为受理编号） */
  onSubmitted?: (no: string) => void;
}

/* ---------------- 组件 ---------------- */

export default function LetterForm({ compact = false, onSubmitted }: LetterFormProps) {
  const { pushToast } = useApp();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [idNo, setIdNo] = useState('');
  const [type, setType] = useState(compact ? '建议' : '咨询');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [code, setCode] = useState('');
  const [agree, setAgree] = useState(false);

  const [captcha, setCaptcha] = useState(makeCaptcha);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [receipt, setReceipt] = useState('');

  const refreshCaptcha = () => {
    setCaptcha(makeCaptcha());
    setCode('');
  };

  /** 全量校验：返回错误表 */
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};

    if (!name.trim()) e.name = '请填写姓名。可以填写化名，但请您记住所填写的化名。';
    else if (name.trim().length < 2) e.name = '姓名至少 2 个字。';

    if (!compact) {
      if (!contact.trim()) {
        e.contact = '请填写联系方式。本平台不会主动联系您，但仍需填写。';
      } else if (!/^(\+?[\d\s-]{7,})|(\S+@\S+\.\S+)$/.test(contact.trim())) {
        e.contact = '联系方式格式不正确。可填写手机号或电子邮箱。';
      }
      if (!idNo.trim()) {
        e.idNo = '请填写证件号码。证件号码仅用于身份核验，核验结果不予告知。';
      } else if (idNo.trim().length < 6) {
        e.idNo = '证件号码长度不足，请填写完整号码。';
      }
    }

    if (!title.trim()) e.title = `请填写${compact ? '建议' : '信件'}标题。`;
    else if (title.trim().length < MIN_TITLE) e.title = `标题不少于 ${MIN_TITLE} 个字。`;

    if (!body.trim()) e.body = `请填写${compact ? '建议内容' : '信件正文'}。`;
    else if (body.trim().length < MIN_BODY) {
      e.body = `正文不少于 ${MIN_BODY} 个字。当前 ${body.trim().length} 字。`;
    }

    if (code.trim() !== captcha) e.captcha = '验证码不正确。验证码不区分大小写。';

    if (!compact && !agree) {
      e.agree = '请阅读并同意《网上信访须知》。须知全文可在窗口索取。';
    }

    return e;
  };

  /** 提交 */
  const onSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      if (e.captcha) refreshCaptcha();
      pushToast('提交未成功', '表单校验未通过，请按提示修改后重新提交。本次未生成受理编号。');
      return;
    }
    setErrors({});
    const no = makeReceipt();
    setReceipt(no);
    pushToast(
      compact ? '建言已提交' : '信件已提交',
      `受理编号 ${no}。根据《信访条例》，我们将在 60 个工作日内答复您。`
    );
    onSubmitted?.(no);
  };

  /** 复位，继续写下一封 */
  const reset = () => {
    setName('');
    setContact('');
    setIdNo('');
    setTitle('');
    setBody('');
    setCode('');
    setAgree(false);
    setErrors({});
    setReceipt('');
    refreshCaptcha();
  };

  /* ---------------- 提交成功后的结果区 ---------------- */

  if (receipt) {
    return (
      <div className="mg-it-done">
        <Alert tone="gray">
          {compact ? '您的建议很好，我们已收悉。' : '您的来信已提交，受理编号如下。'}
        </Alert>
        <div className="mg-it-receipt">{receipt}</div>
        <div className="mg-result">
          <div className="mg-result__row">
            <span className="mg-result__label">受理编号</span>
            <span className="mg-result__value">{receipt}</span>
          </div>
          <div className="mg-result__row">
            <span className="mg-result__label">{compact ? '建言标题' : '信件标题'}</span>
            <span className="mg-result__value">{title}</span>
          </div>
          <div className="mg-result__row">
            <span className="mg-result__label">{compact ? '建言类型' : '信件类型'}</span>
            <span className="mg-result__value">{type}</span>
          </div>
          <div className="mg-result__row">
            <span className="mg-result__label">答复时限</span>
            <span className="mg-result__value">60 个工作日（根据《信访条例》）</span>
          </div>
          <div className="mg-result__row">
            <span className="mg-result__label">当前状态</span>
            <span className="mg-result__value">已受理，待转交</span>
          </div>
        </div>
        <div className="mg-it-note">
          <b>根据《信访条例》，我们将在 60 个工作日内答复您。</b>
        </div>
        <div className="mg-it-note">
          感谢您的耐心等待，您的等待时间不计入办理时限。
        </div>
        <div className="mg-it-note">
          您的来信已转交相关部门。转交部门将在 5 个工作日内确认是否属于本部门职责；
          不属于的，将转交其他部门，转交次数不设上限。
        </div>
        <div className="mg-it-note">
          受理编号是查询进度的唯一凭证，请自行记录。本平台不提供信件进度查询入口。
        </div>
        <div className="mg-it-actions">
          <Button size="sm" onClick={reset}>
            再写一封
          </Button>
          <Button size="sm" variant="primary" onClick={() => pushToast('提示', '本平台不提供信件进度查询入口。')}>
            查询进度
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- 表单 ---------------- */

  return (
    <div className="mg-it-form">
      {!compact && (
        <Alert tone="yellow">
          本栏目受理咨询、投诉、建议与表扬。根据《信访条例》，我们将在 60 个工作日内答复您。
          为提高办理效率，请勿就同一事项重复提交；重复提交将合并为一件办理，合并后时限自最后一件提交之日起算。
        </Alert>
      )}

      <Field label="姓名" required error={errors.name} hint={compact ? undefined : '可填写化名。'}>
        <input
          className="mg-input"
          value={name}
          placeholder={compact ? '可填写化名' : '请填写真实姓名或化名'}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      {!compact && (
        <>
          <Field
            label="联系方式"
            required
            error={errors.contact}
            hint="仅用于必要时核实情况，不用于回访。"
          >
            <input
              className="mg-input"
              value={contact}
              placeholder="手机号或电子邮箱"
              onChange={(e) => setContact(e.target.value)}
            />
          </Field>

          <Field
            label="证件号码"
            required
            error={errors.idNo}
            hint="仅用于身份核验，核验结果不予告知。"
          >
            <input
              className="mg-input"
              value={idNo}
              placeholder="请填写完整证件号码"
              onChange={(e) => setIdNo(e.target.value)}
            />
          </Field>
        </>
      )}

      <Field label={compact ? '建言类型' : '信件类型'} required>
        <div className="mg-radio-group">
          {LETTER_TYPES.map((t) => (
            <label key={t} className="mg-it-radio">
              <input
                type="radio"
                name={compact ? 'advice-type' : 'letter-type'}
                checked={type === t}
                onChange={() => setType(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </Field>

      <Field label={compact ? '建言标题' : '信件标题'} required error={errors.title}>
        <input
          className="mg-input"
          value={title}
          maxLength={60}
          placeholder={`不超过 60 个字，不少于 ${MIN_TITLE} 个字`}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label={compact ? '建言内容' : '信件正文'} required error={errors.body}>
        <textarea
          className="mg-textarea"
          value={body}
          maxLength={2000}
          placeholder={`请写明时间、地点、事项与您的诉求，不少于 ${MIN_BODY} 个字`}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className={`mg-it-charcount${body.trim().length >= MIN_BODY ? ' is-ok' : ''}`}>
          已填写 {body.trim().length} 字（不少于 {MIN_BODY} 字）· 剩余可填写 {2000 - body.length} 字
        </div>
      </Field>

      <Field label="验证码" required error={errors.captcha} hint="看不清可点击验证码刷新。验证码不区分大小写。">
        <div className="mg-it-captcha-row">
          <input
            className="mg-input mg-it-captcha-row__input"
            value={code}
            maxLength={4}
            placeholder="4 位数字"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            aria-label="验证码"
          />
          <span
            className="mg-it-captcha"
            role="button"
            tabIndex={0}
            title="点击刷新验证码"
            onClick={refreshCaptcha}
            onKeyDown={(e) => {
              if (e.key === 'Enter') refreshCaptcha();
            }}
          >
            {captcha}
          </span>
        </div>
      </Field>

      {!compact && (
        <Field label=" " error={errors.agree}>
          <label className="mg-it-agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            我已阅读并同意《网上信访须知》，并承诺所提交内容真实、准确、完整。
          </label>
        </Field>
      )}

      <div className="mg-it-actions">
        <Button variant="primary" onClick={onSubmit}>
          {compact ? '提交建言' : '提交信件'}
        </Button>
        <Button onClick={reset}>重置</Button>
        <span className="mg-it-note">
          提交后不可修改。如需修改，请在 60 个工作日答复期满后重新提交。
        </span>
      </div>
    </div>
  );
}
