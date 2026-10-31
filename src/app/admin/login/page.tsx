import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = { title: 'تسجيل دخول الإدارة', robots: { index: false, follow: false } }
export default async function Login(props: PageProps<'/admin/login'>) {
  const noAccess = (await props.searchParams).e === 'noaccess'
  return (
    <div className="admin grid place-items-center p-4">
      <div className="a-card w-full max-w-sm space-y-5 !p-7">
        <div className="text-center"><p className="font-display text-4xl text-[#8f6a2e]">العصار</p><p className="text-[10px] tracking-[0.4em] text-[#8f6a2e]" dir="ltr">AL-ASSAR · ADMIN</p></div>
        {noAccess && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800" role="alert">هذا الحساب غير مفعّل للإدارة. تواصل مع المالك.</p>}
        <LoginForm />
      </div>
    </div>
  )
}
