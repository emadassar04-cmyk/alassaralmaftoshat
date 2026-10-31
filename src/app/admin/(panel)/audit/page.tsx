import type { Metadata } from 'next'
import { requireOwner, dt } from '@/lib/admin'

export const metadata: Metadata = { title: 'السجل', robots: { index: false } }
export const dynamic = 'force-dynamic'
const ENT: Record<string, string> = { products: 'منتج', product_variants: 'خيار منتج', orders: 'طلب', order_items: 'بند طلب', coupons: 'كوبون', branches: 'فرع', store_settings: 'إعداد', reviews: 'تقييم', posts: 'مقال', profiles: 'مستخدم' }
const ACT: Record<string, string> = { insert: 'إضافة', update: 'تعديل', delete: 'حذف' }
export default async function Audit() {
  const { sb } = await requireOwner()
  const [{ data: log }, { data: staff }] = await Promise.all([sb.from('audit_log').select('id, actor, action, entity, entity_id, details, created_at').order('id', { ascending: false }).limit(150), sb.rpc('list_staff')])
  const who = new Map(((staff ?? []) as { id: string; email: string; full_name: string | null }[]).map((u) => [u.id, u.full_name ?? u.email]))
  return (
    <>
      <h1 className="a-h1">السجل</h1><p className="a-muted">آخر 150 تعديلاً من المالك والمشرفين (تغيير أسعار، حالات طلبات، مخزون، إعدادات...).</p>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>التغيير</th></tr></thead><tbody>
        {log?.map((l) => <tr key={l.id}><td className="whitespace-nowrap">{dt(l.created_at)}</td><td>{l.actor ? who.get(l.actor) ?? '—' : 'النظام'}</td><td className="whitespace-nowrap">{ACT[l.action]} {ENT[l.entity] ?? l.entity}</td>
          <td dir="ltr" className="max-w-xl truncate text-start text-xs text-[var(--a-mute)]" title={JSON.stringify(l.details)}>{JSON.stringify(l.details)}</td></tr>)}
        {!log?.length && <tr><td colSpan={4} className="a-muted py-8 text-center">لا سجلات بعد</td></tr>}</tbody></table></div>
    </>
  )
}
