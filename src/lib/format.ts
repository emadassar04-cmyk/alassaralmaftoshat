import type { CartLine, PaymentMethod, TrackedOrder } from './types'

export const fmt = (n: number) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ₪`
export const unitPrice = (p: { base_price: number; sale_price: number | null }, v?: { price: number | null } | null) => v?.price ?? p.sale_price ?? p.base_price
/** Mirrors app_private.item_price() for display only; the server recomputes the real price. */
const num = (s?: string) => { if (!s) return NaN; const t = s.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٫,]/g, '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN }
export function areaPricing(p: { is_custom: boolean; measurement_schema: { pricing?: { type: string } } | null }) { return p.is_custom && p.measurement_schema?.pricing?.type === 'area' }
export const unitSuffix = (p: Parameters<typeof areaPricing>[0]) => (areaPricing(p) ? ' للمتر المربع' : '')
export function measuredPrice(p: { base_price: number; sale_price: number | null; is_custom: boolean; measurement_schema: import('./types').MeasurementSchema | null }, v: { price: number | null } | null, meas: Record<string, string>) {
  const rate = unitPrice(p, v); const pr = p.measurement_schema?.pricing
  if (!p.is_custom || !pr || pr.type !== 'area') return { price: rate, rate, area: null as number | null }
  const lbl = (k: string) => p.measurement_schema!.fields.find((f) => f.key === k)?.label ?? ''
  const k = pr.unit === 'cm' ? 0.01 : 1
  const l = num(meas[lbl(pr.length)]) * k, w = num(meas[lbl(pr.width)]) * k
  if (!(l > 0 && w > 0 && l <= 30 && w <= 30)) return { price: null as number | null, rate, area: null }
  const area = l * w
  return { price: Math.round(rate * area * 100) / 100, rate, area, l, w }
}
/** Route params arrive percent-encoded for non-ASCII slugs (e.g. Arabic); decode safely before querying the DB. */
export const slugParam = (s: string) => { try { return decodeURIComponent(s).normalize('NFC') } catch { return s } }
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
    o.discount > 0 ? `الخصم: -${fmt(o.discount)}` : '', o.fulfillment === 'delivery' ? `الإجمالي: *${fmt(o.total)}* (بدون التوصيل)` : `الإجمالي: *${fmt(o.total)}*`, `الفرع: ${o.branch.name}`,
    `الاستلام: ${o.fulfillment === 'pickup' ? 'من الفرع' : `توصيل - ${o.address ?? ''}`}`, `الدفع: ${PAYMENT_LABEL[o.payment_method]}`, o.fulfillment === 'delivery' ? 'أجرة التوصيل: نتفق عليها هنا حسب المنطقة، أرجو تأكيدها.' : '',
    o.items.some((i) => i.is_custom) ? 'ملاحظة: السعر النهائي للمنتجات المفصّلة يُحدَّد بعد مراجعة القياسات.' : '',
    '', `تتبع الطلب: ${trackUrl}`].filter((x, i, a) => !(x === '' && a[i - 1] === '')).join('\n')
}
