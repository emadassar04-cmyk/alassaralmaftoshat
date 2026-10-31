import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff, dt } from '@/lib/admin'
import { fmt } from '@/lib/format'
import { CouponForm } from '@/components/admin/MiscForms'
import { deleteCoupon, toggleCoupon } from '@/app/admin/misc-actions'

export const metadata: Metadata = { title: 'العروض والكوبونات', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Coupons() {
  const { sb } = await requireStaff()
  const { data } = await sb.from('coupons').select('*').order('created_at', { ascending: false }).limit(200)
  return (
    <>
      <h1 className="a-h1">العروض والكوبونات</h1>
      <p className="a-muted">أسعار العرض على المنتجات تُحدَّد من <Link href="/admin/products" className="underline">صفحة المنتج</Link> (حقل «سعر العرض»). كوبونات «ASSAR-…» تُنشأ تلقائياً لمن يترك رقمه في النافذة المنبثقة وتُستعمل مرة واحدة.</p>
      <CouponForm />
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الكود</th><th>الخصم</th><th>حد أدنى</th><th>الاستخدام</th><th>ينتهي</th><th>مرتبط برقم</th><th>الحالة</th><th></th></tr></thead><tbody>
        {data?.map((c) => <tr key={c.id}><td dir="ltr" className="font-mono font-semibold">{c.code}</td><td>{c.kind === 'percent' ? `${c.value}%` : fmt(c.value)}</td><td>{c.min_order > 0 ? fmt(c.min_order) : '—'}</td><td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
          <td className="whitespace-nowrap">{c.expires_at ? dt(c.expires_at) : '—'}</td><td dir="ltr" className="text-end">{c.lead_phone ?? '—'}</td>
          <td><form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={c.is_active ? '0' : '1'} /><button className={`a-pill ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{c.is_active ? 'فعّال' : 'معطّل'}</button></form></td>
          <td><form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><button className="a-btn a-btn-danger !min-h-8 !px-2" aria-label="حذف">✕</button></form></td></tr>)}
        {!data?.length && <tr><td colSpan={8} className="a-muted py-8 text-center">لا كوبونات بعد</td></tr>}</tbody></table></div>
    </>
  )
}
