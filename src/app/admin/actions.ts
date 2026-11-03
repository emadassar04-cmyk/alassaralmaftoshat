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
