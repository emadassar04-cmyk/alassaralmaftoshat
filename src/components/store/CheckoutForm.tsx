'use client'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { fmt, PAYMENT_LABEL } from '@/lib/format'
import type { Branch, PaymentMethod } from '@/lib/types'
import { Turnstile } from './Turnstile'
import { track } from '@/lib/pixel'

type Accounts = Record<string, { account: string; holder?: string }>
export function CheckoutForm({ branches, accounts }: { branches: Branch[]; accounts: Accounts }) {
  const { lines, subtotal, clear } = useCart(); const router = useRouter()
  const [f, setF] = useState({ name: '', phone: '', branch_id: branches[0]?.id ?? '', fulfillment: 'pickup', address: '', payment_method: 'in_store' as PaymentMethod, coupon: '', notes: '', hp: '' })
  const [disc, setDisc] = useState(0); const [cMsg, setCMsg] = useState(''); const [token, setToken] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const onToken = useCallback((t: string) => setToken(t), [])
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }))
  const methods: PaymentMethod[] = f.fulfillment === 'pickup' ? ['in_store', 'palpay', 'jawwal_pay', 'bank_palestine'] : ['cod', 'palpay', 'jawwal_pay', 'bank_palestine']

  async function applyCoupon() {
    const r = await fetch('/api/coupon', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: f.coupon, phone: f.phone, subtotal }) })
    const j = await r.json().catch(() => ({})); setCMsg(j.message ?? ''); setDisc(j.valid ? j.discount : 0)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    track('InitiateCheckout', { value: subtotal, currency: 'ILS', num_items: lines.length })
    const body = { name: f.name, phone: f.phone, branch_id: f.branch_id, fulfillment: f.fulfillment, address: f.address || undefined,
      payment_method: methods.includes(f.payment_method) ? f.payment_method : methods[0], coupon_code: f.coupon || undefined, notes: f.notes || undefined, hp: f.hp, token,
      items: lines.map((l) => ({ product_id: l.product_id, variant_id: l.variant_id, qty: l.qty, measurements: l.measurements ?? null })) }
    const r = await fetch('/api/order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({})); setBusy(false)
    if (!r.ok) return setErr(j.error ?? 'تعذّر إرسال الطلب')
    track('Purchase', { value: subtotal - disc, currency: 'ILS' })
    clear(); if (j.whatsapp) window.open(j.whatsapp, '_blank', 'noopener')
    router.push(`/thank-you/${j.token}`)
  }
  if (lines.length === 0) return <div className="py-24 text-center"><p className="text-muted">سلتك فارغة.</p><Link href="/shop" className="btn btn-solid mt-6">تصفّح المتجر</Link></div>
  const acct = accounts[f.payment_method]
  return (
    <form onSubmit={submit} className="grid gap-10 md:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <label className="block text-sm text-muted">الاسم<input className="field mt-1" required value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></label>
        <label className="block text-sm text-muted">رقم الجوال<input className="field mt-1" dir="ltr" inputMode="tel" required placeholder="059xxxxxxx" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /></label>
        <label className="block text-sm text-muted">الفرع<select className="field mt-1" value={f.branch_id} onChange={(e) => set('branch_id', e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <fieldset><legend className="mb-2 text-sm text-muted">طريقة الاستلام</legend>
          <div className="grid grid-cols-2 gap-2">{[['pickup', 'استلام من الفرع'], ['delivery', 'توصيل']].map(([v, l]) => <button type="button" key={v} aria-pressed={f.fulfillment === v} onClick={() => { set('fulfillment', v); set('payment_method', v === 'pickup' ? 'in_store' : 'cod') }}
            className={`border py-3 ${f.fulfillment === v ? 'border-copper bg-copper/15 text-copper-lt' : 'border-copper/25'}`}>{l}</button>)}</div></fieldset>
        {f.fulfillment === 'delivery' && <label className="block text-sm text-muted">عنوان التوصيل<textarea className="field mt-1" required value={f.address} onChange={(e) => set('address', e.target.value)} /></label>}
        <fieldset><legend className="mb-2 text-sm text-muted">طريقة الدفع</legend>
          <div className="grid gap-2 sm:grid-cols-2">{methods.map((m) => <button type="button" key={m} aria-pressed={f.payment_method === m} onClick={() => set('payment_method', m)} className={`border py-3 ${f.payment_method === m ? 'border-copper bg-copper/15 text-copper-lt' : 'border-copper/25'}`}>{PAYMENT_LABEL[m]}</button>)}</div>
          {acct && !['in_store', 'cod'].includes(f.payment_method) && <p className="mt-3 border border-copper/25 bg-night-2 p-3 text-sm">حوّل المبلغ إلى: <strong dir="ltr" className="text-copper-lt">{acct.account}</strong>{acct.holder && ` (${acct.holder})`}<br /><span className="text-muted">ثم أرسل صورة الإيصال على واتساب مع رقم طلبك.</span></p>}</fieldset>
        <label className="block text-sm text-muted">ملاحظات<textarea className="field mt-1" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={f.hp} onChange={(e) => set('hp', e.target.value)} />
      </div>
      <aside className="h-fit space-y-4 border border-copper/25 bg-night-2 p-5 md:sticky md:top-24">
        <h2 className="font-display text-2xl text-copper-lt">ملخص الطلب</h2>
        <ul className="space-y-2 text-sm">{lines.map((l) => <li key={l.key} className="flex justify-between gap-3"><span>{l.name}{l.variant_label && ` (${l.variant_label})`} × {l.qty}</span><span className="shrink-0">{fmt(l.unit_price * l.qty)}</span></li>)}</ul>
        <div className="flex gap-2"><input className="field" dir="ltr" placeholder="كود الخصم" value={f.coupon} onChange={(e) => set('coupon', e.target.value)} /><button type="button" className="btn !px-4" onClick={applyCoupon} disabled={!f.coupon}>تطبيق</button></div>
        {cMsg && <p className={`text-sm ${disc ? 'text-copper-lt' : 'text-danger'}`}>{cMsg}</p>}
        {disc > 0 && <p className="flex justify-between text-sm"><span>الخصم</span><span>-{fmt(disc)}</span></p>}
        <p className="flex justify-between border-t border-copper/15 pt-3 text-xl"><span>الإجمالي</span><strong className="text-copper-lt">{fmt(subtotal - disc)}</strong></p>
        {lines.some((l) => l.is_custom) && <p className="text-xs text-muted">السعر النهائي للمنتجات المفصّلة يُحدَّد بعد مراجعة القياسات.</p>}
        <Turnstile onToken={onToken} />
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn btn-solid w-full" disabled={busy}>{busy ? 'جارٍ الإرسال...' : 'تأكيد وإرسال عبر واتساب'}</button>
      </aside>
    </form>
  )
}
