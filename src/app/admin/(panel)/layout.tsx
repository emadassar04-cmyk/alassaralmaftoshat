import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import { logout } from '../actions'
import { Nav } from '@/components/admin/Nav'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaff()
  return (
    <div className="admin">
      <div className="mx-auto flex max-w-[1500px] flex-col md:flex-row">
        <aside className="no-print border-b border-[var(--a-line)] bg-[#fffdf8] md:sticky md:top-0 md:h-svh md:w-60 md:shrink-0 md:border-b-0 md:border-e">
          <div className="flex items-center justify-between gap-3 p-4 md:block">
            <Link href="/admin" className="block"><span className="font-display text-3xl text-[#8f6a2e]">العصار</span><span className="block text-[9px] tracking-[0.4em] text-[#8f6a2e]" dir="ltr">ADMIN PANEL</span></Link>
            <div className="text-end text-xs text-[var(--a-mute)] md:mt-3 md:text-start"><p className="truncate">{staff.name ?? staff.email}</p><p>{staff.role === 'owner' ? 'المالك' : 'مشرف بضاعة'}</p></div>
          </div>
          <Nav role={staff.role} />
          <form action={logout} className="hidden p-4 md:block"><button className="a-btn w-full">تسجيل الخروج</button></form>
        </aside>
        <main className="min-w-0 flex-1 space-y-5 p-4 md:p-8">{children}
          <form action={logout} className="no-print md:hidden"><button className="a-btn w-full">تسجيل الخروج</button></form>
        </main>
      </div>
    </div>
  )
}
