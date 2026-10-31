import type { Metadata } from 'next'
import Link from 'next/link'
import { requireOwner, dt } from '@/lib/admin'
import { fmt, waLink } from '@/lib/format'

export const metadata: Metadata = { title: 'الزبائن', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Customers(props: PageProps<'/admin/customers'>) {
  const { sb } = await requireOwner(); const sp = await props.searchParams
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().toLowerCase()
  const { data } = await sb.rpc('admin_customers')
  const rows = ((data ?? []) as { phone: string; name: string; orders: number; spent: number; last_order: string }[]).filter((c) => !q || c.name?.toLowerCase().includes(q) || c.phone.includes(q))
  return (
    <>
      <h1 className="a-h1">الزبائن</h1><p className="a-muted">مستخرجون تلقائياً من الطلبات (الرقم هو المعرّف).</p>
      <form className="a-card flex gap-2" method="get"><input name="q" defaultValue={sp.q as string} placeholder="بحث بالاسم أو الجوال" className="a-field" aria-label="بحث" /><button className="a-btn a-btn-solid">بحث</button><Link href="/admin/customers" className="a-btn">مسح</Link></form>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الاسم</th><th>الجوال</th><th>عدد الطلبات</th><th>مجموع الشراء</th><th>آخر طلب</th><th></th></tr></thead><tbody>
        {rows.map((c) => <tr key={c.phone}><td>{c.name}</td><td dir="ltr" className="text-end">{c.phone}</td><td>{c.orders}</td><td>{fmt(Number(c.spent))}</td><td className="whitespace-nowrap">{dt(c.last_order)}</td>
          <td className="flex gap-2"><Link className="a-btn !min-h-8" href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}>طلباته</Link><a className="a-btn !min-h-8" target="_blank" rel="noopener" href={waLink(c.phone)}>واتساب</a></td></tr>)}
        {!rows.length && <tr><td colSpan={6} className="a-muted py-8 text-center">لا زبائن</td></tr>}</tbody></table></div>
    </>
  )
}
