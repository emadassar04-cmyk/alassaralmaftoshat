'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/admin-consts'

const ITEMS: [string, string, boolean][] = [
  ['/admin', 'الرئيسية', false], ['/admin/orders', 'الطلبات', false], ['/admin/products', 'المنتجات', false], ['/admin/coupons', 'العروض والكوبونات', false],
  ['/admin/reviews', 'التقييمات', false], ['/admin/blog', 'المدونة', false], ['/admin/customers', 'الزبائن', true], ['/admin/leads', 'الأرقام (Leads)', true],
  ['/admin/reports', 'التقارير', true], ['/admin/users', 'المستخدمون', true], ['/admin/settings', 'إعدادات المحل', true], ['/admin/audit', 'السجل', true],
]
export function Nav({ role }: { role: Role }) {
  const path = usePathname()
  return (
    <nav aria-label="أقسام الإدارة" className="no-print flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
      {ITEMS.filter(([, , own]) => role === 'owner' || !own).map(([h, l]) => {
        const on = h === '/admin' ? path === h : path.startsWith(h)
        return <Link key={h} href={h} aria-current={on ? 'page' : undefined} className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${on ? 'bg-[#8f6a2e] text-white' : 'text-[var(--a-ink)] hover:bg-[#f1e7d2]'}`}>{l}</Link>
      })}
    </nav>
  )
}
