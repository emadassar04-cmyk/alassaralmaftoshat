import Link from 'next/link'
import { Logo } from './Logo'
import type { Branch } from '@/lib/types'
import { waLink } from '@/lib/format'

export function Footer({ branches }: { branches: Branch[] }) {
  return (
    <footer className="mt-12 border-t border-copper/15 bg-night-2 pb-24 pt-14">
      <div className="container-x grid gap-10 md:grid-cols-3">
        <div><Logo /><p className="mt-4 max-w-xs text-sm text-muted">بيتك يستاهل الأفخم. 30 عاماً في خدمة بيوت غزة بالمفروشات الفاخرة والتفصيل على المقاس.</p></div>
        <div><h3 className="font-display text-xl text-copper-lt">روابط</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">{[['/shop', 'المتجر'], ['/custom', 'تفصيل على المقاس'], ['/about', 'قصتنا'], ['/blog', 'المدونة']].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-copper-lt">{l}</Link></li>)}</ul></div>
        <div><h3 className="font-display text-xl text-copper-lt">فروعنا</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">{branches.map((b) => <li key={b.id}><Link href="/branches" className="hover:text-copper-lt">{b.name}</Link>{b.whatsapp && <> · <a href={waLink(b.whatsapp)} className="text-copper" dir="ltr">{b.phone}</a></>}</li>)}</ul></div>
      </div>
      <p className="container-x mt-10 text-xs text-muted">© 1996 – {new Date().getFullYear()} مفروشات العصار · دير البلح والنصيرات</p>
    </footer>
  )
}
