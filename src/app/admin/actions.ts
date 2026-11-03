'use server'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase-server'

export async function login(_: { error?: string } | undefined, fd: FormData) {
  const sb = await supabaseServer()
  const { error } = await sb.auth.signInWithPassword({ email: String(fd.get('email') ?? '').trim(), password: String(fd.get('password') ?? '') })
  if (error) return { error: 'الإيميل أو كلمة السر غير صحيحة' }
  redirect('/admin')
}
export async function logout() {
  const sb = await supabaseServer(); await sb.auth.signOut(); redirect('/admin/login')
}

export async function changePassword(_: { error?: string; ok?: boolean } | undefined, fd: FormData) {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user?.email) redirect('/admin/login')
  const cur = String(fd.get('current') ?? ''), next = String(fd.get('next') ?? ''), again = String(fd.get('again') ?? '')
  if (next.length < 10) return { error: 'كلمة السر الجديدة يجب أن تكون 10 أحرف على الأقل' }
  if (next !== again) return { error: 'تأكيد كلمة السر غير مطابق' }
  if (next.toLowerCase().includes(user.email.split('@')[0].toLowerCase())) return { error: 'لا تضع اسم إيميلك داخل كلمة السر' }
  if (next === cur) return { error: 'اختر كلمة سر مختلفة عن الحالية' }
  const { error: e1 } = await sb.auth.signInWithPassword({ email: user.email, password: cur })
  if (e1) return { error: 'كلمة السر الحالية غير صحيحة' }
  const { error } = await sb.auth.updateUser({ password: next })
  if (error) return { error: 'تعذّر تغيير كلمة السر، جرّب كلمة أقوى' }
  return { ok: true }
}
