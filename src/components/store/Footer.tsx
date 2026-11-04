import Link from 'next/link'
import { MapPin, MessageCircle, Phone } from 'lucide-react'
import { Logo } from './Logo'
import type { Branch, Category } from '@/lib/types'
import { waLink } from '@/lib/format'

const SHOP = [['/shop', 'كل المنتجات'], ['/shop?offers=1', 'العروض'], ['/custom', 'تفصيل على المقاس'], ['/about', 'قصة العصار'], ['/branches', 'الفروع'], ['/blog', 'المدونة']] as const

export function Footer({ branches, categories = [] }: { branches: Branch[]; categories?: Category[] }) {
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-16 overflow-hidden bg-charcoal pb-28 pt-20 text-ivory/80 md:pb-12">
      <div aria-hidden className="pointer-events-none absolute -top-40 start-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brown/25 blur-3xl" />
      <div className="container-x relative">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Logo tone="light" size="lg" />
            <p className="mt-5 text-[15px] leading-8 text-ivory/70">منذ 1996 ونحن نختار لبيوت غزة مفروشات تجمع الجودة وجمال التفاصيل، ونفصّل ما يناسب مساحتك بالضبط. بيتك يستاهل الأفخم.</p>
          </div>
          <p className="font-display text-[clamp(1.6rem,3.6vw,2.6rem)] font-light leading-tight text-ivory">بيتك يستاهل <span className="text-gold">الأفخم</span></p>
        </div>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div><h3 className="text-sm font-medium text-gold">المتجر</h3>
            <ul className="mt-4 space-y-2.5 text-[15px]">{SHOP.map(([h, l]) => <li key={h}><Link href={h} className="link-u hover:text-ivory">{l}</Link></li>)}</ul></div>
          <div><h3 className="text-sm font-medium text-gold">الأقسام</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[15px] lg:grid-cols-1">{categories.map((c) => <li key={c.id}><Link href={`/shop?cat=${c.slug}`} className="link-u hover:text-ivory">{c.name}</Link></li>)}</ul></div>
          {branches.map((b) => (
            <div key={b.id}><h3 className="text-sm font-medium text-gold">{b.name}</h3>
              <ul className="mt-4 space-y-3 text-[15px]">
                {b.address && <li className="flex gap-2.5"><MapPin size={17} className="mt-1 shrink-0 text-gold" strokeWidth={1.5} />{b.map_url ? <a href={b.map_url} target="_blank" rel="noopener" className="link-u hover:text-ivory">{b.address}</a> : b.address}</li>}
                {b.phone && <li className="flex gap-2.5"><Phone size={17} className="mt-1 shrink-0 text-gold" strokeWidth={1.5} /><a href={`tel:${b.phone}`} dir="ltr" className="num link-u hover:text-ivory">{b.phone}</a></li>}
                {b.whatsapp && <li className="flex gap-2.5"><MessageCircle size={17} className="mt-1 shrink-0 text-gold" strokeWidth={1.5} /><a href={waLink(b.whatsapp, `مرحباً ${b.name}`)} target="_blank" rel="noopener" className="link-u hover:text-ivory">واتساب الفرع</a></li>}
                {b.hours && <li className="text-sm text-ivory/55">{b.hours}</li>}
              </ul></div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© 1996 – {year} مفروشات العصار. جميع الحقوق محفوظة.</p>
          <p>دير البلح · النصيرات · قطاع غزة</p>
        </div>
      </div>
    </footer>
  )
}
