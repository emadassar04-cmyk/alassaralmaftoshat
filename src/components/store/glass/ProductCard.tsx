'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Sofa } from 'lucide-react'
import type { Product } from '@/lib/types'
import { SITE, fmt, inStock, unitPrice, unitSuffix, waLink } from '@/lib/format'
import { FavButton } from '../FavButton'

/** Glass product card: same data and links as the classic card, new presentation. */
export function GlassProductCard({ p, i = 0, priority = false, wa = null }: { p: Product; i?: number; priority?: boolean; wa?: string | null }) {
  const img = [...p.product_images].sort((a, b) => a.sort - b.sort)[0]
  const prices = p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]
  const from = Math.min(...prices); const ranged = p.is_custom || new Set(prices).size > 1
  const available = inStock(p)
  const off = p.sale_price && !p.is_custom ? Math.round((1 - p.sale_price / p.base_price) * 100) : 0
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }} className="glass group relative flex flex-col rounded-3xl p-3 transition-[box-shadow,border-color] duration-300 hover:border-[#e0bd4a]/80 hover:shadow-[0_18px_48px_-12px_rgba(120,90,20,.35)]">
      <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#efe3d0] to-[#d9c6a6]" aria-label={p.name}>
        {img ? <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width:640px) 92vw, (max-width:1024px) 45vw, 24vw" preload={priority} fetchPriority={priority ? 'high' : 'auto'} className={`object-cover transition-transform duration-500 group-hover:scale-[1.06] ${available ? '' : 'grayscale-[40%]'}`} />
          : <span className="absolute inset-0 grid place-items-center text-[#8f6f0f]/50"><Sofa size={48} strokeWidth={1.2} /></span>}
        <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && <span dir="ltr" className="num rounded-full bg-gradient-to-l from-[#c0392b] to-[#c9a227] px-3 py-1 text-xs font-bold text-white shadow">-{off}%</span>}
          {p.is_custom && <span className="glass-strong rounded-full px-3 py-1 text-xs font-medium">تفصيل على المقاس</span>}
          {!available && <span className="rounded-full bg-charcoal/85 px-3 py-1 text-xs text-ivory">غير متوفر</span>}
        </div>
      </Link>
      <div className="absolute end-5 top-5 z-10"><FavButton slug={p.slug} name={p.name} /></div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
        {p.categories && <p className="text-xs font-medium text-charcoal/60">{p.categories.name}</p>}
        <h2 className="mt-1 text-base font-bold leading-snug text-charcoal"><Link href={`/product/${p.slug}`} className="hover:underline">{p.name}</Link></h2>
        <p className="num mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="gold-text text-xl font-extrabold">{ranged && !unitSuffix(p) && <span className="text-xs font-medium text-charcoal/60">يبدأ من </span>}{fmt(from)}{unitSuffix(p) && <span className="text-xs font-medium text-charcoal/60">{unitSuffix(p)}</span>}</span>
          {p.sale_price && !p.is_custom && <s className="text-sm text-charcoal/50">{fmt(p.base_price)}</s>}
        </p>
        <div className="mt-auto pt-4">
          {wa ? <a href={waLink(wa, `مرحباً مفروشات العصار 👋\nبدي أستفسر عن: ${p.name}\n${SITE}/product/${p.slug}`)} target="_blank" rel="noopener"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1f9d55] text-sm font-bold text-white transition-colors duration-200 hover:bg-[#178a49]"><MessageCircle size={18} />استفسر عبر واتساب</a>
            : <Link href={`/product/${p.slug}`} className="gold-grad flex h-11 w-full items-center justify-center rounded-2xl text-sm font-bold">التفاصيل</Link>}
        </div>
      </div>
    </motion.article>
  )
}
