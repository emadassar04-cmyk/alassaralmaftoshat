import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireStaff, PAYMENT_AR, dt } from '@/lib/admin'
import { fmt } from '@/lib/format'
import { PrintButton } from '@/components/admin/OrderForms'

export const metadata: Metadata = { title: 'فاتورة', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Invoice(props: PageProps<'/admin/orders/[id]/invoice'>) {
  const { id } = await props.params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const { sb } = await requireStaff()
  const { data: o } = await sb.from('orders').select('*, branches(name, address, phone), order_items(*)').eq('id', id).maybeSingle()
  if (!o) notFound()
  const b = o.branches as unknown as { name: string; address: string | null; phone: string | null } | null
  const items = o.order_items as { id: string; name: string; variant_label: string | null; qty: number; unit_price: number; custom_price: number | null; measurements: Record<string, string> | null }[]
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-[#222] md:p-10">
      <div className="no-print mb-6 flex justify-end"><PrintButton /></div>
      <header className="flex items-start justify-between border-b-2 border-[#8f6a2e] pb-4">
        <div><p className="font-display text-4xl text-[#8f6a2e]">مفروشات العصار</p><p className="text-sm">بيتك يستاهل الأفخم · منذ 1996</p><p className="text-sm">{b?.name} · {b?.address} · <span dir="ltr">{b?.phone}</span></p></div>
        <div className="text-end"><p className="text-lg font-semibold">فاتورة</p><p dir="ltr" className="font-mono">{o.number}</p><p className="text-sm">{dt(o.created_at)}</p></div>
      </header>
      <section className="my-5 grid grid-cols-2 gap-4 text-sm"><div><p className="font-semibold">الزبون</p><p>{o.customer_name}</p><p dir="ltr" className="text-end">{o.phone}</p></div>
        <div><p className="font-semibold">التفاصيل</p><p>{o.fulfillment === 'pickup' ? 'استلام من الفرع' : `توصيل: ${o.address}`}</p><p>الدفع: {PAYMENT_AR[o.payment_method]}</p></div></section>
      <table className="w-full border-collapse text-sm"><thead><tr className="bg-[#f6f0e4]"><th className="border p-2 text-start">البند</th><th className="border p-2">الكمية</th><th className="border p-2">السعر</th><th className="border p-2">المجموع</th></tr></thead><tbody>
        {items.map((i) => <tr key={i.id}><td className="border p-2">{i.name}{i.variant_label && ` (${i.variant_label})`}{i.measurements && <span className="block text-xs text-[#666]">{Object.entries(i.measurements).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>}</td>
          <td className="border p-2 text-center">{i.qty}</td><td className="border p-2 text-center">{fmt(i.custom_price ?? i.unit_price)}</td><td className="border p-2 text-center">{fmt((i.custom_price ?? i.unit_price) * i.qty)}</td></tr>)}</tbody></table>
      <div className="mt-4 space-y-1 text-end"><p>المجموع الفرعي: {fmt(o.subtotal)}</p>{o.discount > 0 && <p>الخصم: -{fmt(o.discount)}</p>}<p className="text-xl font-bold">الإجمالي: {fmt(o.total)}</p></div>
      <p className="mt-10 text-center text-xs text-[#666]">شكراً لثقتكم بمفروشات العصار</p>
    </div>
  )
}
