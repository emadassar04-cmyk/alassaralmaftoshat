import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { requireStaff } from '@/lib/admin'
import { logout } from '../actions'
import { Nav } from '@/components/admin/Nav'
import { Mark } from '@/components/store/Logo'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff()
  const who = staff.name ?? staff.email
  return (
    <div className="admin">
      <div className="flex flex-col md:flex-row">
        <aside className="a-side no-print md:sticky md:top-0 md:flex md:h-svh md:w-64 md:shrink-0 md:flex-col md:overflow-y-auto">
          <div className="flex items-center justify-between gap-3 p-4 md:block md:p-5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Mark className="h-9 w-9 text-[#b99a72]" />
              <span className="leading-none"><span className="block font-display text-2xl font-medium text-[#faf9f6]">العصار</span><span className="mt-1 block text-[9px] tracking-[0.35em] text-[#b99a72]" dir="ltr">ADMIN · 1996</span></span>
            </Link>
            <div className="flex items-center gap-2.5 md:mt-6 md:rounded-xl md:bg-white/5 md:p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b99a72] font-display text-sm text-[#28251f]">{who.trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 text-xs leading-5"><span className="block max-w-36 truncate text-[#faf9f6]">{who}</span><span className="text-[#a59d90]">{staff.role === 'owner' ? 'المالك' : 'مشرف بضاعة'}</span></span>
            </div>
          </div>
          <Nav role={staff.role} />
          <div className="mt-auto hidden space-y-1 p-3 md:block">
            <a href="/" target="_blank" rel="noopener" className="a-nav-item"><ExternalLink size={17} strokeWidth={1.6} />عرض المتجر</a>
            <form action={logout}><button className="a-nav-item w-full"><LogOut size={17} strokeWidth={1.6} />تسجيل الخروج</button></form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-5 p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-[1240px] space-y-5">{children}
            <form action={logout} className="no-print md:hidden"><button className="a-btn w-full"><LogOut size={16} />تسجيل الخروج</button></form>
          </div>
        </main>
      </div>
    </div>
  )
}
