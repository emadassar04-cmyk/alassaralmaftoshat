import { headers } from 'next/headers'

export async function clientIp() {
  const h = await headers()
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim()
}
/** Cloudflare Turnstile. If no secret is configured (dev / not yet set up) it passes, and honeypot + DB rate limits still apply. */
export async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  }).catch(() => null)
  return Boolean(r && (await r.json()).success)
}
const MAP: Record<string, string> = {
  invalid_phone: 'رقم الجوال غير صحيح (مثال: 0591234567)', invalid_name: 'الرجاء كتابة الاسم', address_required: 'الرجاء كتابة عنوان التوصيل',
  invalid_branch: 'الرجاء اختيار الفرع', invalid_items: 'السلة فارغة', invalid_product: 'أحد المنتجات لم يعد متوفراً', invalid_variant: 'خيار المنتج غير صحيح',
  variant_required: 'الرجاء اختيار خيارات المنتج', rate_limited: 'محاولات كثيرة، حاول بعد قليل', not_eligible: 'لا يمكن تقييم هذا المنتج الآن', already_reviewed: 'سبق أن قيّمت هذا المنتج',
}
export function friendly(msg: string) {
  for (const k of Object.keys(MAP)) if (msg.includes(k)) return MAP[k]
  if (msg.includes('out_of_stock:')) return `نفدت الكمية من: ${msg.split('out_of_stock:')[1].trim()}`
  if (msg.includes('coupon:')) return msg.split('coupon:')[1].trim()
  return 'حدث خطأ، حاول مرة أخرى'
}
