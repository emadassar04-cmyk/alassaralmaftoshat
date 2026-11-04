'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Category, Product } from '@/lib/types'
import { GlassProductCard } from './glass/ProductCard'
import { CategoryChip } from './glass/CategoryChip'
import { SortSelect } from './glass/SortSelect'
import { GlassCard } from './glass/GlassCard'
import { inStock, unitPrice } from '@/lib/format'

const norm = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْ]/g, '').toLowerCase()

const PAGE = 24
export function ShopClient({ products, categories, wa = null }: { products: Product[]; categories: Category[]; wa?: string | null }) {
  const [cat, setCat] = useState('all')
  const [color, setColor] = useState('all')
  const [maxPrice, setMaxPrice] = useState(0)
  const [offers, setOffers] = useState(false)
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(false)
  const [onlyAvail, setOnlyAvail] = useState(false)
  const [shown, setShown] = useState(PAGE)
  const [sort, setSort] = useState('default')
  const searchRef = useRef<HTMLInputElement>(null)
  // URL filters (?cat=…&offers=1&q=…) are read after hydration so the page stays fully static (no Suspense bailout / layout shift)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const u = new URLSearchParams(location.search)
    if (u.get('cat')) setCat(u.get('cat')!); if (u.get('offers') === '1') setOffers(true); if (u.get('q')) setQ(u.get('q')!)
    if (u.get('focus') === 'search') searchRef.current?.focus()
    if (u.get('sort') === 'new') setSort('new')
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  const price = (p: Product) => Math.min(...(p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)]))
  const top = Math.ceil(Math.max(100, ...products.map(price)) / 50) * 50
  const colors = useMemo(() => [...new Set(products.flatMap((p) => p.product_variants.map((v) => v.color).filter(Boolean) as string[]))], [products])
  const list = useMemo(() => {
    const nq = norm(q.trim())
    let l = products.filter((p) => (cat === 'all' || p.categories?.slug === cat) && (color === 'all' || p.product_variants.some((v) => v.color === color))
      && (!maxPrice || price(p) <= maxPrice) && (!offers || p.sale_price) && (!onlyAvail || inStock(p))
      && (!nq || norm(`${p.name} ${p.description ?? ''} ${p.categories?.name ?? ''}`).includes(nq)))
    if (sort === 'asc') l = [...l].sort((a, b) => price(a) - price(b))
    if (sort === 'desc') l = [...l].sort((a, b) => price(b) - price(a))
    if (sort === 'new') l = [...l].sort((a, b) => Date.parse(b.created_at ?? '0') - Date.parse(a.created_at ?? '0'))
    return l
  }, [products, cat, color, maxPrice, offers, sort, q, onlyAvail])
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setShown(PAGE) }, [cat, color, maxPrice, offers, sort, q, onlyAvail])
  /* eslint-enable react-hooks/set-state-in-effect */
  const active = (color !== 'all' ? 1 : 0) + (maxPrice ? 1 : 0) + (offers ? 1 : 0) + (onlyAvail ? 1 : 0)
  const reset = () => { setCat('all'); setColor('all'); setMaxPrice(0); setOffers(false); setOnlyAvail(false); setQ(''); setSort('default') }
  return (
    <div className="container-x pb-16">
      <GlassCard className="relative z-10 -mt-8 space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="glass relative flex h-12 flex-1 items-center rounded-2xl !shadow-none">
            <span className="sr-only">ابحث في المنتجات</span>
            <Search size={18} className="pointer-events-none absolute start-4 text-charcoal/60" />
            <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث: ستائر، مخدة، فرشة طبية…" className="h-full w-full bg-transparent ps-11 pe-4 text-[15px] text-charcoal outline-none placeholder:text-charcoal/50" />
          </label>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <button type="button" onClick={() => setFilters((f) => !f)} aria-expanded={filters} className={`glass flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-medium !shadow-none transition-colors duration-200 hover:bg-white/70 ${filters ? '!bg-white/80' : ''}`}>
              <SlidersHorizontal size={17} />الفلاتر{active > 0 && <span className="num gold-grad grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold">{active}</span>}</button>
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>
        {filters && (
          <div className="grid gap-4 rounded-2xl bg-white/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-charcoal/70">اللون<select className="field mt-1.5 !bg-white/80" value={color} onChange={(e) => setColor(e.target.value)}><option value="all">كل الألوان</option>{colors.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="text-sm text-charcoal/70">أقصى سعر: <span className="num font-bold text-charcoal">{maxPrice ? `${maxPrice} ₪` : 'بدون حد'}</span><input type="range" min={0} max={top} step={50} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-4 w-full accent-[#c9a227]" /></label>
            <label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} className="h-5 w-5 accent-[#c9a227]" />العروض فقط</label>
            <label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} className="h-5 w-5 accent-[#c9a227]" />المتوفر فقط</label>
          </div>
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-5 md:px-5" role="group" aria-label="الأقسام">
          {[{ slug: 'all', name: 'كل المنتجات' }, ...categories].map((c) => <CategoryChip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>{c.name}</CategoryChip>)}
        </div>
      </GlassCard>
      <div className="mt-6 flex items-center justify-between text-sm text-charcoal/70"><p aria-live="polite"><b className="num text-charcoal">{list.length}</b> منتج</p>
        {(active > 0 || q || cat !== 'all') && <button onClick={reset} className="inline-flex items-center gap-1 font-medium text-[#8f6f0f] hover:underline"><X size={14} />مسح الكل</button>}</div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.slice(0, shown).map((p, i) => <GlassProductCard key={p.id} p={p} i={i} priority={i < 3} wa={wa} />)}</div>
      {list.length > shown && <div className="mt-12 flex flex-col items-center gap-3"><p className="num text-sm text-charcoal/70">عرض {shown} من {list.length}</p><button onClick={() => setShown((n) => n + PAGE)} className="glass rounded-full px-8 py-3 font-medium hover:bg-white/70">عرض المزيد</button></div>}
      {list.length === 0 && (
        <GlassCard className="mt-4 flex flex-col items-center px-6 py-16 text-center">
          <span className="gold-grad grid h-14 w-14 place-items-center rounded-full"><Search size={22} strokeWidth={1.8} /></span>
          <p className="mt-5 text-xl font-bold">لم نجد منتجات بهذه المواصفات</p>
          <p className="mt-2 text-charcoal/70">جرّب كلمة أخرى أو امسح الفلاتر، أو راسلنا وسنساعدك نلاقي المطلوب.</p>
          <button onClick={reset} className="gold-grad mt-6 rounded-full px-7 py-3 font-bold">عرض كل المنتجات</button>
        </GlassCard>
      )}
    </div>
  )
}
