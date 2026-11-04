'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronDown, Heart, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useFavorites } from '@/lib/favorites'
import { Logo } from './Logo'
import { useCart } from '@/lib/cart'

const NAV = [['/shop', 'المتجر'], ['/shop?offers=1', 'العروض'], ['/custom', 'تفصيل على المقاس'], ['/about', 'قصتنا'], ['/branches', 'الفروع'], ['/contact', 'تواصل معنا']] as const
type Cat = { slug: string; name: string }

export function Header({ categories = [] }: { categories?: Cat[] }) {
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const path = usePathname()
  const { count, setOpen } = useCart()
  const fav = useFavorites()
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menu])
  const active = (h: string) => !h.includes('?') && (path === h || path.startsWith(`${h}/`))
  return (
    <>
      <div className="bg-charcoal text-[12.5px] text-ivory/85">
        <p className="container-x flex h-9 items-center justify-center gap-3 text-center">
          <span>خبرة منذ 1996</span><span className="text-gold" aria-hidden>◆</span><span>فرعان في دير البلح والنصيرات</span>
          <span className="hidden text-gold sm:inline" aria-hidden>◆</span><span className="hidden sm:inline">تفصيل حسب المقاس</span>
        </p>
      </div>
      <header className={`sticky top-0 z-40 transition-[background,box-shadow] duration-500 ${scrolled ? 'glass shadow-[0_1px_0_var(--color-line)]' : 'bg-ivory'}`}>
        <div className="container-x flex h-[72px] items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
            <div className="group relative">
              <Link href="/shop" className={`flex items-center gap-1 rounded-full px-3 py-2 text-[15px] xl:px-4 transition-colors hover:text-brown ${active('/shop') ? 'text-brown' : 'text-charcoal'}`}>المتجر<ChevronDown size={15} className="transition-transform group-hover:rotate-180" /></Link>
              {categories.length > 0 && (
                <div className="invisible absolute start-0 top-full w-[440px] pt-3 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="card grid grid-cols-2 gap-1 p-3 shadow-[var(--shadow-lift)]">
                    {categories.map((c) => <Link key={c.slug} href={`/shop?cat=${c.slug}`} className="rounded-[10px] px-3 py-2.5 text-sm text-ink-2 transition-colors hover:bg-sand hover:text-charcoal">{c.name}</Link>)}
                    <Link href="/shop" className="col-span-2 mt-1 flex items-center justify-between rounded-[10px] bg-sand px-3 py-2.5 text-sm font-medium text-brown">كل المنتجات<ArrowLeft size={16} /></Link>
                  </div>
                </div>
              )}
            </div>
            {NAV.slice(1).map(([h, l]) => <Link key={h} href={h} aria-current={active(h) ? 'page' : undefined} className={`rounded-full px-3 py-2 text-[15px] xl:px-4 transition-colors hover:text-brown ${active(h) ? 'text-brown' : 'text-charcoal'}`}>{l}</Link>)}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/shop?focus=search" className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sand" aria-label="ابحث في المنتجات"><Search size={20} strokeWidth={1.6} /></Link>
            <Link href="/favorites" className="relative hidden h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sand sm:grid" aria-label={`المفضلة${fav.count ? ` (${fav.count})` : ''}`}>
              <Heart size={20} strokeWidth={1.6} />
              {fav.count > 0 && <span className="num absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-charcoal px-1 text-[10px] font-semibold text-white">{fav.count}</span>}
            </Link>
            <button className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-sand" aria-label={`السلة${count ? ` (${count})` : ''}`} onClick={() => setOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.6} />
              {count > 0 && <span className="num absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brown px-1 text-[10px] font-semibold text-white">{count}</span>}
            </button>
            <Link href="/custom" className="btn btn-solid ms-2 hidden !min-h-11 !px-5 !text-sm xl:inline-flex">اطلب تفصيل</Link>
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand lg:hidden" aria-label="القائمة" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={22} strokeWidth={1.6} /></button>
          </div>
        </div>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ivory lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة">
          <div className="container-x flex h-[72px] items-center justify-between border-b hairline"><Logo /><button className="grid h-11 w-11 place-items-center rounded-full bg-sand" aria-label="إغلاق" onClick={() => setMenu(false)}><X size={20} /></button></div>
          <nav className="container-x flex-1 overflow-y-auto py-6">
            <ul className="divide-y divide-line">
              {NAV.map(([h, l]) => <li key={h}><Link href={h} onClick={() => setMenu(false)} className="flex items-center justify-between py-4 font-display text-2xl font-light">{l}<ArrowLeft size={18} className="text-gold" /></Link></li>)}
              <li><Link href="/favorites" onClick={() => setMenu(false)} className="flex items-center justify-between py-4 font-display text-2xl font-light">المفضلة {fav.count > 0 && `(${fav.count})`}<Heart size={18} className="text-gold" /></Link></li>
            </ul>
            {categories.length > 0 && <>
              <p className="eyebrow mt-8">الأقسام</p>
              <div className="mt-4 flex flex-wrap gap-2">{categories.map((c) => <Link key={c.slug} href={`/shop?cat=${c.slug}`} onClick={() => setMenu(false)} className="rounded-full border hairline bg-white px-4 py-2 text-sm">{c.name}</Link>)}</div>
            </>}
          </nav>
          <div className="container-x pb-8"><Link href="/custom" onClick={() => setMenu(false)} className="btn btn-solid w-full">صمّم مفروشاتك على مقاسك</Link></div>
        </div>
      )}
    </>
  )
}
