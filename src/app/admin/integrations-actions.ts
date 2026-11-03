'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner } from '@/lib/admin'
import { decrypt, encrypt, randomHex, safeHttpsUrl, sha256 } from '@/lib/secure'
import { postToN8n } from '@/lib/webhooks'

type R = { ok?: boolean; error?: string; message?: string; secret?: string }
const done = () => revalidatePath('/admin/integrations')

async function row(sb: Awaited<ReturnType<typeof requireOwner>>['sb'], key: string) {
  const { data } = await sb.from('integration_settings').select('config, secrets').eq('key', key).maybeSingle()
  return { config: (data?.config ?? {}) as Record<string, unknown>, secrets: (data?.secrets ?? {}) as Record<string, string> }
}
async function save(sb: Awaited<ReturnType<typeof requireOwner>>['sb'], key: string, patch: { config?: Record<string, unknown>; secrets?: Record<string, string> }) {
  const cur = await row(sb, key)
  return sb.from('integration_settings').upsert({ key, config: { ...cur.config, ...patch.config }, secrets: { ...cur.secrets, ...patch.secrets }, updated_at: new Date().toISOString() })
}
const stamp = (sb: Awaited<ReturnType<typeof requireOwner>>['sb'], key: string, status: string) => sb.from('integration_settings').update({ last_test_at: new Date().toISOString(), last_test_status: status }).eq('key', key)

// ---------- n8n ----------
export async function saveN8n(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner()
  const url = String(fd.get('url') ?? '').trim(); const enabled = fd.get('enabled') === 'on'
  if (url && !safeHttpsUrl(url)) return { error: 'الرابط يجب أن يكون https عاماً (مثل رابط ngrok)، وليس localhost' }
  if (enabled && !url) return { error: 'ضع رابط Webhook قبل تفعيل الربط' }
  const { error } = await save(sb, 'n8n', { config: { webhook_url: url, enabled } })
  if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, message: 'تم الحفظ' }
}
export async function generateSigningSecret(): Promise<R> {
  const { sb } = await requireOwner(); const s = `whsec_${randomHex(24)}`
  const { error } = await save(sb, 'n8n', { secrets: { signing: encrypt(s) } }); if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, secret: s }
}
export async function generateApiKey(): Promise<R> {
  const { sb } = await requireOwner(); const key = `as_live_${randomHex(16)}`
  await sb.from('api_keys').update({ revoked_at: new Date().toISOString() }).is('revoked_at', null)
  const { error } = await sb.from('api_keys').insert({ name: 'n8n', prefix: key.slice(0, 14), key_hash: sha256(key) }); if (error) return { error: 'تعذّر توليد المفتاح' }
  done(); return { ok: true, secret: key }
}
export async function testN8n(): Promise<R> {
  const { sb } = await requireOwner(); const c = await row(sb, 'n8n'); const url = String(c.config.webhook_url ?? '')
  if (!url || !safeHttpsUrl(url)) return { error: 'ضع رابط Webhook صحيحاً أولاً' }
  try {
    const res = await postToN8n(url, decrypt(c.secrets.signing), crypto.randomUUID(), 'ping', new Date().toISOString(), { message: 'اختبار اتصال من مفروشات العصار' })
    await stamp(sb, 'n8n', res.ok ? `ok:HTTP ${res.status}` : `fail:HTTP ${res.status}`); done()
    return res.ok ? { ok: true, message: `نجح الاتصال (HTTP ${res.status})` } : { error: `n8n ردّ بخطأ HTTP ${res.status}. تأكد أنك تستعمل Production URL وأن الـ workflow منشور (Active).` }
  } catch { await stamp(sb, 'n8n', 'fail:network'); done(); return { error: 'تعذّر الوصول إلى n8n. غالباً ngrok مطفأ أو الرابط تغيّر.' } }
}
export async function resendWebhook(fd: FormData) {
  const { sb } = await requireOwner(); const id = z.string().uuid().parse(fd.get('id'))
  await sb.from('webhook_logs').update({ status: 'pending', next_attempt_at: new Date().toISOString(), attempts: 0, error: null }).eq('id', id)
  const { dispatchPending } = await import('@/lib/webhooks'); await dispatchPending(5); done()
}
export async function resendAllFailed(): Promise<R> {
  const { sb } = await requireOwner()
  await sb.from('webhook_logs').update({ status: 'pending', next_attempt_at: new Date().toISOString(), attempts: 0, error: null }).in('status', ['failed', 'dead'])
  const { dispatchPending } = await import('@/lib/webhooks'); const r = await dispatchPending(25); done()
  return { ok: true, message: `أُرسل ${r.sent} وفشل ${r.failed}` }
}

// ---------- WhatsApp Business API ----------
export async function saveWhatsApp(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner(); const id = String(fd.get('phone_id') ?? '').trim(); const tok = String(fd.get('token') ?? '').trim()
  if (id && !/^\d{8,25}$/.test(id)) return { error: 'Phone Number ID أرقام فقط' }
  const { error } = await save(sb, 'whatsapp', { config: { phone_id: id }, secrets: tok ? { token: encrypt(tok) } : {} }); if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, message: 'تم الحفظ' }
}
export async function testWhatsApp(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner(); const c = await row(sb, 'whatsapp'); const to = String(fd.get('to') ?? '').replace(/\D/g, '')
  const token = decrypt(c.secrets.token); const pid = String(c.config.phone_id ?? '')
  if (!pid || !token) return { error: 'احفظ Phone Number ID و Access Token أولاً' }
  if (to.length < 9) return { error: 'اكتب رقم الاستلام بالصيغة الدولية (مثل 970591234567)' }
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pid}/messages`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: 'رسالة اختبار من مفروشات العصار ✅' } }) })
    const j = await r.json().catch(() => ({})); await stamp(sb, 'whatsapp', r.ok ? 'ok' : 'fail'); done()
    return r.ok ? { ok: true, message: 'أُرسلت رسالة الاختبار' } : { error: `رفض واتساب: ${(j as { error?: { message?: string } }).error?.message ?? r.status}` }
  } catch { await stamp(sb, 'whatsapp', 'fail'); done(); return { error: 'تعذّر الاتصال بواتساب' } }
}

// ---------- Telegram ----------
export async function saveTelegram(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner(); const chat = String(fd.get('chat_id') ?? '').trim(); const tok = String(fd.get('token') ?? '').trim()
  if (chat && !/^-?\d{5,20}$/.test(chat)) return { error: 'Chat ID أرقام (قد يبدأ بـ -)' }
  if (tok && !/^\d+:[\w-]{20,}$/.test(tok)) return { error: 'صيغة Bot Token غير صحيحة' }
  const { error } = await save(sb, 'telegram', { config: { chat_id: chat }, secrets: tok ? { token: encrypt(tok) } : {} }); if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, message: 'تم الحفظ' }
}
export async function testTelegram(): Promise<R> {
  const { sb } = await requireOwner(); const c = await row(sb, 'telegram'); const token = decrypt(c.secrets.token); const chat = String(c.config.chat_id ?? '')
  if (!token || !chat) return { error: 'احفظ Bot Token و Chat ID أولاً' }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text: 'رسالة اختبار من مفروشات العصار ✅' }) })
    const j = await r.json().catch(() => ({})); await stamp(sb, 'telegram', r.ok ? 'ok' : 'fail'); done()
    return r.ok ? { ok: true, message: 'أُرسلت رسالة الاختبار' } : { error: `رفض تليجرام: ${(j as { description?: string }).description ?? r.status}` }
  } catch { await stamp(sb, 'telegram', 'fail'); done(); return { error: 'تعذّر الاتصال بتليجرام' } }
}

// ---------- Facebook + Gmail ----------
export async function saveFacebook(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner(); const page = String(fd.get('page_url') ?? '').trim(); const pixel = String(fd.get('pixel') ?? '').trim()
  if (page && !/^https:\/\/(www\.)?(facebook|fb)\.com\//i.test(page)) return { error: 'رابط الصفحة يبدأ بـ https://facebook.com/' }
  if (!/^(\d{5,20})?$/.test(pixel)) return { error: 'رقم Pixel أرقام فقط' }
  await save(sb, 'facebook', { config: { page_url: page } })
  const { error } = await sb.from('store_settings').upsert({ key: 'meta_pixel_id', value: pixel, is_public: true, updated_at: new Date().toISOString() }); if (error) return { error: 'تعذّر الحفظ' }
  revalidatePath('/', 'layout'); done(); return { ok: true, message: 'تم الحفظ' }
}
export async function saveGmail(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner(); const email = String(fd.get('email') ?? '').trim()
  if (email && !z.string().email().safeParse(email).success) return { error: 'الإيميل غير صحيح' }
  const { error } = await save(sb, 'gmail', { config: { email } }); if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, message: 'تم الحفظ (الإرسال الفعلي يتم من n8n)' }
}
