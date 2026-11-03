'use client'
import { useActionState } from 'react'
import { changePassword } from '@/app/admin/actions'

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePassword, undefined)
  return (
    <form action={action} className="a-card max-w-md space-y-3">
      <label className="a-lbl">كلمة السر الحالية<input name="current" type="password" required autoComplete="current-password" dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">كلمة السر الجديدة (10 أحرف على الأقل)<input name="next" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">تأكيد الجديدة<input name="again" type="password" required minLength={10} autoComplete="new-password" dir="ltr" className="a-field mt-1" /></label>
      {s?.error && <p role="alert" className="rounded-md bg-rose-50 p-2 text-sm text-rose-800">{s.error}</p>}
      {s?.ok && <p role="status" className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">تم تغيير كلمة السر</p>}
      <button className="a-btn a-btn-solid" disabled={pending}>{pending ? '...' : 'تغيير كلمة السر'}</button>
    </form>
  )
}
