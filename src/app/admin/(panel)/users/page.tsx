import type { Metadata } from 'next'
import { requireOwner } from '@/lib/admin'
import { UserForm } from '@/components/admin/MiscForms'

export const metadata: Metadata = { title: 'المستخدمون', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Users() {
  const { sb, staff } = await requireOwner()
  const { data } = await sb.rpc('list_staff')
  const rows = (data ?? []) as { id: string; email: string; role: string; full_name: string | null; is_active: boolean }[]
  return (
    <>
      <h1 className="a-h1">المستخدمون</h1>
      <ol className="a-card list-decimal space-y-1 ps-6 text-sm"><li>أنشئ المستخدم من Supabase: <b>Authentication ← Users ← Add user</b> (إيميل وكلمة سر، وفعّل Auto Confirm).</li><li>اكتب إيميله هنا واختر دوره.</li><li>لتعطيل مشرف: اكتب إيميله واختر «معطّل» (لا يستطيع بعدها الدخول).</li></ol>
      <UserForm />
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الإيميل</th><th>الاسم</th><th>الدور</th><th>الحالة</th></tr></thead><tbody>
        {rows.map((u) => <tr key={u.id}><td dir="ltr" className="text-end">{u.email}{u.id === staff.id && <span className="a-pill ms-2 bg-sky-100 text-sky-800">أنت</span>}</td><td>{u.full_name}</td><td>{u.role === 'owner' ? 'مالك' : 'مشرف بضاعة'}</td>
          <td><span className={`a-pill ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{u.is_active ? 'مفعّل' : 'معطّل'}</span></td></tr>)}</tbody></table></div>
    </>
  )
}
