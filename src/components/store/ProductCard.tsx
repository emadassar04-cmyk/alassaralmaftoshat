import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { fmt } from '@/lib/format'

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const img = [...p.product_images].sort((a, b) => a.sort - b.sort)[0]
  const from = p.product_variants.length ? Math.min(...p.product_variants.map((v) => v.price ?? p.sale_price ?? p.base_price)) : p.sale_price ?? p.base_price
  const soldOut = !p.is_custom && p.product_variants.length > 0 && p.product_variants.every((v) => v.stock <= 0)
  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden border border-copper/15 bg-night-2">
        {img && <Image src={img.url} alt={img.alt ?? p.name} fill sizes="(max-width:768px) 50vw, 25vw" priority={priority} className="object-cover transition-transform duration-[1200ms] group-hover:scale-110" />}
        <div className="absolute start-2 top-2 flex flex-col gap-1">
          {p.sale_price && <span className="bg-copper px-2 py-0.5 text-xs font-bold text-night">عرض</span>}
          {p.is_custom && <span className="border border-copper bg-night/80 px-2 py-0.5 text-xs text-copper-lt">تفصيل</span>}
          {soldOut && <span className="bg-night/90 px-2 py-0.5 text-xs text-muted">غير متوفر</span>}
        </div>
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug text-cream group-hover:text-copper-lt">{p.name}</h3>
      <p className="mt-1 text-sm text-copper-lt">
        {p.is_custom && 'يبدأ من '}{fmt(from)}
        {p.sale_price && !p.is_custom && <s className="ms-2 text-muted">{fmt(p.base_price)}</s>}
      </p>
    </Link>
  )
}
