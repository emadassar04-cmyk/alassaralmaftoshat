import type { Metadata } from 'next'
import Link from 'next/link'
import { requireOwner } from '@/lib/admin'
import { SITE } from '@/lib/format'
import { CopyBtn } from '@/components/admin/IntegrationCards'

export const metadata: Metadata = { title: 'توثيق API', robots: { index: false } }
export const dynamic = 'force-dynamic'
const EP = [
  { m: 'GET', p: '/api/v1/ping', d: 'اختبار الاتصال والمفتاح.', body: null, res: '{ "ok": true, "service": "alassar", "time": "…" }' },
  { m: 'GET', p: '/api/v1/products', d: 'كل المنتجات الظاهرة مع الأسعار والمخزون والخيارات (للبوت).', body: null, res: '{ "ok": true, "count": 18, "products": [{ "id", "name", "price", "in_stock", "variants": [{ "id", "label", "price", "stock" }] }] }' },
  { m: 'GET', p: '/api/v1/orders/AS-1001', d: 'حالة طلب وتفاصيله.', body: null, res: '{ "ok": true, "order": { "number", "status", "total", "items": […], "track_url" } }' },
  { m: 'POST', p: '/api/v1/orders', d: 'إنشاء طلب من البوت. الأسعار تُحسب من قاعدة البيانات ولا تُرسل. branch = deir-al-balah أو nuseirat.',
    body: '{\n  "name": "أحمد", "phone": "0591234567", "branch": "deir-al-balah",\n  "fulfillment": "pickup", "payment_method": "in_store",\n  "items": [{ "product_id": "<uuid>", "variant_id": "<uuid>", "qty": 2 }]\n}', res: '{ "ok": true, "number": "AS-1002", "total": 240, "track_url": "…" }' },
  { m: 'PATCH', p: '/api/v1/orders/AS-1001/status', d: 'تحديث الحالة: new / confirmed / ready / received / cancelled. التأكيد يخصم المخزون والإلغاء يرجعه.', body: '{ "status": "confirmed" }', res: '{ "ok": true, "number": "AS-1001", "status": "confirmed" }' },
  { m: 'POST', p: '/api/v1/conversations/messages', d: 'حفظ رسالة من محادثة البوت (من الزبون أو من البوت).',
    body: '{\n  "channel": "telegram", "external_id": "123456789", "role": "customer",\n  "text": "كم سعر الستائر؟", "customer_name": "أحمد", "phone": "0591234567"\n}', res: '{ "ok": true, "conversation_id": "<uuid>" }' },
  { m: 'POST', p: '/api/v1/bot/incoming', d: 'بوت تليجرام (n8n): الموقع يستقبل رسائل تليجرام ويرسلها لـ Webhook الـ workflow موقّعة (sig). أعد إرسالها هنا كما هي لتُحفظ وتعرف هل يرد البوت. يرجع should_reply و conversation_id و history_text (آخر المحادثة). إن كان should_reply = false (البوت متوقف أو استلمتَ المحادثة) لا ترد.',
    body: '{ "update_id": 123456, "chat_id": "987654321", "name": "أحمد", "text": "كم سعر الستائر؟", "sig": "<كما وصل من الموقع>" }', res: '{ "ok": true, "should_reply": true, "conversation_id": "<uuid>", "history_text": "…" }' },
  { m: 'GET', p: '/api/v1/bot/products?q=ستائر', d: 'أداة للبوت: بحث مختصر في المنتجات بالأسعار والتوفر والروابط.', body: null, res: '{ "matched": 2, "products": [{ "name", "price_from", "in_stock", "options", "url" }] }' },
  { m: 'GET', p: '/api/v1/bot/order-status?number=AS-1001&phone=0591234567', d: 'أداة للبوت: حالة الطلب، فقط إذا طابق رقم الجوال الطلب.', body: null, res: '{ "found": true, "status": "مؤكد", "total": 120, "track_url": "…" }' },
  { m: 'POST', p: '/api/v1/bot/handoff', d: 'أداة للبوت: تحويل المحادثة لموظف (يسكت البوت فيها ويصلك إشعار).', body: '{ "conversation_id": "<uuid>", "reason": "شكوى" }', res: '{ "ok": true }' },
  { m: 'POST', p: '/api/v1/bot/reply', d: 'يرسل رد البوت للزبون على تليجرام (بتوكن الموقع) ويحفظه في الداشبورد. send: false = حفظ فقط.', body: '{ "conversation_id": "<uuid>", "text": "الستائر بتبدأ من 60 ₪…" }', res: '{ "ok": true }' },
] as const
const TONE: Record<string, string> = { GET: 'bg-emerald-100 text-emerald-800', POST: 'bg-sky-100 text-sky-800', PATCH: 'bg-amber-100 text-amber-800' }

export default async function Docs() {
  await requireOwner()
  const curl = (e: (typeof EP)[number]) => `curl -X ${e.m} "${SITE}${e.p}" -H "X-API-Key: YOUR_KEY"${e.body ? ` -H "Content-Type: application/json" -d '${e.body.replace(/\s+/g, ' ')}'` : ''}`
  return (
    <>
      <div><Link href="/admin/integrations" className="a-muted underline">← الربط</Link><h1 className="a-h1">توثيق API لـ n8n</h1></div>
      <div className="a-card space-y-2 text-sm"><p>الرابط الأساسي: <b dir="ltr">{SITE}</b></p><p>كل الطلبات تحتاج الهيدر <b dir="ltr">X-API-Key: as_live_…</b> (يُولَّد من صفحة الربط). عند إيقاف الربط تُرفض كل الطلبات بـ 401.</p>
        <p>الأحداث الصادرة إلى n8n (POST إلى رابط Webhook): <b dir="ltr">order.created · order.status_changed · lead.created · review.created · stock.low</b>، وفي كل طلب الهيدرات <b dir="ltr">X-Assar-Event</b> و<b dir="ltr">X-Assar-Secret</b> (للتحقق ببساطة) و<b dir="ltr">X-Assar-Signature</b> (HMAC-SHA256 للجسم).</p></div>
      {EP.map((e) => (
        <section key={e.m + e.p} className="a-card space-y-2">
          <div className="flex flex-wrap items-center gap-2"><span className={`a-pill ${TONE[e.m]}`} dir="ltr">{e.m}</span><code dir="ltr" className="font-mono text-sm">{e.p}</code><span className="ms-auto"><CopyBtn text={curl(e)} label="نسخ curl" /></span></div>
          <p className="text-sm">{e.d}</p>
          {e.body && <pre dir="ltr" className="overflow-x-auto rounded bg-[var(--a-sand)] p-3 text-xs">{e.body}</pre>}
          <p className="a-muted">الرد:</p><pre dir="ltr" className="overflow-x-auto rounded bg-white p-3 text-xs">{e.res}</pre>
        </section>))}
    </>
  )
}
