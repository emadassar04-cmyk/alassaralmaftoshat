import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { getOrderByToken } from '@/lib/order'
import { PAYMENT_LABEL, STATUS_LABEL, fmt, waLink } from '@/lib/format'
import { ReviewForm } from '@/components/store/ReviewForm'

export const metadata: Metadata = { title: 'تتبع الطلب', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
const STEPS = ['new', 'confirmed', 'ready', 'received'] as const
export default async function Track(props: PageProps<'/track/[token]'>) {
  const { token } = await props.params
  const o = await getOrderByToken(token)
  if (!o) notFound()
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number])
  return (
    <div className="container-x max-w-3xl py-12">
      <p className="eyebrow text-center">ORDER TRACKING</p>
      <h1 className="font-display copper-text mt-2 text-center text-5xl" dir="ltr">{o.number}</h1>
      {o.status === 'cancelled' ? <p className="mt-8 border border-danger/50 p-4 text-center text-danger">هذا الطلب ملغي</p> : (
        <ol className="relative mt-10 grid grid-cols-4" aria-label="حالة الطلب">
          <div className="absolute inset-x-[12.5%] top-4 h-px bg-copper/20" /><div className="absolute top-4 h-px bg-copper transition-all duration-1000" style={{ insetInlineStart: '12.5%', width: `${Math.max(0, idx) * 25}%` }} />
          {STEPS.map((s, i) => (
            <li key={s} className="relative text-center" aria-current={i === idx ? 'step' : undefined}>
              <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-sm ${i <= idx ? 'border-copper bg-copper text-night' : 'border-copper/30 bg-night text-muted'} ${i === idx ? 'animate-pulse shadow-[0_0_18px_#c8a36a]' : ''}`}>{i + 1}</span>
              <span className={`mt-2 block text-sm ${i <= idx ? 'text-copper-lt' : 'text-muted'}`}>{STATUS_LABEL[s]}</span></li>))}
        </ol>)}
      <section className="mt-12 border border-copper/20 bg-night-2 p-5">
        <ul className="divide-y divide-copper/10">{o.items.map((i, k) => (
          <li key={k} className="py-3"><div className="flex justify-between gap-3"><span>{i.name}{i.variant && ` (${i.variant})`} × {i.qty}</span><span className="text-copper-lt">{fmt(i.price * i.qty)}</span></div>
            {i.measurements && <p className="mt-1 text-xs text-muted">{Object.entries(i.measurements).map(([k2, v]) => `${k2}: ${v}`).join(' · ')}</p>}
            {o.status === 'received' && i.product_id && <div className="mt-3"><ReviewForm token={token} productId={i.product_id} name={i.name} /></div>}</li>))}</ul>
        <div className="mt-3 space-y-1 border-t border-copper/15 pt-3 text-sm text-muted">
          {o.discount > 0 && <p className="flex justify-between"><span>الخصم</span><span>-{fmt(o.discount)}</span></p>}
          <p className="flex justify-between text-lg text-cream"><span>الإجمالي</span><strong className="text-copper-lt">{fmt(o.total)}</strong></p>
          <p>الفرع: {o.branch.name} · {o.fulfillment === 'pickup' ? 'استلام من الفرع' : `توصيل: ${o.address}`} · {PAYMENT_LABEL[o.payment_method]}</p></div>
      </section>
      <a className="btn btn-solid mx-auto mt-8 flex max-w-sm" target="_blank" rel="noopener" href={waLink(o.branch.whatsapp, `مرحباً، بخصوص طلبي ${o.number}`)}><MessageCircle size={18} />تواصل معنا على واتساب</a>
    </div>
  )
}
