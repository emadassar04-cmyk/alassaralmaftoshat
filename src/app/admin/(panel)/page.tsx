import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff, PAYMENT_AR, STATUS_AR, STATUS_TONE, dt } from '@/lib/admin'
import { fmt } from '@/lib/format'
import { BranchChart, DailyChart } from '@/components/admin/Charts'
import { LiveOrders } from '@/components/admin/LiveOrders'

export const metadata: Metadata = { title: 'لوحة التحكم', robots: { index: false } }
export const dynamic = 'force-dynamic'
const RANGES = [['today', 'اليوم'], ['week', 'آخر 7 أيام'], ['month', 'آخر 30 يوماً']] as const
type Stats = { orders_total: number; orders_new: number; by_status: Record<string, number>; top_products: { name: string; qty: number; revenue: number | null }[]
  sales: number | null; by_branch: { branch: string; orders: number; sales: number }[] | null; by_payment: { method: string; orders: number }[] | null; daily: { day: string; orders: number; sales: number }[] | null; leads: number | null }

export default async function AdminHome(props: PageProps<'/admin'>) {
  const { sb, staff } = await requireStaff()
  const sp = await props.searchParams
  const range = RANGES.some(([k]) => k === sp.range) ? String(sp.range) : 'week'
  const [{ data: from }, { data: to }] = await Promise.all([sb.rpc('range_start', { p_range: range }), sb.rpc('range_start', { p_range: 'tomorrow' })])
  const [{ data: stats }, { data: recent }, { data: low }] = await Promise.all([
    sb.rpc('admin_stats', { p_from: from, p_to: to }),
    sb.from('orders').select('number, customer_name, total, status, created_at, branches(name)').order('created_at', { ascending: false }).limit(6),
    sb.from('product_variants').select('label, stock, products!inner(name, is_custom)').lte('stock', 5).eq('products.is_custom', false).order('stock').limit(8),
  ])
  const s = stats as Stats | null
  const own = staff.role === 'owner'
  return (
    <>
      <LiveOrders />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="a-h1">الرئيسية</h1><p className="a-muted">أهلاً {staff.name ?? ''}، هذه نظرة سريعة على المحل</p></div>
        <div className="flex gap-1" role="group" aria-label="الفترة">{RANGES.map(([k, l]) => <Link key={k} href={`/admin?range=${k}`} className={`a-btn ${range === k ? 'a-btn-solid' : ''}`}>{l}</Link>)}</div>
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="a-card"><p className="a-muted">طلبات جديدة تنتظر</p><p className="font-display text-4xl text-[#8f6a2e]">{s?.orders_new ?? 0}</p></div>
        <div className="a-card"><p className="a-muted">طلبات الفترة</p><p className="font-display text-4xl">{s?.orders_total ?? 0}</p></div>
        {own && <div className="a-card"><p className="a-muted">المبيعات (بدون الملغي)</p><p className="font-display text-4xl">{fmt(s?.sales ?? 0)}</p></div>}
        {own && <div className="a-card"><p className="a-muted">أرقام جديدة (Leads)</p><p className="font-display text-4xl">{s?.leads ?? 0}</p></div>}
      </section>
      {own && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="a-card lg:col-span-2"><h2 className="mb-2 font-semibold">المبيعات اليومية</h2>{s?.daily?.length ? <DailyChart data={s.daily} /> : <p className="a-muted py-10 text-center">لا مبيعات في هذه الفترة</p>}</div>
          <div className="a-card"><h2 className="mb-2 font-semibold">مقارنة الفرعين</h2>{s?.by_branch?.length ? <BranchChart data={s.by_branch} /> : <p className="a-muted py-10 text-center">لا بيانات</p>}
            <h3 className="mb-1 mt-4 text-sm font-semibold">طرق الدفع</h3><ul className="space-y-1 text-sm">{s?.by_payment?.map((p) => <li key={p.method} className="flex justify-between"><span>{PAYMENT_AR[p.method]}</span><span>{p.orders}</span></li>)}</ul></div>
        </section>)}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="a-card lg:col-span-2"><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">آخر الطلبات</h2><Link href="/admin/orders" className="a-muted underline">عرض الكل</Link></div>
          <div className="a-scroll"><table className="a-table"><thead><tr><th>الطلب</th><th>الزبون</th><th>الفرع</th><th>الحالة</th>{own && <th>الإجمالي</th>}<th>الوقت</th></tr></thead><tbody>
            {recent?.map((o) => <tr key={o.number}><td><Link className="text-[#8f6a2e] underline" href={`/admin/orders?q=${o.number}`}>{o.number}</Link></td><td>{o.customer_name}</td><td>{(o.branches as unknown as { name: string } | null)?.name}</td>
              <td><span className={`a-pill ${STATUS_TONE[o.status]}`}>{STATUS_AR[o.status]}</span></td>{own && <td>{fmt(o.total)}</td>}<td className="whitespace-nowrap">{dt(o.created_at)}</td></tr>)}
            {!recent?.length && <tr><td colSpan={6} className="a-muted py-8 text-center">لا توجد طلبات بعد</td></tr>}</tbody></table></div></div>
        <div className="space-y-4">
          <div className="a-card"><h2 className="mb-2 font-semibold">الأكثر مبيعاً</h2><ol className="space-y-1 text-sm">{s?.top_products?.map((p) => <li key={p.name} className="flex justify-between gap-2"><span className="truncate">{p.name}</span><span>{p.qty}</span></li>)}{!s?.top_products?.length && <li className="a-muted">لا بيانات</li>}</ol></div>
          <div className="a-card"><h2 className="mb-2 font-semibold">تنبيه المخزون المنخفض</h2><ul className="space-y-1 text-sm">{low?.map((v, i) => <li key={i} className="flex justify-between gap-2"><span className="truncate">{(v.products as unknown as { name: string }).name} · {v.label}</span><span className={v.stock === 0 ? 'font-semibold text-rose-700' : 'text-amber-700'}>{v.stock}</span></li>)}{!low?.length && <li className="a-muted">المخزون بخير</li>}</ul></div>
        </div>
      </section>
    </>
  )
}
