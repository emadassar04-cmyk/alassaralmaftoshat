'use client'
import { useActionState, useState, useTransition, type ReactNode } from 'react'
import { generateApiKey, generateSigningSecret, resendAllFailed, saveFacebook, saveGmail, saveN8n, saveTelegram, saveWhatsApp, testN8n, testTelegram, testWhatsApp } from '@/app/admin/integrations-actions'

type R = { ok?: boolean; error?: string; message?: string; secret?: string }
export type Badge = { label: string; tone: 'ok' | 'off' | 'warn' }
const TONE = { ok: 'bg-emerald-100 text-emerald-800', off: 'bg-stone-200 text-stone-700', warn: 'bg-amber-100 text-amber-800' }

function Card({ title, badge, last, children }: { title: string; badge: Badge; last?: string | null; children: ReactNode }) {
  return (
    <section className="a-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl text-[#8f6a2e]">{title}</h2><span className={`a-pill ${TONE[badge.tone]}`}>{badge.label}</span></div>
      <p className="a-muted">آخر استخدام: {last ?? 'لم يُستخدم بعد'}</p>{children}
    </section>
  )
}
const Msg = ({ s }: { s?: R }) => s?.error ? <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{s.error}</p> : s?.message ? <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">{s.message}</p> : null
export function CopyBtn({ text, label = 'نسخ' }: { text: string; label?: string }) {
  const [d, setD] = useState(false)
  return <button type="button" className="a-btn !min-h-8 !px-3" onClick={async () => { await navigator.clipboard.writeText(text); setD(true); setTimeout(() => setD(false), 1500) }}>{d ? 'تم النسخ ✓' : label}</button>
}
function OneTime({ value, onClose }: { value: string; onClose: () => void }) {
  return (
    <div className="space-y-2 rounded-lg border-2 border-amber-400 bg-amber-50 p-3" role="alert">
      <p className="text-sm font-semibold text-amber-900">انسخه الآن! لن يظهر كاملاً مرة أخرى.</p>
      <p dir="ltr" className="break-all rounded bg-white p-2 font-mono text-sm">{value}</p>
      <div className="flex gap-2"><CopyBtn text={value} /><button type="button" className="a-btn !min-h-8" onClick={onClose}>تم، أخفِه</button></div>
    </div>
  )
}
function Secret({ name, masked, gen, warn }: { name: string; masked: string; gen: () => Promise<R>; warn: string }) {
  const [v, setV] = useState<string | null>(null); const [e, setE] = useState<string | undefined>(); const [p, start] = useTransition()
  return (
    <div className="space-y-2 rounded-lg border border-[var(--a-line)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{name}</p><p dir="ltr" className="a-muted text-start font-mono">{masked || 'غير مُولَّد'}</p></div>
        <button type="button" className="a-btn" disabled={p} onClick={() => { if (masked && !confirm(warn)) return; start(async () => { const r = await gen(); if (r.secret) setV(r.secret); else setE(r.error) }) }}>{masked ? 'توليد جديد' : 'توليد'}</button></div>
      {v && <OneTime value={v} onClose={() => setV(null)} />}{e && <p className="text-sm text-rose-800">{e}</p>}
    </div>
  )
}
function Test({ label, run }: { label: string; run: () => Promise<R> }) {
  const [s, setS] = useState<R>(); const [p, start] = useTransition()
  return <div className="space-y-2"><button type="button" className="a-btn" disabled={p} onClick={() => start(async () => setS(await run()))}>{p ? 'جارٍ الاختبار...' : label}</button><Msg s={s} /></div>
}

export function N8nCard({ badge, last, url, enabled, signingMasked, keyPrefix, lastWebhook }: { badge: Badge; last: string | null; url: string; enabled: boolean; signingMasked: string; keyPrefix: string | null; lastWebhook: string | null }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveN8n, undefined)
  return (
    <Card title="n8n" badge={badge} last={last}>
      <form action={action} className="space-y-3">
        <label className="a-lbl">رابط Webhook في n8n (Production URL)<input name="url" defaultValue={url} dir="ltr" placeholder="https://xxxx.ngrok-free.app/webhook/…" className="a-field mt-1" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={enabled} className="h-5 w-5" />تفعيل الربط (عند الإيقاف تُرفض كل طلبات API ولا تُرسل أحداث)</label>
        <div className="flex flex-wrap items-center gap-3"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
      </form>
      <p className="a-muted">آخر Webhook أُرسل: <b dir="ltr">{lastWebhook ?? '—'}</b> · رابط ngrok يتغيّر؟ عدّله هنا فقط.</p>
      <Secret name="مفتاح API للموقع (يستعمله n8n في الهيدر X-API-Key)" masked={keyPrefix ? `${keyPrefix}…` : ''} gen={generateApiKey} warn="توليد مفتاح جديد يلغي القديم فوراً وستتوقف أي workflow تستعمله. متابعة؟" />
      <Secret name="سر توقيع الأحداث (يصل في الهيدر X-Assar-Secret)" masked={signingMasked} gen={generateSigningSecret} warn="سر جديد سيُلغي القديم، حدّث التحقق في n8n. متابعة؟" />
      <Test label="اختبار الاتصال" run={testN8n} />
    </Card>
  )
}
export function WhatsAppCard({ badge, last, phoneId, tokenMasked }: { badge: Badge; last: string | null; phoneId: string; tokenMasked: string }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveWhatsApp, undefined); const [t, tAction, tPending] = useActionState<R | undefined, FormData>(testWhatsApp, undefined)
  return (
    <Card title="WhatsApp Business API" badge={badge} last={last}>
      <p className="a-muted">للبوت والإشعارات فقط. أزرار الطلب في المتجر تستعمل روابط wa.me العادية.</p>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="a-lbl">Phone Number ID<input name="phone_id" defaultValue={phoneId} dir="ltr" className="a-field mt-1" /></label>
        <label className="a-lbl">Access Token {tokenMasked && <span dir="ltr">({tokenMasked})</span>}<input name="token" type="password" autoComplete="off" placeholder={tokenMasked ? 'اتركه فارغاً للإبقاء على الحالي' : ''} dir="ltr" className="a-field mt-1" /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
      </form>
      <form action={tAction} className="flex flex-wrap items-end gap-2"><label className="a-lbl">رقم لإرسال رسالة تجريبية (دولي)<input name="to" dir="ltr" placeholder="970591234567" className="a-field mt-1 w-56" /></label><button className="a-btn" disabled={tPending}>{tPending ? '...' : 'إرسال رسالة تجريبية'}</button></form><Msg s={t} />
    </Card>
  )
}
export function TelegramCard({ badge, last, chatId, tokenMasked }: { badge: Badge; last: string | null; chatId: string; tokenMasked: string }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveTelegram, undefined)
  return (
    <Card title="تليجرام" badge={badge} last={last}>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="a-lbl">Bot Token {tokenMasked && <span dir="ltr">({tokenMasked})</span>}<input name="token" type="password" autoComplete="off" placeholder={tokenMasked ? 'اتركه فارغاً للإبقاء على الحالي' : '123456:ABC…'} dir="ltr" className="a-field mt-1" /></label>
        <label className="a-lbl">Chat ID للإشعارات<input name="chat_id" defaultValue={chatId} dir="ltr" className="a-field mt-1" /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
      </form>
      <Test label="إرسال رسالة تجريبية" run={testTelegram} />
    </Card>
  )
}
export function FacebookCard({ badge, pageUrl, pixel }: { badge: Badge; pageUrl: string; pixel: string }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveFacebook, undefined)
  return (
    <Card title="فيسبوك" badge={badge} last="—">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="a-lbl">رابط الصفحة<input name="page_url" defaultValue={pageUrl} dir="ltr" placeholder="https://facebook.com/…" className="a-field mt-1" /></label>
        <label className="a-lbl">Meta Pixel ID (أرقام)<input name="pixel" defaultValue={pixel} dir="ltr" inputMode="numeric" className="a-field mt-1" /></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button><Msg s={s} /></div>
      </form>
    </Card>
  )
}
export function GmailCard({ badge, email }: { badge: Badge; email: string }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveGmail, undefined)
  return (
    <Card title="Gmail للإشعارات" badge={badge} last="—">
      <form action={action} className="flex flex-wrap items-end gap-3"><label className="a-lbl">الإيميل الذي تصله الطلبات<input name="email" type="email" defaultValue={email} dir="ltr" className="a-field mt-1 w-72" /></label><button className="a-btn a-btn-solid" disabled={pending}>حفظ</button></form>
      <p className="a-muted">الإرسال الفعلي يتم من n8n؛ هذا الحقل يعرّفه الإيميل المطلوب.</p><Msg s={s} />
    </Card>
  )
}
export function RetryAll() {
  const [s, setS] = useState<R>(); const [p, start] = useTransition()
  return <div className="flex flex-wrap items-center gap-3"><button className="a-btn" disabled={p} onClick={() => start(async () => setS(await resendAllFailed()))}>{p ? '...' : 'إعادة إرسال كل الفاشل'}</button><Msg s={s} /></div>
}
