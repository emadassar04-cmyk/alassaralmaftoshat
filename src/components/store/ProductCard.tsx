import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Product } from '@/lib/types'
import { fmt, unitPrice } from '@/lib/format'
import { QuickAdd } from './QuickAdd'

export function ProductCard({ p, priority = false, level = 3 }: { p: Product; priority?: boolean; level?: 2 | 3 }) {
  const H = `h${level}` as 'h2' | 'h3'
  const imgs = [...p.product_images].sort((a, b) => a.sort - b.sort)
  const [img, img2] = imgs
  const prices = p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]
  const from = Math.min(...prices)
  const ranged = p.is_custom || new Set(prices).size > 1
  const soldOut = !p.is_custom && p.product_variants.length > 0 && p.product_variants.every((v) => v.stock <= 0)
  const simple = !p.is_custom && p.product_variants.length === 0
  return (
    <article className="group relative">
      <Link href={`/product/${p.slug}`} className="block" aria-label={p.name}>
        <div className="media aspect-[4/5]">
          {img && <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width:640px) 70vw, (max-width:1024px) 33vw, 25vw" preload={priority} fetchPriority={priority ? 'high' : 'auto'} className={`object-cover ${img2 ? 'group-hover:opacity-0' : ''}`} />}
          {img2 && <Image src={img2.url} alt="" fill sizes="(max-width:640px) 70vw, 25vw" className="object-cover opacity-0 group-hover:opacity-100" />}
          <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {p.sale_price && !p.is_custom && <span className="chip bg-brown text-white">عرض</span>}
            {p.is_custom && <span className="chip bg-white/90 text-charcoal backdrop-blur">تفصيل على المقاس</span>}
            {p.is_bestseller && !p.sale_price && !p.is_custom && <span className="chip bg-white/90 text-brown backdrop-blur">الأكثر طلباً</span>}
            {soldOut && <span className="chip bg-charcoal/85 text-ivory">غير متوفر حالياً</span>}
          </div>
          <span className="absolute bottom-3 end-3 hidden translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-[13px] font-medium text-charcoal opacity-0 shadow-[var(--shadow-soft)] transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex">عرض المنتج<ArrowLeft size={14} /></span>
        </div>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.categories && <p className="text-xs text-muted">{p.categories.name}</p>}
          <H className="mt-1 text-[15.5px] font-medium leading-snug text-charcoal"><Link href={`/product/${p.slug}`} className="transition-colors hover:text-brown">{p.name}</Link></H>
          <p className="num mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[15px]">
            <span className="font-semibold text-brown">{ranged && <span className="text-xs font-normal text-ink-2">يبدأ من </span>}{fmt(from)}</span>
            {p.sale_price && !p.is_custom && <s className="text-sm text-muted">{fmt(p.base_price)}</s>}
          </p>
        </div>
        {simple && !soldOut && <QuickAdd p={p} image={img?.url ?? null} />}
      </div>
    </article>
  )
}
