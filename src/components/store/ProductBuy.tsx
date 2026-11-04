'use client'
import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'

const Facebook = ({ size = 17 }: { size?: number; strokeWidth?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" /></svg>
import type { Product } from '@/lib/types'
import { useCart } from '@/lib/cart'
import { SITE, fmt, unitPrice, unitSuffix, waLink } from '@/lib/format'
import { FavButton } from './FavButton'
import { track } from '@/lib/pixel'
import Link from 'next/link'

export function ProductBuy({ p, image, waPhone }: { p: Product; image: string | null; waPhone: string | null }) {
  const { add } = useCart()
  const variants = p.product_variants
  const [vid, setVid] = useState<string | null>(variants.find((v) => p.is_custom || v.stock > 0)?.id ?? variants[0]?.id ?? null)
  const [qty, setQty] = useState(1); const [copied, setCopied] = useState(false)
  const v = variants.find((x) => x.id === vid) ?? null
  const price = unitPrice(p, v)
  // stock lives on the chosen option, or on the product itself when it has no options (null = not tracked)
  const max = p.is_custom ? 50 : v ? v.stock : p.stock ?? 50
  const soldOut = !p.is_custom && max <= 0
  useEffect(() => { track('ViewContent', { content_ids: [p.id], content_name: p.name, value: unitPrice(p), currency: 'ILS' }) }, [p])
  const colors = useMemo(() => variants, [variants])
  const url = `${SITE}/product/${p.slug}`
  const details = [['اللون', v?.color], ['المقاس', v?.size], ['القماش / الخامة', v?.fabric]].filter(([, x]) => x) as [string, string][]
  const waOrder = `مرحباً مفروشات العصار 👋\nبدي أطلب: ${p.name}${v ? ` (${v.label})` : ''}\nالكمية: ${qty}\nالسعر: ${fmt(price)}\n${url}`
  async function copy() { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-3"><span className="num font-display text-[2.2rem] font-light text-charcoal">{p.is_custom && !unitSuffix(p) && <span className="text-base text-ink-2">يبدأ من </span>}{fmt(price)}{unitSuffix(p) && <span className="text-base text-ink-2">{unitSuffix(p)}</span>}</span>
        {p.sale_price && !v?.price && <><s className="num text-muted">{fmt(p.base_price)}</s><span className="chip num bg-brown text-white">وفّر {fmt(p.base_price - p.sale_price)}</span></>}</div>
      {p.sale_price && !v?.price && p.sale_ends_at && <p className="text-sm text-brown">العرض ساري حتى {new Date(p.sale_ends_at).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long' })}</p>}
      {!p.is_custom && <p className={`flex items-center gap-2 text-sm ${soldOut ? 'text-danger' : 'text-success'}`}><span className={`h-2 w-2 rounded-full ${soldOut ? 'bg-danger' : 'bg-success'}`} />{soldOut ? 'غير متوفر حالياً' : max <= 3 && (v || p.stock != null) ? `متوفر · آخر ${max} قطع` : 'متوفر'}</p>}
      {p.is_custom && <p className="rounded-[var(--radius-md)] bg-sand px-4 py-3 text-sm text-ink-2">السعر النهائي يُحدَّد حسب المقاس والقماش، ونؤكده معك قبل التنفيذ.</p>}
      {variants.length > 0 && (
        <fieldset><legend className="mb-3 text-sm font-medium text-charcoal">اختر الخيار</legend>
          <div className="flex flex-wrap gap-2">{colors.map((x) => {
            const out = !p.is_custom && x.stock <= 0
            return <button key={x.id} type="button" onClick={() => { setVid(x.id); setQty(1) }} aria-pressed={vid === x.id}
              className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${vid === x.id ? 'border-charcoal bg-charcoal text-ivory' : 'border-line bg-white text-charcoal hover:border-charcoal'} ${out ? 'opacity-45 line-through' : ''}`}>{x.label}</button>
          })}</div></fieldset>)}
      {details.length > 0 && <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-line bg-white p-4 text-sm sm:grid-cols-3">{details.map(([k, x]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="mt-0.5 font-medium">{x}</dd></div>)}</dl>}
      {p.is_custom ? (
        <div className="grid gap-2 sm:grid-cols-2"><Link href={`/custom?p=${p.slug}`} className="btn btn-solid">اطلب تفصيل على مقاسك</Link><Link href={`/visit?item=${encodeURIComponent(p.categories?.name ?? '')}`} className="btn">احجز زيارة قياس</Link></div>
      ) : soldOut ? (
        <a className="btn btn-solid w-full" target="_blank" rel="noopener" href={waLink(waPhone, `مرحباً، هل سيتوفر "${p.name}" قريباً؟\n${url}`)}><MessageCircle size={18} />اسألنا متى يتوفر</a>
      ) : (
        <div className="flex gap-3">
          <div className="flex items-center rounded-full border border-line bg-white">
            <button className="h-12 w-12 text-xl" aria-label="إنقاص" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><span className="num w-8 text-center">{qty}</span>
            <button className="h-12 w-12 text-xl disabled:opacity-30" aria-label="زيادة" disabled={qty >= max} onClick={() => setQty((q) => Math.min(Math.max(1, max), q + 1))}>+</button></div>
          <button className="btn btn-solid flex-1" onClick={() => add({ product_id: p.id, variant_id: v?.id ?? null, slug: p.slug, name: p.name, variant_label: v?.label ?? null, image, unit_price: price, qty, is_custom: false })}>أضف للسلة</button>
        </div>)}
      <div className="grid gap-2 sm:grid-cols-2">
        {!p.is_custom && !soldOut && waPhone && <a className="btn !min-h-12 !border-[#1f9d55] !text-[#1f7a45] hover:!bg-[#1f9d55] hover:!text-white" target="_blank" rel="noopener" onClick={() => track('Contact')} href={waLink(waPhone, waOrder)}><MessageCircle size={18} />اطلب مباشرة عبر واتساب</a>}
        <FavButton slug={p.slug} name={p.name} variant="full" />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t hairline pt-5 text-sm text-ink-2">
        <span className="me-1">شارك:</span>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${p.name}\n${url}`)}`} target="_blank" rel="noopener" aria-label="مشاركة على واتساب" className="grid h-10 w-10 place-items-center rounded-full border hairline bg-white hover:border-charcoal"><MessageCircle size={17} strokeWidth={1.6} /></a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener" aria-label="مشاركة على فيسبوك" className="grid h-10 w-10 place-items-center rounded-full border hairline bg-white hover:border-charcoal"><Facebook size={17} strokeWidth={1.6} /></a>
        <button type="button" onClick={copy} aria-label="نسخ الرابط" className="inline-flex h-10 items-center gap-1.5 rounded-full border hairline bg-white px-4 hover:border-charcoal">{copied ? <Check size={16} className="text-success" /> : <Copy size={16} strokeWidth={1.6} />}{copied ? 'تم النسخ' : 'نسخ الرابط'}</button>
      </div>
    </div>
  )
}
