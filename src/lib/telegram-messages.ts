import { SITE } from './format'

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const PAY: Record<string, string> = { in_store: 'في المحل', cod: 'عند التوصيل', palpay: 'PalPay', jawwal_pay: 'جوال باي', bank_palestine: 'بنك فلسطين' }
const ST: Record<string, string> = { new: 'جديد', confirmed: 'مؤكد', ready: 'جاهز', received: 'مستلم', cancelled: 'ملغي' }
type D = Record<string, unknown> & { items?: { name: string; variant?: string | null; qty: number; is_custom?: boolean; measurements?: Record<string, string> | null }[] }

/** Arabic Telegram notification (HTML parse mode, all values escaped). */
export function telegramText(event: string, d: D): string | null {
  switch (event) {
    case 'order.created': {
      const items = (d.items ?? []).map((i) => {
        const m = i.measurements ? Object.entries(i.measurements).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join('، ') : ''
        return `• ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty}${i.is_custom ? ' [تفصيل]' : ''}${m ? `\n   ${m}` : ''}`
      }).join('\n')
      return [`🛋️ <b>طلب جديد ${esc(d.number)}</b>`, `الزبون: ${esc(d.customer_name)} - ${esc(d.phone)}`, `الفرع: ${esc(d.branch)}`,
        `الاستلام: ${d.fulfillment === 'pickup' ? 'من الفرع' : `توصيل - ${esc(d.address)}`}`, `الدفع: ${PAY[String(d.payment_method)] ?? esc(d.payment_method)}`,
        ...(Number(d.discount) > 0 ? [`الخصم: ${esc(d.discount)} ₪ (${esc(d.coupon_code)})`] : []), `<b>الإجمالي: ${esc(d.total)} ₪</b>${d.fulfillment === 'delivery' ? ' + توصيل (يُتفق عليه)' : ''}`, '', items,
        ...(d.notes ? ['', `ملاحظات: ${esc(d.notes)}`] : []), '', `التتبع: ${SITE}/track/${esc(d.track_token)}`].join('\n')
    }
    case 'order.status_changed': return `📦 الطلب <b>${esc(d.number)}</b>: ${ST[String(d.from)] ?? esc(d.from)} ← <b>${ST[String(d.to)] ?? esc(d.to)}</b>\nالزبون: ${esc(d.customer_name)} - ${esc(d.phone)}`
    case 'lead.created': return `📱 رقم جديد من الموقع: ${esc(d.phone)}\nكود الخصم: ${esc(d.coupon_code)}`
    case 'review.created': return `⭐ تقييم جديد ينتظر الموافقة\nالمنتج: ${esc(d.product)}\nالتقييم: ${esc(d.rating)}/5 - ${esc(d.author)}${d.body ? `\n${esc(d.body)}` : ''}`
    case 'bot.handoff': return `🙋 زبون على بوت تليجرام بحاجة لموظف\nالزبون: ${esc(d.customer_name)}\nالسبب: ${esc(d.reason)}\nرد عليه من: ${SITE}/admin/conversations/${esc(d.conversation_id)}`
    case 'stock.low': return `⚠️ مخزون منخفض: ${esc(d.product)} (${esc(d.variant)}) - المتبقي <b>${esc(d.stock)}</b>`
    default: return null
  }
}
