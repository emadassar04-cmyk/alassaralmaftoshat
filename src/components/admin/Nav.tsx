'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BadgePercent, BarChart3, Bot, CalendarCheck, FileText, FolderTree, Home, KeyRound, LayoutDashboard, MessagesSquare, Package, Phone, Plug, ScrollText, Settings, ShoppingBag, Star, Tag, UserCircle, Users } from 'lucide-react'
import type { Role } from '@/lib/admin-consts'

type Item = [href: string, label: string, ownerOnly: boolean, icon: typeof Home]
const GROUPS: [string, Item[]][] = [
  ['اليومي', [['/admin', 'الرئيسية', false, LayoutDashboard], ['/admin/orders', 'الطلبات', false, ShoppingBag], ['/admin/visits', 'زيارات القياس', false, CalendarCheck], ['/admin/conversations', 'محادثات البوت', true, MessagesSquare]]],
  ['المتجر', [['/admin/products', 'المنتجات والمخزون', false, Package], ['/admin/categories', 'الأقسام', false, FolderTree], ['/admin/offers', 'العروض', false, BadgePercent], ['/admin/coupons', 'الكوبونات', false, Tag], ['/admin/reviews', 'التقييمات', false, Star], ['/admin/blog', 'المدونة', false, FileText]]],
  ['الزبائن والتقارير', [['/admin/customers', 'الزبائن', true, Users], ['/admin/leads', 'الأرقام (Leads)', true, Phone], ['/admin/reports', 'التقارير', true, BarChart3]]],
  ['الإعدادات', [['/admin/bot', 'بوت تليجرام', true, Bot], ['/admin/integrations', 'الربط', true, Plug], ['/admin/users', 'المستخدمون', true, KeyRound], ['/admin/settings', 'إعدادات المحل', true, Settings], ['/admin/audit', 'السجل', true, ScrollText], ['/admin/account', 'حسابي', false, UserCircle]]],
]
export function Nav({ role }: { role: Role }) {
  const path = usePathname()
  const on = (h: string) => (h === '/admin' ? path === h : path.startsWith(h))
  const groups = GROUPS.map(([g, items]) => [g, items.filter(([, , own]) => role === 'owner' || !own)] as const).filter(([, i]) => i.length)
  return (
    <nav aria-label="أقسام الإدارة" className="no-print">
      {/* mobile: one horizontal row of chips */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3 md:hidden">
        {groups.flatMap(([, items]) => items).map(([h, l, , I]) => (
          <Link key={h} href={h} aria-current={on(h) ? 'page' : undefined} className="a-nav-item shrink-0 whitespace-nowrap !py-2 before:!hidden"><I size={16} strokeWidth={1.6} />{l}</Link>))}
      </div>
      {/* desktop: grouped sidebar */}
      <div className="hidden space-y-5 px-3 md:block">
        {groups.map(([g, items]) => (
          <div key={g}>
            <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-[#8d8577]">{g}</p>
            <ul className="space-y-0.5">{items.map(([h, l, , I]) => (
              <li key={h}><Link href={h} aria-current={on(h) ? 'page' : undefined} className="a-nav-item"><I size={17} strokeWidth={1.6} />{l}</Link></li>))}</ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
