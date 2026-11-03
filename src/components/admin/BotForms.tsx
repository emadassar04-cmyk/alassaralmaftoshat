'use client'
import { useActionState, useRef, useState, useTransition } from 'react'
import { connectBot, saveBotKeys, sendManualReply } from '@/app/admin/bot-actions'

type R = { ok?: boolean; error?: string; message?: string }
const Msg = ({ s }: { s?: R }) => s?.error ? <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{s.error}</p> : s?.message ? <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">{s.message}</p> : null

export function BotKeysForm({ tokenMasked, keyMasked, geminiMasked, provider, mode, n8nUrl, fallback }: { tokenMasked: string; keyMasked: string; geminiMasked: string; provider: 'gemini' | 'claude'; mode: 'site' | 'n8n'; n8nUrl: string; fallback: boolean }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(saveBotKeys, undefined)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="a-lbl">Bot Token لبوت الزبائن {tokenMasked && <span dir="ltr">({tokenMasked})</span>}<input name="token" type="password" autoComplete="off" dir="ltr" placeholder={tokenMasked ? 'اتركه فارغاً للإبقاء على الحالي' : '123456:ABC…'} className="a-field mt-1" /></label>
      <label className="a-lbl">طريقة التشغيل<select name="mode" defaultValue={mode} className="a-field mt-1"><option value="site">داخل الموقع (24 ساعة)</option><option value="n8n">عبر n8n (workflow + HTTP)</option></select></label>
      <label className="a-lbl sm:col-span-2">رابط Webhook لـ workflow البوت في n8n (لوضع n8n)<input name="n8n_url" type="url" dir="ltr" defaultValue={n8nUrl} placeholder="https://…/webhook/alassar-bot" className="a-field mt-1" /></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="fallback" type="checkbox" defaultChecked={fallback} /> إذا n8n مش شغّال (الجهاز مطفي)، يرد الموقع بداله تلقائياً حتى يضل البوت شغّال 24 ساعة</label>
      <label className="a-lbl">الذكاء الاصطناعي للموقع (وضع «الموقع» والاحتياط)<select name="provider" defaultValue={provider} className="a-field mt-1"><option value="gemini">Gemini (له طبقة مجانية)</option><option value="claude">Claude (مدفوع)</option></select></label>
      <label className="a-lbl">مفتاح Gemini API {geminiMasked && <span dir="ltr">({geminiMasked})</span>}<input name="gemini_key" type="password" autoComplete="off" dir="ltr" placeholder={geminiMasked ? 'اتركه فارغاً للإبقاء على الحالي' : 'AIza…'} className="a-field mt-1" /></label>
      <label className="a-lbl">مفتاح Claude API (اختياري) {keyMasked && <span dir="ltr">({keyMasked})</span>}<input name="anthropic_key" type="password" autoComplete="off" dir="ltr" placeholder={keyMasked ? 'اتركه فارغاً للإبقاء على الحالي' : 'sk-ant-…'} className="a-field mt-1" /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="a-btn a-btn-solid" disabled={pending}>حفظ المفاتيح</button><Msg s={s} /></div>
    </form>
  )
}
export function ConnectButton() {
  const [s, setS] = useState<R>(); const [p, start] = useTransition()
  return <div className="space-y-2"><button type="button" className="a-btn" disabled={p} onClick={() => start(async () => setS(await connectBot()))}>{p ? '...' : 'ربط البوت بتليجرام'}</button><Msg s={s} /></div>
}
export function ManualReply({ id }: { id: string }) {
  const [s, action, pending] = useActionState<R | undefined, FormData>(sendManualReply, undefined); const ref = useRef<HTMLFormElement>(null)
  return (
    <form ref={ref} action={async (fd) => { await action(fd); ref.current?.reset() }} className="no-print space-y-2">
      <input type="hidden" name="id" value={id} />
      <textarea name="text" required rows={3} placeholder="اكتب ردك للزبون… (عند الإرسال تستلم المحادثة ويسكت البوت فيها)" className="a-field" aria-label="ردك" />
      <div className="flex flex-wrap items-center gap-3"><button className="a-btn a-btn-solid" disabled={pending}>{pending ? '...' : 'إرسال على تليجرام'}</button><Msg s={s?.error ? s : undefined} /></div>
    </form>
  )
}
