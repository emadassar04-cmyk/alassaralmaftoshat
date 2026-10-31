'use client'
import { useEffect, useMemo, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart'
import { fmt, unitPrice, waLink } from '@/lib/format'
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
      <div className="flex items-baseline gap-3"><span className="font-display text-4xl text-copper-lt">{p.is_custom && 'يبدأ من '}{fmt(price)}</span>
        {p.sale_price && !v?.price && <s className="text-muted">{fmt(p.base_price)}</s>}</div>
      {p.is_custom && <p className="text-sm text-muted">السعر النهائي قد يختلف حسب المقاس والقماش.</p>}
      {variants.length > 0 && (
        <fieldset><legend className="mb-2 text-sm text-muted">الخيارات</legend>
          <div className="flex flex-wrap gap-2">{colors.map((x) => {
            const out = !p.is_custom && x.stock <= 0
            return <button key={x.id} type="button" onClick={() => setVid(x.id)} aria-pressed={vid === x.id}
              className={`border px-3 py-2 text-sm ${vid === x.id ? 'border-copper bg-copper/15 text-copper-lt' : 'border-copper/25 text-cream'} ${out ? 'opacity-50 line-through' : ''}`}>{x.label}</button>
          })}</div></fieldset>)}
      {p.is_custom ? (
        <Link href={`/custom?p=${p.slug}`} className="btn btn-solid w-full">اطلب تفصيل على مقاسك</Link>
      ) : soldOut ? (
        <>
          <p className="border border-copper/30 p-3 text-center text-muted">غير متوفر حالياً</p>
          <a className="btn btn-solid w-full" target="_blank" rel="noopener" href={waLink(waPhone, `مرحباً، هل سيتوفر "${p.name}" قريباً؟`)}>اسألنا على واتساب</a>
        </>
      ) : (
        <div className="flex gap-3">
          <div className="flex items-center border border-copper/30">
            <button className="h-12 w-12 text-xl" aria-label="إنقاص" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><span className="w-8 text-center">{qty}</span>
            <button className="h-12 w-12 text-xl" aria-label="زيادة" onClick={() => setQty((q) => Math.min(Math.max(1, v?.stock ?? 50), q + 1))}>+</button></div>
          <button className="btn btn-solid flex-1" onClick={() => add({ product_id: p.id, variant_id: v?.id ?? null, slug: p.slug, name: p.name, variant_label: v?.label ?? null, image, unit_price: price, qty, is_custom: false })}>أضف للسلة</button>
        </div>)}
      <button type="button" onClick={share} className="inline-flex items-center gap-2 text-sm text-muted hover:text-copper-lt">{added ? <Check size={16} /> : <Share2 size={16} />}{added ? 'تم نسخ الرابط' : 'مشاركة'}</button>
    </div>
  )
}
