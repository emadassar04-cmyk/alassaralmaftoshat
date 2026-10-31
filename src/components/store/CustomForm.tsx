'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import { MeasureFields } from './MeasureFields'
import { useCart } from '@/lib/cart'
import { fmt, unitPrice } from '@/lib/format'

export function CustomForm({ products }: { products: Product[] }) {
  const router = useRouter(); const { add, setOpen } = useCart()
  const [slug, setSlug] = useState(products[0]?.slug ?? '')
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const q = new URLSearchParams(location.search).get('p'); if (q && products.some((x) => x.slug === q)) setSlug(q) }, [products])
  /* eslint-enable react-hooks/set-state-in-effect */
  const p = products.find((x) => x.slug === slug)
  const [vid, setVid] = useState<string | null>(null)
  const [m, setM] = useState<Record<string, string>>({}); const [notes, setNotes] = useState(''); const [qty, setQty] = useState(1)
  const v = p?.product_variants.find((x) => x.id === (vid ?? p.product_variants[0]?.id)) ?? null
  if (!p) return <p className="py-20 text-center text-muted">لا توجد منتجات تفصيل حالياً.</p>
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!p) return
    const meas = { ...m, ...(notes ? { 'ملاحظات': notes } : {}) }
    add({ product_id: p.id, variant_id: v?.id ?? null, slug: p.slug, name: p.name, variant_label: v?.label ?? null, image: p.product_images[0]?.url ?? null,
      unit_price: unitPrice(p, v), qty, is_custom: true, measurements: meas })
    setOpen(false); router.push('/checkout')
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">
      <fieldset><legend className="mb-3 font-display text-2xl text-copper-lt">1. ماذا تريد أن نفصّل؟</legend>
        <div className="grid gap-2 sm:grid-cols-2">{products.map((x) => (
          <button type="button" key={x.id} aria-pressed={slug === x.slug} onClick={() => { setSlug(x.slug); setVid(null); setM({}) }}
            className={`border p-4 text-start transition-colors ${slug === x.slug ? 'border-copper bg-copper/10' : 'border-copper/20'}`}><span className="font-display text-xl">{x.name}</span><br /><span className="text-sm text-muted">يبدأ من {fmt(unitPrice(x))}</span></button>))}</div></fieldset>
      {p.product_variants.length > 1 && (
        <fieldset><legend className="mb-3 font-display text-2xl text-copper-lt">2. نوع القماش</legend>
          <div className="flex flex-wrap gap-2">{p.product_variants.map((x) => <button type="button" key={x.id} onClick={() => setVid(x.id)} aria-pressed={v?.id === x.id}
            className={`border px-4 py-2 ${v?.id === x.id ? 'border-copper bg-copper/15 text-copper-lt' : 'border-copper/25'}`}>{x.label} · {fmt(x.price ?? p.base_price)}</button>)}</div></fieldset>)}
      {p.measurement_schema && <fieldset><legend className="mb-3 font-display text-2xl text-copper-lt">القياسات</legend><MeasureFields key={p.id} schema={p.measurement_schema} value={m} onChange={setM} /></fieldset>}
      <label className="block text-sm text-muted">ملاحظات (اختياري)<textarea className="field mt-1 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <p className="border border-copper/20 bg-night-2 p-3 text-sm text-muted">يمكنك إرسال صورة المكان على واتساب بعد إرسال الطلب لنراجع القياسات معك. السعر النهائي قد يختلف حسب المقاس والقماش.</p>
      <div className="flex items-center gap-3"><label className="text-sm text-muted">الكمية <input type="number" min={1} max={20} className="field ms-2 inline-block w-24" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></label>
        <button className="btn btn-solid flex-1">متابعة إلى إتمام الطلب</button></div>
    </form>
  )
}
