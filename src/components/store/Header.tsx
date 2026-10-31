'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { Logo } from './Logo'
import { useCart } from '@/lib/cart'

const NAV = [['/shop', 'المتجر'], ['/custom', 'تفصيل على المقاس'], ['/about', 'قصتنا'], ['/branches', 'الفرعان'], ['/blog', 'المدونة']] as const

export function Header() {
  const [menu, setMenu] = useState(false)
  const { count, setOpen } = useCart()
  return (
    <header className="sticky top-0 z-40 border-b border-copper/15 bg-night/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <button className="p-2 md:hidden" aria-label="القائمة" onClick={() => setMenu(true)}><Menu /></button>
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="التنقل الرئيسي">
          {NAV.map(([h, l]) => <Link key={h} href={h} className="text-muted transition-colors hover:text-copper-lt">{l}</Link>)}
        </nav>
        <button className="relative p-2" aria-label="السلة" onClick={() => setOpen(true)}>
          <ShoppingBag />
          {count > 0 && <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-copper px-1 text-xs font-bold text-night">{count}</span>}
        </button>
      </div>
      {menu && (
        <div className="fixed inset-0 z-50 bg-night/95 p-6 md:hidden" role="dialog" aria-modal="true">
          <button className="mb-8 p-2" aria-label="إغلاق" onClick={() => setMenu(false)}><X /></button>
          <nav className="flex flex-col gap-6 font-display text-3xl">
            {NAV.map(([h, l]) => <Link key={h} href={h} onClick={() => setMenu(false)} className="copper-text">{l}</Link>)}
          </nav>
        </div>
      )}
    </header>
  )
}
