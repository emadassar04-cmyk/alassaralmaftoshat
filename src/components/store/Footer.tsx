import Link from 'next/link'
import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Logo } from './Logo'
import type { Branch, Category } from '@/lib/types'
import { waLink } from '@/lib/format'
import { SocialIcon, socialLinks, type Social } from '@/lib/social'

const SHOP = [['/shop', 'كل المنتجات'], ['/shop?offers=1', 'العروض'], ['/custom', 'تفصيل على المقاس'], ['/visit', 'احجز زيارة قياس'], ['/about', 'قصة العصار'], ['/contact', 'تواصل معنا'], ['/favorites', 'المفضلة']] as const

export function Footer({ branches, categories = [], social = {} }: { branches: Branch[]; categories?: Category[]; social?: Social }) {
  const links = socialLinks(social)
  return (
    <footer className="relative mt-16 px-2 pb-28 md:px-4 md:pb-6">
      <div className="teal-glass relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] px-5 pb-8 pt-14 text-white/80 md:px-10">
        <div aria-hidden className="absolute -top-32 end-0 h-72 w-72 rounded-full bg-[#c9a227]/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 start-10 h-72 w-72 rounded-full bg-[#22d3ee]/15 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo tone="light" size="lg" />
            <p className="mt-5 max-w-sm text-[15px] leading-8 text-white/75">منذ 1996 ونحن نختار لبيوت غزة مفروشات تجمع الجودة وجمال التفاصيل، ونفصّل ما يناسب مساحتك بالضبط. بيتك يستاهل الأفخم.</p>
            {links.length > 0 && <div className="mt-6 flex gap-2">{links.map((l) => <a key={l.key} href={l.url} target="_blank" rel="noopener" aria-label={l.name} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/5 transition-colors hover:border-[#e0bd4a] hover:text-[#e0bd4a]"><SocialIcon k={l.key} size={17} /></a>)}</div>}
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div><h3 className="text-sm font-bold text-[#e0bd4a]">المتجر</h3><ul className="mt-4 space-y-2.5 text-[14.5px]">{SHOP.map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>)}</ul></div>
            <div><h3 className="text-sm font-bold text-[#e0bd4a]">الأقسام</h3><ul className="mt-4 space-y-2.5 text-[14.5px]">{categories.map((c) => <li key={c.id}><Link href={`/shop?cat=${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}</ul></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {branches.map((b) => (
              <div key={b.id} className="rounded-2xl border border-white/15 bg-white/[.08] p-4">
                <h3 className="font-bold text-white">{b.name}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {b.address && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-[#e0bd4a]" />{b.map_url ? <a href={b.map_url} target="_blank" rel="noopener" className="hover:text-white">{b.address}</a> : b.address}</li>}
                  {b.phone && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-[#e0bd4a]" /><a href={`tel:${b.phone}`} dir="ltr" className="num hover:text-white">{b.phone}</a></li>}
                  <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-[#e0bd4a]" />{b.hours || '8 ص – 8 م السبت–الخميس'}</li>
                </ul>
                {b.whatsapp && <a href={waLink(b.whatsapp, `مرحباً ${b.name}`)} target="_blank" rel="noopener" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-xs font-bold text-white"><MessageCircle size={15} />واتساب الفرع</a>}
              </div>))}
          </div>
        </div>
        <div className="relative mt-10 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 1996–2026 مفروشات العصار. جميع الحقوق محفوظة.</p><p>دير البلح · النصيرات · قطاع غزة</p>
        </div>
      </div>
    </footer>
  )
}
