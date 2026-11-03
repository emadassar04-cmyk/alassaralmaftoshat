'use client'
import { useActionState } from 'react'
import { login } from '@/app/admin/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  return (
    <form action={action} className="space-y-4">
      <label className="a-lbl">الإيميل<input name="email" type="email" required autoComplete="username" dir="ltr" className="a-field mt-1" /></label>
      <label className="a-lbl">كلمة السر<input name="password" type="password" required autoComplete="current-password" dir="ltr" className="a-field mt-1" /></label>
      {state?.error && <p className="text-sm text-rose-700" role="alert">{state.error}</p>}
      <button className="a-btn a-btn-solid w-full" disabled={pending}>{pending ? 'جارٍ الدخول...' : 'دخول'}</button>
    </form>
  )
}
