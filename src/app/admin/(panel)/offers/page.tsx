import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import { EndOfferButton, OfferEditor, type OfferProduct } from '@/components/admin/OfferForms'

export const metadata: Metadata = { title: 'العروض', robots: { index: false } }
export const dynamic = 'force-dynamic'
const fmt = (n: number) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪`
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('ar-EG-u-nu-latn', { timeZone: 'Asia/Gaza', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—')
/** Current time for the request; kept out of render so the page stays pure. */
const nowMs = () => Date.now()

export default async function Offers() {
  const { sb } = await requireStaff()
  const { data } = await sb.from('products').select('id, name, slug, base_price, sale_price, sale_starts_at, sale_ends_at, is_featured, is_custom, status').order('name')
  const all = (data ?? []) as (OfferProduct & { slug: string; status: string })[]
  const now = nowMs()
  const state = (p: OfferProduct): 'active' | 'scheduled' | 'ended' | null => !p.sale_price ? null : p.sale_ends_at && Date.parse(p.sale_ends_at) <= now ? 'ended' : p.sale_starts_at && Date.parse(p.sale_starts_at) > now ? 'scheduled' : 'active'
  const offers = all.filter((p) => p.sale_price).map((p) => ({ ...p, st: state(p) })).sort((a, b) => ['active', 'scheduled', 'ended'].indexOf(a.st!) - ['active', 'scheduled', 'ended'].indexOf(b.st!))
  const ST = { active: ['ساري', 'bg-emerald-100 text-emerald-800'], scheduled: ['مجدول', 'bg-sky-100 text-sky-800'], ended: ['منتهي', 'bg-stone-200 text-stone-700'] } as const
  return (
    <>
      <h1 className="a-h1">العروض</h1>
      <p className="a-muted">العروض السارية بتظهر بقسم «العروض» بالرئيسية وبالمتجر، مع شارة الخصم والسعر القديم مشطوب.</p>
      <OfferEditor products={all.filter((p) => !p.is_custom && p.status === 'visible')} />
      <section className="a-card a-scroll">
        <h2 className="mb-3 font-display text-lg font-normal">كل العروض ({offers.length})</h2>
        <table className="a-table"><thead><tr><th>المنتج</th><th>قبل</th><th>بعد</th><th>الخصم</th><th>من</th><th>إلى</th><th>الحالة</th><th></th></tr></thead><tbody>
          {offers.map((p) => <tr key={p.id}>
            <td><Link href={`/admin/products/${p.id}`} className="font-medium underline">{p.name}</Link>{p.is_featured && <span className="a-pill ms-2 bg-[var(--a-sand)]">مميز</span>}</td>
            <td><s className="a-muted">{fmt(p.base_price)}</s></td><td className="font-semibold">{fmt(p.sale_price!)}</td>
            <td>{Math.round((1 - p.sale_price! / p.base_price) * 100)}%</td><td className="whitespace-nowrap">{dt(p.sale_starts_at)}</td><td className="whitespace-nowrap">{dt(p.sale_ends_at)}</td>
            <td><span className={`a-pill ${ST[p.st!][1]}`}>{ST[p.st!][0]}</span></td><td><EndOfferButton id={p.id} /></td></tr>)}
          {!offers.length && <tr><td colSpan={8} className="a-muted py-8 text-center">لا توجد عروض. اختر منتجاً من الأعلى لإضافة عرض.</td></tr>}
        </tbody></table>
      </section>
    </>
  )
}
