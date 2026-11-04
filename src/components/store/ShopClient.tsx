'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Category, Product } from '@/lib/types'
import { ProductCard } from './ProductCard'
import { unitPrice } from '@/lib/format'

const norm = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْ]/g, '').toLowerCase()

export function ShopClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [cat, setCat] = useState('all')
  const [color, setColor] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0)
  const [offers, setOffers] = useState(false)
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  // URL filters (?cat=…&offers=1&q=…) are read after hydration so the page stays fully static (no Suspense bailout / layout shift)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const u = new URLSearchParams(location.search)
    if (u.get('cat')) setCat(u.get('cat')!); if (u.get('offers') === '1') setOffers(true); if (u.get('q')) setQ(u.get('q')!)
    if (u.get('focus') === 'search') searchRef.current?.focus()
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  const [sort, setSort] = useState('default')
  const price = (p: Product) => Math.min(...(p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]))
  const top = Math.ceil(Math.max(100, ...products.map(price)) / 50) * 50
  const colors = useMemo(() => [...new Set(products.flatMap((p) => p.product_variants.map((v) => v.color).filter(Boolean) as string[]))], [products])
  const list = useMemo(() => {
    const nq = norm(q.trim())
    let l = products.filter((p) => (cat === 'all' || p.categories?.slug === cat) && (color === 'all' || p.product_variants.some((v) => v.color === color))
      && (!maxPrice || price(p) <= maxPrice) && (!offers || p.sale_price)
      && (!nq || norm(`${p.name} ${p.description ?? ''} ${p.categories?.name ?? ''}`).includes(nq)))
    if (sort === 'asc') l = [...l].sort((a, b) => price(a) - price(b))
    if (sort === 'desc') l = [...l].sort((a, b) => price(b) - price(a))
    return l
  }, [products, cat, color, maxPrice, offers, sort, q])
  const active = (color !== 'all' ? 1 : 0) + (maxPrice ? 1 : 0) + (offers ? 1 : 0)
  const reset = () => { setCat('all'); setColor('all'); setMaxPrice(0); setOffers(false); setQ(''); setSort('default') }
  return (
    <div className="container-x py-8 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">ابحث في المنتجات</span>
          <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
          <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: ستائر، مخدة، فرشة طبية…" className="field !rounded-full !ps-11" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setFilters((f) => !f)} aria-expanded={filters} className="btn !min-h-[50px] flex-1 md:flex-none"><SlidersHorizontal size={17} />الفلاتر{active > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-brown px-1 text-[11px] text-white">{active}</span>}</button>
          <label className="flex-1 md:flex-none"><span className="sr-only">الترتيب</span>
            <select className="field !rounded-full" value={sort} onChange={(e) => setSort(e.target.value)}><option value="default">الترتيب: المميز</option><option value="asc">السعر: من الأقل</option><option value="desc">السعر: من الأعلى</option></select></label>
        </div>
      </div>
      {filters && (
        <div className="card mt-4 grid gap-5 p-5 sm:grid-cols-3">
          <label className="text-sm text-ink-2">اللون<select className="field mt-1.5" value={color} onChange={(e) => setColor(e.target.value)}><option value="all">كل الألوان</option>{colors.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm text-ink-2">أقصى سعر: <span className="num text-charcoal">{maxPrice ? `${maxPrice} ₪` : 'بدون حد'}</span><input type="range" min={0} max={top} step={50} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-4 w-full accent-[#76563c]" /></label>
          <label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} className="h-5 w-5 accent-[#76563c]" />العروض فقط</label>
        </div>
      )}
      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="الأقسام">
        {[{ slug: 'all', name: 'الكل' }, ...categories].map((c) => (
          <button key={c.slug} onClick={() => setCat(c.slug)} aria-pressed={cat === c.slug}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-sm transition-colors ${cat === c.slug ? 'border-charcoal bg-charcoal text-ivory' : 'border-line bg-white text-charcoal hover:border-charcoal'}`}>{c.name}</button>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-ink-2"><p aria-live="polite"><span className="num">{list.length}</span> منتج</p>
        {(active > 0 || q || cat !== 'all') && <button onClick={reset} className="inline-flex items-center gap-1 link-u text-brown"><X size={14} />مسح الكل</button>}</div>
      <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">{list.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} level={2} />)}</div>
      {list.length === 0 && (
        <div className="panel mt-4 flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-brown"><Search size={22} strokeWidth={1.5} /></span>
          <p className="t-h3 mt-5">لم نجد منتجات بهذه المواصفات</p>
          <p className="mt-2 text-ink-2">جرّب كلمة أخرى أو امسح الفلاتر، أو راسلنا وسنساعدك نلاقي المطلوب.</p>
          <button onClick={reset} className="btn mt-6">عرض كل المنتجات</button>
        </div>
      )}
    </div>
  )
}
