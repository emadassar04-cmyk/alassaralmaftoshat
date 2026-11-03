import type { Metadata } from 'next'
import { requireStaff } from '@/lib/admin'
import { PasswordForm } from '@/components/admin/PasswordForm'

export const metadata: Metadata = { title: 'حسابي', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Account() {
  const { staff } = await requireStaff()
  return (
    <>
      <h1 className="a-h1">حسابي</h1>
      <p className="a-muted"><span dir="ltr">{staff.email}</span> · {staff.role === 'owner' ? 'المالك' : 'مشرف بضاعة'}</p>
      <PasswordForm />
    </>
  )
}
