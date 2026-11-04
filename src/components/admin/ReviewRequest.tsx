'use client'
import { useTransition } from 'react'
import { Star } from 'lucide-react'
import { markReviewRequested } from '@/app/admin/orders-actions'
import { reviewRequestText, waLink } from '@/lib/format'

type P = { id: string; phone: string; name: string; number: string; token: string; requested: boolean; compact?: boolean }
/** Opens WhatsApp with a ready review request and records that it was sent (link click is synchronous, so no popup blocking). */
export function ReviewRequestButton({ id, phone, name, number, token, requested, compact = false }: P) {
  const [, start] = useTransition()
  const href = waLink(phone, reviewRequestText(name, number, token))
  const mark = () => start(async () => { await markReviewRequested(id) })
  if (compact) return (
    <a href={href} target="_blank" rel="noopener" onClick={mark} title={requested ? 'تم طلب التقييم — اضغط لإعادة الإرسال' : 'اطلب تقييم عبر واتساب'} aria-label={`اطلب تقييم من ${name}`}
      className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${requested ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-[var(--a-line)] bg-white text-[var(--a-mute)] hover:border-amber-400 hover:text-amber-600'}`}>
      <Star size={16} fill={requested ? 'currentColor' : 'none'} /></a>)
  return <a href={href} target="_blank" rel="noopener" onClick={mark} className="a-btn a-btn-solid"><Star size={16} />{requested ? 'إعادة طلب التقييم عبر واتساب' : 'اطلب تقييم عبر واتساب'}</a>
}
