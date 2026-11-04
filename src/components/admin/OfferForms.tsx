'use client'
import { useState, useTransition } from 'react'
import { endOffer, saveOffer } from '@/app/admin/offers-actions'

export type OfferProduct = { id: string; name: string; base_price: number; sale_price: number | null; sale_starts_at: string | null; sale_ends_at: string | null; is_featured: boolean; is_custom: boolean }
const toLocal = (iso?: string | null) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const fmt = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪`

export function OfferEditor({ products }: { products: OfferProduct[] }) {
  const [pid, setPid] = useState(''); const p = products.find((x) => x.id === pid)
  const [f, setF] = useState({ price: '', pct: '', starts: '', ends: '', featured: false })
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string }>(); const [pending, start] = useTransition()
  const pick = (id: string) => { setPid(id); const x = products.find((y) => y.id === id); setMsg(undefined)
    setF({ price: x?.sale_price != null ? String(x.sale_price) : '', pct: '', starts: toLocal(x?.sale_starts_at), ends: toLocal(x?.sale_ends_at), featured: x?.is_featured ?? false }) }
  const price = Number(f.price)
  const off = p && price > 0 ? Math.round((1 - price / p.base_price) * 100) : 0
  return (
    <form className="a-card grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={(e) => { e.preventDefault(); setMsg(undefined)
      start(async () => { const r = await saveOffer({ product_id: pid, sale_price: price, starts: f.starts ? new Date(f.starts).toISOString() : null, ends: f.ends ? new Date(f.ends).toISOString() : null, featured: f.featured }); setMsg(r); if (r.ok) { setPid(''); setF({ price: '', pct: '', starts: '', ends: '', featured: false }) } }) }}>
      <h2 className="font-semibold sm:col-span-2 lg:col-span-6">إضافة أو تعديل عرض</h2>
      <label className="a-lbl sm:col-span-2">المنتج<select required className="a-field mt-1" value={pid} onChange={(e) => pick(e.target.value)}><option value="">اختر منتجاً</option>{products.map((x) => <option key={x.id} value={x.id}>{x.name} — {fmt(x.base_price)}{x.sale_price ? ' (عليه عرض)' : ''}</option>)}</select></label>
      <label className="a-lbl">نسبة الخصم %<input inputMode="numeric" dir="ltr" className="a-field mt-1" disabled={!p} value={f.pct} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setF({ ...f, pct: v, price: p && v ? String(Math.round(p.base_price * (1 - Number(v) / 100))) : f.price }) }} placeholder="مثال: 20" /></label>
      <label className="a-lbl">السعر بعد الخصم ₪<input required inputMode="decimal" dir="ltr" className="a-field mt-1" disabled={!p} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value, pct: '' })} /></label>
      <label className="a-lbl">من (اختياري)<input type="datetime-local" dir="ltr" className="a-field mt-1" disabled={!p} value={f.starts} onChange={(e) => setF({ ...f, starts: e.target.value })} /></label>
      <label className="a-lbl">إلى (اختياري)<input type="datetime-local" dir="ltr" className="a-field mt-1" disabled={!p} value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} /></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3"><input type="checkbox" disabled={!p} checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} />إبرازه أيضاً في «منتجات مميزة» بالرئيسية</label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3 lg:justify-end">
        {p && price > 0 && <span className="a-muted">قبل {fmt(p.base_price)} ← بعد <b className="text-[var(--a-ink)]">{fmt(price)}</b>{off > 0 && ` (خصم ${off}%)`}</span>}
        <button className="a-btn a-btn-solid" disabled={!p || pending}>{pending ? '…' : 'حفظ العرض'}</button></div>
      {msg?.error && <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800 sm:col-span-2 lg:col-span-6">{msg.error}</p>}
      {msg?.ok && <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800 sm:col-span-2 lg:col-span-6">تم حفظ العرض</p>}
      <p className="a-muted sm:col-span-2 lg:col-span-6">العرض بيبدأ وبينتهي تلقائياً حسب التاريخ، والسيرفر ما بيحسب سعر العرض برا هالفترة. اتركهم فاضيين لعرض مفتوح لحد ما تنهيه.</p>
    </form>
  )
}
export function EndOfferButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  return <button className="a-btn a-btn-danger !min-h-9" disabled={pending} onClick={() => { if (confirm('إنهاء هذا العرض الآن؟')) start(async () => { await endOffer(id) }) }}>{pending ? '…' : 'إنهاء'}</button>
}
