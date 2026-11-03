import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff, PAYMENT_AR, STATUS_AR, STATUS_TONE, dt } from '@/lib/admin'
import { fmt } from '@/lib/format'
import { LiveOrders } from '@/components/admin/LiveOrders'
import { gazaIso, isDay } from '@/lib/gaza'

export const metadata: Metadata = { title: 'الطلبات', robots: { index: false } }
export const dynamic = 'force-dynamic'
const PAGE = 30
const clean = (s: string) => s.replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)

export default async function Orders(props: PageProps<'/admin/orders'>) {
  const { sb } = await requireStaff()
  const sp = await props.searchParams
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const page = Math.max(1, Number(v('page')) || 1)
  const { data: branches } = await sb.from('branches').select('id, name').order('sort')
  let q = sb.from('orders').select('id, number, customer_name, phone, total, status, payment_method, fulfillment, created_at, branches(name)', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1)
  if (v('status')) q = q.eq('status', v('status') as 'new')
  if (v('branch')) q = q.eq('branch_id', v('branch'))
  if (v('pay')) q = q.eq('payment_method', v('pay'))
  if (isDay(v('from'))) q = q.gte('created_at', gazaIso(v('from')))
  if (isDay(v('to'))) q = q.lte('created_at', gazaIso(v('to'), true))
  if (clean(v('q'))) { const t = clean(v('q')); q = q.or(`number.ilike.%${t}%,customer_name.ilike.%${t}%,phone.ilike.%${t}%`) }
  const { data: rows, count } = await q
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE))
  const qs = (n: number) => { const u = new URLSearchParams(Object.entries(sp).filter(([, x]) => typeof x === 'string') as [string, string][]); u.set('page', String(n)); return `?${u}` }
  return (
    <>
      <LiveOrders />
      <h1 className="a-h1">الطلبات</h1>
      <form className="a-card grid gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <label className="a-lbl lg:col-span-2">بحث (رقم الطلب / اسم / جوال)<input name="q" defaultValue={v('q')} className="a-field mt-1" /></label>
        <label className="a-lbl">الحالة<select name="status" defaultValue={v('status')} className="a-field mt-1"><option value="">الكل</option>{Object.entries(STATUS_AR).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="a-lbl">الفرع<select name="branch" defaultValue={v('branch')} className="a-field mt-1"><option value="">الكل</option>{branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="a-lbl">الدفع<select name="pay" defaultValue={v('pay')} className="a-field mt-1"><option value="">الكل</option>{Object.entries(PAYMENT_AR).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2"><label className="a-lbl">من<input type="date" name="from" defaultValue={v('from')} className="a-field mt-1" /></label><label className="a-lbl">إلى<input type="date" name="to" defaultValue={v('to')} className="a-field mt-1" /></label></div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6"><button className="a-btn a-btn-solid">تطبيق</button><Link href="/admin/orders" className="a-btn">مسح</Link><span className="a-muted self-center">{count ?? 0} طلب</span></div>
      </form>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>الطلب</th><th>الزبون</th><th>الجوال</th><th>الفرع</th><th>الاستلام</th><th>الدفع</th><th>الحالة</th><th>الإجمالي</th><th>الوقت</th></tr></thead><tbody>
        {rows?.map((o) => <tr key={o.id}><td><Link className="font-semibold text-[#8f6a2e] underline" href={`/admin/orders/${o.id}`}>{o.number}</Link></td><td>{o.customer_name}</td><td dir="ltr" className="whitespace-nowrap">{o.phone}</td>
          <td>{(o.branches as unknown as { name: string } | null)?.name}</td><td>{o.fulfillment === 'pickup' ? 'من الفرع' : 'توصيل'}</td><td>{PAYMENT_AR[o.payment_method]}</td>
          <td><span className={`a-pill ${STATUS_TONE[o.status]}`}>{STATUS_AR[o.status]}</span></td><td className="whitespace-nowrap">{fmt(o.total)}</td><td className="whitespace-nowrap">{dt(o.created_at)}</td></tr>)}
        {!rows?.length && <tr><td colSpan={9} className="a-muted py-10 text-center">لا توجد طلبات مطابقة</td></tr>}</tbody></table></div>
      {pages > 1 && <div className="flex items-center justify-center gap-3"><Link aria-disabled={page <= 1} className={`a-btn ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`} href={qs(page - 1)}>السابق</Link><span className="a-muted">{page} / {pages}</span><Link className={`a-btn ${page >= pages ? 'pointer-events-none opacity-40' : ''}`} href={qs(page + 1)}>التالي</Link></div>}
    </>
  )
}
