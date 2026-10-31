import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff, PAYMENT_AR, STATUS_AR, STATUS_TONE, dt } from '@/lib/admin'
import { fmt, waLink } from '@/lib/format'
import { ItemPriceForm, StatusForm } from '@/components/admin/OrderForms'

export const metadata: Metadata = { title: 'تفاصيل الطلب', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function OrderDetail(props: PageProps<'/admin/orders/[id]'>) {
  const { id } = await props.params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { sb, staff } = await requireStaff()
  const { data: o } = await sb.from('orders').select('*, branches(name, whatsapp), order_items(*)').eq('id', id).maybeSingle()
  if (!o) notFound()
  const { data: log } = staff.role === 'owner' ? await sb.from('audit_log').select('created_at, action, details').in('entity', ['orders', 'order_items']).eq('entity_id', id).order('created_at', { ascending: false }).limit(10) : { data: null }
  const items = (o.order_items as { id: string; name: string; variant_label: string | null; qty: number; unit_price: number; custom_price: number | null; measurements: Record<string, string> | null; is_custom: boolean }[]).sort((a, b) => a.name.localeCompare(b.name))
  const branch = o.branches as unknown as { name: string; whatsapp: string | null } | null
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/admin/orders" className="a-muted underline">← كل الطلبات</Link><h1 className="a-h1" dir="ltr">{o.number}</h1><p className="a-muted">{dt(o.created_at)} · <span className={`a-pill ${STATUS_TONE[o.status]}`}>{STATUS_AR[o.status]}</span></p></div>
        <div className="flex gap-2"><Link className="a-btn" href={`/admin/orders/${o.id}/invoice`}>الفاتورة</Link><a className="a-btn" target="_blank" rel="noopener" href={waLink(o.phone, `مرحباً ${o.customer_name}، بخصوص طلبك ${o.number} من مفروشات العصار`)}>واتساب الزبون</a></div>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="a-card space-y-1 text-sm"><h2 className="mb-2 font-semibold">الزبون</h2><p>{o.customer_name}</p><p dir="ltr" className="text-end">{o.phone}</p><p>الفرع: {branch?.name}</p><p>{o.fulfillment === 'pickup' ? 'استلام من الفرع' : `توصيل: ${o.address}`}</p><p>الدفع: {PAYMENT_AR[o.payment_method]}</p>{o.coupon_code && <p>الكوبون: <span dir="ltr">{o.coupon_code}</span></p>}{o.notes && <p className="rounded bg-amber-50 p-2">ملاحظات: {o.notes}</p>}</div>
        <div className="a-card lg:col-span-2"><h2 className="mb-2 font-semibold">تغيير الحالة</h2><StatusForm id={o.id} status={o.status} />
          <p className="a-muted mt-3">المخزون يُخصم عند «مؤكد» ويرجع تلقائياً إذا أُلغي الطلب بعد التأكيد. {o.stock_deducted ? '✓ تم خصم المخزون لهذا الطلب.' : ''}</p></div>
      </section>
      <section className="a-card a-scroll"><h2 className="mb-2 font-semibold">البنود</h2><table className="a-table"><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>سعر خاص للوحدة</th><th>المجموع</th></tr></thead><tbody>
        {items.map((i) => <tr key={i.id}><td><p className="font-medium">{i.name}{i.variant_label && ` (${i.variant_label})`}</p>{i.is_custom && <span className="a-pill bg-amber-100 text-amber-800">تفصيل</span>}
          {i.measurements && <p className="a-muted mt-1 max-w-md">{Object.entries(i.measurements).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}</td>
          <td>{i.qty}</td><td>{fmt(i.unit_price)}</td><td><ItemPriceForm id={i.id} unit={i.unit_price} custom={i.custom_price} /></td><td className="whitespace-nowrap font-medium">{fmt((i.custom_price ?? i.unit_price) * i.qty)}</td></tr>)}</tbody></table>
        <div className="mt-3 space-y-1 text-end text-sm"><p>المجموع الفرعي: {fmt(o.subtotal)}</p>{o.discount > 0 && <p>الخصم: -{fmt(o.discount)}</p>}<p className="text-lg font-semibold">الإجمالي: {fmt(o.total)}</p></div>
        <p className="a-muted mt-2">تعديل «السعر الخاص» يُسجَّل في السجل باسمك ويُعاد حساب إجمالي الطلب تلقائياً. اتركه فارغاً للعودة للسعر الأصلي.</p></section>
      {log && log.length > 0 && <section className="a-card"><h2 className="mb-2 font-semibold">سجل التغييرات</h2><ul className="space-y-1 text-xs" dir="ltr">{log.map((l, i) => <li key={i} className="text-[var(--a-mute)]">{dt(l.created_at)} · {l.action} · {JSON.stringify(l.details).slice(0, 140)}</li>)}</ul></section>}
    </>
  )
}
