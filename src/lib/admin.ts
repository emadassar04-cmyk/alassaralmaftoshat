import { redirect } from 'next/navigation'
import { supabaseServer } from './supabase-server'
import type { Role } from './admin-consts'

export type { Role }
export type Staff = { id: string; email: string; role: Role; name: string | null }

export async function requireStaff() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/admin/login')
  const { data: p } = await sb.from('profiles').select('role, full_name, is_active').eq('id', user.id).maybeSingle()
  if (!p || !p.is_active) redirect('/admin/login?e=noaccess')
  const staff: Staff = { id: user.id, email: user.email ?? '', role: p.role as Role, name: p.full_name }
  return { sb, staff }
}
export async function requireOwner() {
  const r = await requireStaff()
  if (r.staff.role !== 'owner') redirect('/admin')
  return r
}
export * from './admin-consts'
