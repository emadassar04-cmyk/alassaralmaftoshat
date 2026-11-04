'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Heart, Menu, Ruler, Search, ShoppingBag, X } from 'lucide-react'
import { Logo } from './Logo'
import { useCart } from '@/lib/cart'
import { useFavorites } from '@/lib/favorites'

const LINKS = [['/shop?offers=1', 'العروض'], ['/custom', 'تفصيل على المقاس'], ['/about', 'قصتنا'], ['/branches', 'الفروع'], ['/contact', 'تواصل معنا']] as const
type Cat = { slug: string; name: string }

export function Header({ categories = [] }: { categories?: Cat[] }) {
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const path = usePathname()
  const { count, setOpen } = useCart()
  const fav = useFavorites()
  useEffect(() => { const on = () => setScrolled(window.scrollY > 8); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on) }, [])
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menu])
  const on = (h: string) => !h.includes('?') && (path === h || path.startsWith(`${h}/`))
  const cats = [...categories.map((c) => [`/shop?cat=${c.slug}`, c.name] as const), ['/shop', 'كل المنتجات'] as const]
  const iconBtn = 'relative grid h-11 w-11 place-items-center rounded-full transition-colors duration-200 hover:bg-white/60'
  return (
    <>
      <div className="glass !rounded-none !border-x-0 !border-t-0 !shadow-none text-[12.5px] text-charcoal/80">
        <p className="container-x flex h-9 items-center justify-center gap-2.5 text-center font-medium">
          <span>خبرة منذ 1996</span><span className="text-[#c9a227]">·</span><span>فرعين دير البلح والنصيرات</span><span className="hidden text-[#c9a227] sm:inline">·</span><span className="hidden sm:inline">تفصيل على المقاس</span>
        </p>
      </div>
      <header className="sticky top-0 z-40 px-2 pt-2 md:px-4">
        <div className={`glass mx-auto max-w-[1320px] rounded-3xl transition-[background,box-shadow] duration-300 ${scrolled ? '!bg-[rgba(250,247,240,.9)] shadow-[0_12px_40px_-12px_rgba(40,30,10,.25)]' : ''}`}>
          <div className="flex h-[64px] items-center justify-between gap-4 px-4 md:px-6">
            <Logo />
            <nav className="hidden items-center gap-0.5 lg:flex" aria-label="روابط">
              {LINKS.map(([h, l]) => <Link key={h} href={h} aria-current={on(h) ? 'page' : undefined} className={`rounded-full px-3.5 py-2 text-[14.5px] font-medium transition-colors duration-200 hover:bg-white/60 ${on(h) ? 'bg-white/70 text-charcoal' : 'text-charcoal/80'}`}>{l}</Link>)}
            </nav>
            <div className="flex items-center gap-0.5">
              <Link href="/shop?focus=search" className={iconBtn} aria-label="ابحث في المنتجات"><Search size={20} strokeWidth={1.7} /></Link>
              <Link href="/favorites" className={`${iconBtn} hidden sm:grid`} aria-label={`المفضلة${fav.count ? ` (${fav.count})` : ''}`}><Heart size={20} strokeWidth={1.7} />
                {fav.count > 0 && <span className="num absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-charcoal px-1 text-[10px] font-bold text-white">{fav.count}</span>}</Link>
              <button className={iconBtn} aria-label={`السلة${count ? ` (${count})` : ''}`} onClick={() => setOpen(true)}><ShoppingBag size={20} strokeWidth={1.7} />
                {count > 0 && <span className="num gold-grad absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold">{count}</span>}</button>
              <Link href="/custom" className="gold-grad ms-2 hidden h-11 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-[0_8px_20px_-8px_rgba(201,162,39,.8)] transition-transform duration-200 hover:-translate-y-0.5 md:inline-flex"><Ruler size={16} />اطلب تفصيل</Link>
              <button className={`${iconBtn} lg:hidden`} aria-label="القائمة" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={22} strokeWidth={1.7} /></button>
            </div>
          </div>
          {cats.length > 1 && <nav aria-label="الأقسام" className="no-scrollbar hidden items-center gap-1 overflow-x-auto border-t border-white/60 px-4 py-2 md:flex md:px-6">
            {cats.map(([h, l]) => <Link key={h} href={h} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] text-charcoal/75 transition-colors duration-200 hover:bg-white/60 hover:text-charcoal">{l}</Link>)}
          </nav>}
        </div>
      </header>
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <button className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" aria-label="إغلاق" onClick={() => setMenu(false)} />
            <motion.aside role="dialog" aria-modal="true" aria-label="القائمة" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute inset-y-2 start-2 flex w-[min(88vw,360px)] flex-col overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between border-b border-white/70 p-4"><Logo /><button className="grid h-11 w-11 place-items-center rounded-full bg-white/70" aria-label="إغلاق" onClick={() => setMenu(false)}><X size={20} /></button></div>
              <nav className="flex-1 overflow-y-auto p-4">
                <p className="px-2 text-xs font-bold text-[#8f6f0f]">الأقسام</p>
                <div className="mt-2 grid grid-cols-2 gap-2">{cats.map(([h, l]) => <Link key={h} href={h} onClick={() => setMenu(false)} className="glass rounded-2xl px-3 py-3 text-sm font-medium !shadow-none">{l}</Link>)}</div>
                <ul className="mt-6 divide-y divide-white/70">{[...LINKS, ['/favorites', `المفضلة${fav.count ? ` (${fav.count})` : ''}`] as const].map(([h, l]) => <li key={h}><Link href={h} onClick={() => setMenu(false)} className="flex items-center justify-between px-2 py-3.5 text-[17px] font-medium">{l}<ArrowLeft size={17} className="text-[#c9a227]" /></Link></li>)}</ul>
              </nav>
              <div className="p-4"><Link href="/custom" onClick={() => setMenu(false)} className="gold-grad flex h-12 items-center justify-center gap-2 rounded-2xl font-bold"><Ruler size={17} />اطلب تفصيل</Link></div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
