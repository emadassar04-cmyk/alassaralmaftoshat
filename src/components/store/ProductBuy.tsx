'use client'
import { useEffect, useMemo, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart'
import { fmt, unitPrice, unitSuffix, waLink } from '@/lib/format'
import { track } from '@/lib/pixel'
import Link from 'next/link'

export function ProductBuy({ p, image, waPhone }: { p: Product; image: string | null; waPhone: string | null }) {
  const { add } = useCart()
  const variants = p.product_variants
  const [vid, setVid] = useState<string | null>(variants.find((v) => p.is_custom || v.stock > 0)?.id ?? variants[0]?.id ?? null)
  const [qty, setQty] = useState(1); const [added, setAdded] = useState(false)
  const v = variants.find((x) => x.id === vid) ?? null
  const price = unitPrice(p, v)
  const soldOut = !p.is_custom && (variants.length ? !v || v.stock <= 0 : false)
  useEffect(() => { track('ViewContent', { content_ids: [p.id], content_name: p.name, value: unitPrice(p), currency: 'ILS' }) }, [p])
  const colors = useMemo(() => variants, [variants])
  async function share() {
    const data = { title: p.name, url: location.href }
    if (navigator.share) { try { await navigator.share(data) } catch {} } else { await navigator.clipboard.writeText(location.href); setAdded(true); setTimeout(() => setAdded(false), 1500) }
  }
  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3"><span className="num font-display text-[2.2rem] font-light text-charcoal">{p.is_custom && !unitSuffix(p) && <span className="text-base text-ink-2">يبدأ من </span>}{fmt(price)}{unitSuffix(p) && <span className="text-base text-ink-2">{unitSuffix(p)}</span>}</span>
        {p.sale_price && !v?.price && <><s className="num text-muted">{fmt(p.base_price)}</s><span className="chip bg-brown text-white">عرض</span></>}</div>
      {p.is_custom && <p className="rounded-[var(--radius-md)] bg-sand px-4 py-3 text-sm text-ink-2">السعر النهائي يُحدَّد حسب المقاس والقماش، ونؤكده معك قبل التنفيذ.</p>}
      {variants.length > 0 && (
        <fieldset><legend className="mb-3 text-sm font-medium text-charcoal">اختر الخيار</legend>
          <div className="flex flex-wrap gap-2">{colors.map((x) => {
            const out = !p.is_custom && x.stock <= 0
            return <button key={x.id} type="button" onClick={() => setVid(x.id)} aria-pressed={vid === x.id}
              className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${vid === x.id ? 'border-charcoal bg-charcoal text-ivory' : 'border-line bg-white text-charcoal hover:border-charcoal'} ${out ? 'opacity-45 line-through' : ''}`}>{x.label}</button>
          })}</div></fieldset>)}
      {p.is_custom ? (
        <Link href={`/custom?p=${p.slug}`} className="btn btn-solid w-full">اطلب تفصيل على مقاسك</Link>
      ) : soldOut ? (
        <>
          <p className="rounded-[var(--radius-md)] border border-line bg-white p-3 text-center text-ink-2">غير متوفر حالياً</p>
          <a className="btn btn-solid w-full" target="_blank" rel="noopener" href={waLink(waPhone, `مرحباً، هل سيتوفر "${p.name}" قريباً؟`)}>اسألنا على واتساب</a>
        </>
      ) : (
        <div className="flex gap-3">
          <div className="flex items-center rounded-full border border-line bg-white">
            <button className="h-12 w-12 text-xl" aria-label="إنقاص" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><span className="num w-8 text-center">{qty}</span>
            <button className="h-12 w-12 text-xl" aria-label="زيادة" onClick={() => setQty((q) => Math.min(Math.max(1, v?.stock ?? 50), q + 1))}>+</button></div>
          <button className="btn btn-solid flex-1" onClick={() => add({ product_id: p.id, variant_id: v?.id ?? null, slug: p.slug, name: p.name, variant_label: v?.label ?? null, image, unit_price: price, qty, is_custom: false })}>أضف للسلة</button>
        </div>)}
      <button type="button" onClick={share} className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-brown">{added ? <Check size={16} /> : <Share2 size={16} />}{added ? 'تم نسخ الرابط' : 'مشاركة'}</button>
    </div>
  )
}
