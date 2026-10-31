import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { getOrderByToken } from '@/lib/order'
import { SITE, fmt, orderMessage, waLink } from '@/lib/format'

export const metadata: Metadata = { title: 'شكراً لك', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function ThankYou(props: PageProps<'/thank-you/[token]'>) {
  const { token } = await props.params
  const o = await getOrderByToken(token)
  if (!o) notFound()
  const url = `${SITE}/track/${token}`
  return (
    <div className="container-x py-20 text-center">
      <CheckCircle2 className="mx-auto text-copper" size={64} />
      <h1 className="font-display copper-text glow-text mt-6 text-5xl md:text-7xl">شكراً لثقتك</h1>
      <p className="mt-4 text-muted">تم حفظ طلبك. رقم الطلب</p>
      <p className="font-display text-5xl text-copper-lt" dir="ltr">{o.number}</p>
      <p className="mt-2 text-sm text-muted">الإجمالي: {fmt(o.total)} · {o.branch.name}</p>
      <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3">
        <a className="btn btn-solid" target="_blank" rel="noopener" href={waLink(o.branch.whatsapp, orderMessage(o, url))}><MessageCircle size={18} />أرسل الطلب على واتساب</a>
        <Link className="btn" href={`/track/${token}`}>تتبّع طلبك</Link>
      </div>
      <p className="mx-auto mt-6 max-w-md text-xs text-muted">احتفظ برابط التتبع. إن لم يُفتح واتساب تلقائياً اضغط الزر أعلاه لإرسال الطلب لفريقنا. في الدفع الإلكتروني أرسل صورة الإيصال في نفس المحادثة.</p>
    </div>
  )
}
