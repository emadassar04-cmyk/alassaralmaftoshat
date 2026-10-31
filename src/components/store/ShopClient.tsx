'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Category, Product } from '@/lib/types'
import { ProductCard } from './ProductCard'
import { unitPrice } from '@/lib/format'

export function ShopClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [cat, setCat] = useState('all')
  const [color, setColor] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0)
  const [offers, setOffers] = useState(false)
  // URL filters (?cat=…&offers=1) are read after hydration so the page stays fully static (no Suspense bailout / layout shift)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { const q = new URLSearchParams(location.search); if (q.get('cat')) setCat(q.get('cat')!); if (q.get('offers') === '1') setOffers(true) }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  const [sort, setSort] = useState('default')
  const price = (p: Product) => Math.min(...(p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]))
  const top = Math.ceil(Math.max(100, ...products.map(price)) / 50) * 50
  const colors = useMemo(() => [...new Set(products.flatMap((p) => p.product_variants.map((v) => v.color).filter(Boolean) as string[]))], [products])
  const list = useMemo(() => {
    let l = products.filter((p) => (cat === 'all' || p.categories?.slug === cat) && (color === 'all' || p.product_variants.some((v) => v.color === color))
      && (!maxPrice || price(p) <= maxPrice) && (!offers || p.sale_price))
    if (sort === 'asc') l = [...l].sort((a, b) => price(a) - price(b))
    if (sort === 'desc') l = [...l].sort((a, b) => price(b) - price(a))
    return l
  }, [products, cat, color, maxPrice, offers, sort])
  return (
    <div className="container-x py-10">
      <h1 className="font-display copper-text text-center text-5xl">المتجر</h1>
      <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2">
        {[{ slug: 'all', name: 'الكل' }, ...categories].map((c) => (
          <button key={c.slug} onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug}
            className={`shrink-0 border px-4 py-2 text-sm transition-colors ${cat === c.slug ? 'border-copper bg-copper text-night' : 'border-copper/30 text-cream hover:border-copper'}`}>{c.name}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-muted">اللون<select className="field mt-1" value={color} onChange={(e) => setColor(e.target.value)}><option value="all">كل الألوان</option>{colors.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="text-sm text-muted">أقصى سعر: {maxPrice ? `${maxPrice} ₪` : 'بدون حد'}<input type="range" min={0} max={top} step={50} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-3 w-full accent-[#c8a36a]" /></label>
        <label className="text-sm text-muted">الترتيب<select className="field mt-1" value={sort} onChange={(e) => setSort(e.target.value)}><option value="default">الافتراضي</option><option value="asc">السعر: من الأقل</option><option value="desc">السعر: من الأعلى</option></select></label>
        <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} className="h-5 w-5 accent-[#c8a36a]" />العروض فقط</label>
      </div>
      <p className="mt-6 text-sm text-muted">{list.length} منتج</p>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{list.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} level={2} />)}</div>
      {list.length === 0 && <p className="py-20 text-center text-muted">لا توجد منتجات بهذه المواصفات.</p>}
    </div>
  )
}
