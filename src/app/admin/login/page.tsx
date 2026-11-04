import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'
import { Mark } from '@/components/store/Logo'

export const metadata: Metadata = { title: 'تسجيل دخول الإدارة', robots: { index: false, follow: false } }
export default async function Login(props: PageProps<'/admin/login'>) {
  const noAccess = (await props.searchParams).e === 'noaccess'
  return (
    <div className="admin grid place-items-center p-4">
      <div className="a-card w-full max-w-sm space-y-6 !p-8 shadow-[0_30px_60px_-30px_rgba(40,37,31,.35)]">
        <div className="flex flex-col items-center text-center"><Mark className="h-14 w-14 text-[var(--a-copper)]" /><p className="mt-3 font-display text-3xl font-medium">العصار</p><p className="mt-1 text-[10px] tracking-[0.4em] text-[var(--a-gold)]" dir="ltr">ADMIN · 1996</p><p className="a-muted mt-4">تسجيل الدخول للوحة التحكم</p></div>
        {noAccess && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800" role="alert">هذا الحساب غير مفعّل للإدارة. تواصل مع المالك.</p>}
        <LoginForm />
      </div>
    </div>
  )
}
