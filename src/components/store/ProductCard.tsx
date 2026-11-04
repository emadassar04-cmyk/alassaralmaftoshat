import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import type { Product } from '@/lib/types'
import { SITE, fmt, inStock, unitPrice, unitSuffix, waLink } from '@/lib/format'
import { QuickAdd } from './QuickAdd'
import { FavButton } from './FavButton'

export function ProductCard({ p, priority = false, level = 3, wa = null }: { p: Product; priority?: boolean; level?: 2 | 3; wa?: string | null }) {
  const H = `h${level}` as 'h2' | 'h3'
  const imgs = [...p.product_images].sort((a, b) => a.sort - b.sort)
  const [img, img2] = imgs
  const prices = p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]
  const from = Math.min(...prices)
  const ranged = p.is_custom || new Set(prices).size > 1
  const available = inStock(p)
  const simple = !p.is_custom && p.product_variants.length === 0
  const low = simple && p.stock != null && p.stock > 0 && p.stock <= 3
  const off = p.sale_price && !p.is_custom ? Math.round((1 - p.sale_price / p.base_price) * 100) : 0
  return (
    <article className="group relative">
      <Link href={`/product/${p.slug}`} className="block" aria-label={p.name}>
        <div className="media aspect-[4/5]">
          {img && <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width:640px) 70vw, (max-width:1024px) 33vw, 25vw" preload={priority} fetchPriority={priority ? 'high' : 'auto'} className={`object-cover ${img2 ? 'group-hover:opacity-0' : ''} ${available ? '' : 'grayscale-[40%]'}`} />}
          {img2 && <Image src={img2.url} alt="" fill sizes="(max-width:640px) 70vw, 25vw" className="object-cover opacity-0 group-hover:opacity-100" />}
          <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {off > 0 && <span className="chip num bg-brown text-white">خصم {off}%</span>}
            {p.is_custom && <span className="chip bg-white/90 text-charcoal backdrop-blur">تفصيل على المقاس</span>}
            {p.is_bestseller && !off && !p.is_custom && <span className="chip bg-white/90 text-brown backdrop-blur">الأكثر طلباً</span>}
            {!available && <span className="chip bg-charcoal/85 text-ivory">غير متوفر حالياً</span>}
            {low && <span className="chip bg-white/90 text-danger backdrop-blur">آخر {p.stock} قطع</span>}
          </div>
          <span className="absolute bottom-3 end-3 hidden translate-y-2 items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-[13px] font-medium text-charcoal opacity-0 shadow-[var(--shadow-soft)] transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex">عرض التفاصيل<ArrowLeft size={14} /></span>
        </div>
      </Link>
      <div className="absolute end-3 top-3 z-10"><FavButton slug={p.slug} name={p.name} /></div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.categories && <p className="text-xs text-muted">{p.categories.name}</p>}
          <H className="mt-1 text-[15.5px] font-medium leading-snug text-charcoal"><Link href={`/product/${p.slug}`} className="transition-colors hover:text-brown">{p.name}</Link></H>
          <p className="num mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[15px]">
            <span className="font-semibold text-brown">{ranged && !unitSuffix(p) && <span className="text-xs font-normal text-ink-2">يبدأ من </span>}{fmt(from)}{unitSuffix(p) && <span className="text-xs font-normal text-ink-2">{unitSuffix(p)}</span>}</span>
            {p.sale_price && !p.is_custom && <s className="text-sm text-muted">{fmt(p.base_price)}</s>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {wa && <a href={waLink(wa, `مرحباً مفروشات العصار 👋\nبدي أطلب: ${p.name}\n${SITE}/product/${p.slug}`)} target="_blank" rel="noopener" aria-label={`اطلب ${p.name} عبر واتساب`}
            className="grid h-10 w-10 place-items-center rounded-full border hairline bg-white text-[#1f9d55] transition-colors hover:border-[#1f9d55]"><MessageCircle size={18} strokeWidth={1.6} /></a>}
          {simple && available && <QuickAdd p={p} image={img?.url ?? null} />}
        </div>
      </div>
    </article>
  )
}
