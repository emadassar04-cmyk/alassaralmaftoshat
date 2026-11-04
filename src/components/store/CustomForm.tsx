'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import { MeasureFields } from './MeasureFields'
import { useCart } from '@/lib/cart'
import { fmt, measuredPrice, unitPrice, unitSuffix } from '@/lib/format'
import { ImagePlus, X } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { toWebp } from '@/lib/image'

export function CustomForm({ products }: { products: Product[] }) {
  const router = useRouter(); const { add, setOpen } = useCart()
  const [slug, setSlug] = useState(products[0]?.slug ?? '')
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const q = new URLSearchParams(location.search).get('p'); if (q && products.some((x) => x.slug === q)) setSlug(q) }, [products])
  /* eslint-enable react-hooks/set-state-in-effect */
  const p = products.find((x) => x.slug === slug)
  const [vid, setVid] = useState<string | null>(null)
  const [m, setM] = useState<Record<string, string>>({}); const [notes, setNotes] = useState(''); const [qty, setQty] = useState(1)
  const [ref, setRef] = useState<{ path: string; preview: string } | null>(null); const [up, setUp] = useState(''); const [upBusy, setUpBusy] = useState(false)
  const v = p?.product_variants.find((x) => x.id === (vid ?? p.product_variants[0]?.id)) ?? null
  if (!p) return <p className="py-20 text-center text-muted">لا توجد منتجات تفصيل حالياً.</p>
  const calc = measuredPrice(p, v, m)
  const area = p.measurement_schema?.pricing?.type === 'area'
  // Reference photo: compressed in the browser, uploaded to a private bucket (visitors can only add files, never read them).
  async function attach(file: File | undefined) {
    if (!file) return; setUp('')
    if (!file.type.startsWith('image/')) { setUp('اختر صورة فقط'); return }
    setUpBusy(true)
    try {
      const blob = await toWebp(file, 1400, 0.78)
      if (blob.size > 2 * 1024 * 1024) throw new Error('big')
      const path = `refs/${crypto.randomUUID()}.webp`
      const { error } = await supabaseBrowser().storage.from('custom-refs').upload(path, blob, { contentType: 'image/webp', upsert: false })
      if (error) throw error
      setRef({ path, preview: URL.createObjectURL(blob) })
    } catch { setUp('تعذّر رفع الصورة. جرّب صورة أصغر أو أرسلها على واتساب بعد الطلب.') } finally { setUpBusy(false) }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!p) return
    if (area && calc.price == null) return
    const meas = { ...m, ...(notes ? { 'ملاحظات': notes } : {}), ...(ref ? { 'صورة مرجعية': ref.path } : {}) }
    add({ product_id: p.id, variant_id: v?.id ?? null, slug: p.slug, name: p.name, variant_label: v?.label ?? null, image: p.product_images[0]?.url ?? null,
      unit_price: calc.price ?? unitPrice(p, v), qty, is_custom: true, measurements: meas })
    setOpen(false); router.push('/checkout')
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">
      <fieldset><legend className="mb-3 font-display text-2xl font-light text-charcoal">1. ماذا تريد أن نفصّل؟</legend>
        <div className="grid gap-2 sm:grid-cols-2">{products.map((x) => (
          <button type="button" key={x.id} aria-pressed={slug === x.slug} onClick={() => { setSlug(x.slug); setVid(null); setM({}) }}
            className={`rounded-[var(--radius-md)] border bg-white p-5 text-start transition-colors hover:border-brown ${slug === x.slug ? 'border-brown !bg-sand ring-1 ring-brown' : 'border-line'}`}><span className="font-display text-xl">{x.name}</span><br /><span className="text-sm text-muted">{unitSuffix(x) ? `${fmt(unitPrice(x))}${unitSuffix(x)}` : `يبدأ من ${fmt(unitPrice(x))}`}</span></button>))}</div></fieldset>
      {p.product_variants.length > 1 && (
        <fieldset><legend className="mb-3 font-display text-2xl font-light text-charcoal">2. نوع القماش</legend>
          <div className="flex flex-wrap gap-2">{p.product_variants.map((x) => <button type="button" key={x.id} onClick={() => setVid(x.id)} aria-pressed={v?.id === x.id}
            className={`rounded-full border bg-white px-5 py-2.5 transition-colors ${v?.id === x.id ? 'border-brown bg-sand text-brown' : 'border-line'}`}>{x.label} · {fmt(x.price ?? p.base_price)}{unitSuffix(p)}</button>)}</div></fieldset>)}
      {p.measurement_schema && <fieldset><legend className="mb-3 font-display text-2xl font-light text-charcoal">القياسات</legend><MeasureFields key={p.id} schema={p.measurement_schema} value={m} onChange={setM} /></fieldset>}
      <div className="space-y-2"><p className="text-sm text-ink-2">صورة مرجعية <span className="text-muted">(اختياري: صورة المكان أو شكل بدك تقليده)</span></p>
        {ref ? <div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={ref.preview} alt="الصورة المرفقة" className="h-20 w-20 rounded-[var(--radius-md)] object-cover" /><button type="button" onClick={() => setRef(null)} className="btn !min-h-10 !px-4 text-sm"><X size={15} />إزالة</button></div>
          : <label className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-line bg-white p-4 text-sm transition-colors hover:border-brown ${upBusy ? 'opacity-60' : ''}`}><ImagePlus size={20} className="text-brown" strokeWidth={1.5} />{upBusy ? 'جارٍ الرفع…' : 'أضف صورة من جهازك'}<input type="file" accept="image/*" className="sr-only" disabled={upBusy} onChange={(e) => void attach(e.target.files?.[0])} /></label>}
        {up && <p role="alert" className="text-sm text-danger">{up}</p>}</div>
      <label className="block text-sm text-muted">ملاحظات (اختياري)<textarea className="field mt-1 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {area ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 p-5" aria-live="polite">
          {calc.price != null && calc.area != null ? <>
            <p className="num text-sm text-ink-2">{calc.l} م × {calc.w} م × {fmt(calc.rate)} للمتر المربع{qty > 1 ? ` × ${qty}` : ''}</p>
            <p className="num font-display text-3xl font-light text-charcoal">{fmt(calc.price * qty)}</p>
          </> : <p className="text-sm text-ink-2">أدخل الطول والعرض بالمتر ليظهر السعر ({fmt(calc.rate)} للمتر المربع).</p>}
        </div>
      ) : <p className="rounded-[var(--radius-md)] border border-line bg-white p-3 text-sm text-muted">يمكنك إرسال صورة المكان على واتساب بعد إرسال الطلب لنراجع القياسات معك. السعر النهائي قد يختلف حسب المقاس والقماش.</p>}
      <div className="flex items-center gap-3"><label className="text-sm text-muted">الكمية <input type="number" min={1} max={20} className="field ms-2 inline-block w-24" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></label>
        <button className="btn btn-solid flex-1" disabled={area && calc.price == null}>متابعة إلى إتمام الطلب</button></div>
    </form>
  )
}
