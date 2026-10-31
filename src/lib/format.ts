import type { CartLine, PaymentMethod, TrackedOrder } from './types'

export const fmt = (n: number) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪`
export const unitPrice = (p: { base_price: number; sale_price: number | null }, v?: { price: number | null } | null) => v?.price ?? p.sale_price ?? p.base_price
export const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alassaralmaftoshat.vercel.app'
export const waLink = (phone: string | null | undefined, text = '') => `https://wa.me/${(phone ?? '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  in_store: 'الدفع في المحل', cod: 'الدفع عند التوصيل', palpay: 'PalPay', jawwal_pay: 'جوال باي', bank_palestine: 'بنك فلسطين',
}
export const STATUS_LABEL = { new: 'جديد', confirmed: 'مؤكد', ready: 'جاهز', received: 'مستلم', cancelled: 'ملغي' } as const

export function lineText(l: Pick<CartLine, 'name' | 'variant_label' | 'qty' | 'unit_price' | 'measurements'>) {
  const m = l.measurements ? Object.entries(l.measurements).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('، ') : ''
  return `• ${l.name}${l.variant_label ? ` (${l.variant_label})` : ''} × ${l.qty} = ${fmt(l.unit_price * l.qty)}${m ? `\n   القياسات: ${m}` : ''}`
}
/** WhatsApp message built from DB truth (the tracked order), not from browser-side prices. */
export function orderMessage(o: TrackedOrder, trackUrl: string, labels: Record<string, string> = {}) {
  const items = o.items.map((i) => {
    const m = i.measurements ? Object.entries(i.measurements).filter(([, v]) => v).map(([k, v]) => `${labels[k] ?? k}: ${v}`).join('، ') : ''
    return `• ${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty} = ${fmt(i.price * i.qty)}${m ? `\n   القياسات: ${m}` : ''}`
  }).join('\n')
  return [`مرحباً مفروشات العصار 👋`, `طلب جديد رقم *${o.number}*`, '', items, '',
    o.discount > 0 ? `الخصم: -${fmt(o.discount)}` : '', `الإجمالي: *${fmt(o.total)}*`, `الفرع: ${o.branch.name}`,
    `الاستلام: ${o.fulfillment === 'pickup' ? 'من الفرع' : `توصيل - ${o.address ?? ''}`}`, `الدفع: ${PAYMENT_LABEL[o.payment_method]}`,
    o.items.some((i) => i.is_custom) ? 'ملاحظة: السعر النهائي للمنتجات المفصّلة يُحدَّد بعد مراجعة القياسات.' : '',
    '', `تتبع الطلب: ${trackUrl}`].filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n')
}
