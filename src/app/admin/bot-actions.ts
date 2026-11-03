'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOwner } from '@/lib/admin'
import { decrypt, encrypt, randomHex, sha256 } from '@/lib/secure'
import { SITE } from '@/lib/format'
import { sendTelegram } from '@/lib/webhooks'

type R = { ok?: boolean; error?: string; message?: string }
type Sb = Awaited<ReturnType<typeof requireOwner>>['sb']
async function botRow(sb: Sb) {
  const { data } = await sb.from('integration_settings').select('config, secrets').eq('key', 'bot').maybeSingle()
  return { config: (data?.config ?? {}) as Record<string, unknown>, secrets: (data?.secrets ?? {}) as Record<string, string> }
}
async function saveRow(sb: Sb, patch: { config?: Record<string, unknown>; secrets?: Record<string, string> }) {
  const cur = await botRow(sb)
  return sb.from('integration_settings').upsert({ key: 'bot', config: { ...cur.config, ...patch.config }, secrets: { ...cur.secrets, ...patch.secrets }, updated_at: new Date().toISOString() })
}
const done = () => { revalidatePath('/admin/bot'); revalidatePath('/admin/conversations', 'layout') }
const tg = (token: string, method: string, body?: unknown) => fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })

export async function saveBotKeys(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner()
  const token = String(fd.get('token') ?? '').trim(); const key = String(fd.get('anthropic_key') ?? '').trim()
  if (token && !/^\d+:[\w-]{20,}$/.test(token)) return { error: 'صيغة Bot Token غير صحيحة' }
  if (key && !/^sk-ant-[\w-]{20,}$/.test(key)) return { error: 'مفتاح Claude يبدأ بـ sk-ant-' }
  const secrets: Record<string, string> = {}
  if (token) secrets.token = encrypt(token); if (key) secrets.anthropic_key = encrypt(key)
  const { error } = await saveRow(sb, { secrets, ...(token ? { config: { username: null, connected: false } } : {}) })
  if (error) return { error: 'تعذّر الحفظ' }
  done(); return { ok: true, message: token ? 'تم الحفظ. اضغط «ربط البوت بتليجرام» الآن.' : 'تم الحفظ' }
}

export async function connectBot(): Promise<R> {
  const { sb } = await requireOwner(); const row = await botRow(sb); const token = decrypt(row.secrets.token)
  if (!token) return { error: 'احفظ Bot Token أولاً' }
  try {
    const me = await (await tg(token, 'getMe')).json() as { ok: boolean; result?: { username: string } }
    if (!me.ok) return { error: 'التوكن غير صالح. انسخه من جديد من @BotFather' }
    const secret = randomHex(24)
    const r = await (await tg(token, 'setWebhook', { url: `${SITE}/api/telegram/bot`, secret_token: secret, allowed_updates: ['message'], drop_pending_updates: true })).json() as { ok: boolean; description?: string }
    if (!r.ok) return { error: `رفض تليجرام: ${r.description ?? ''}` }
    await saveRow(sb, { config: { username: me.result?.username, connected: true }, secrets: { webhook_hash: sha256(secret) } })
    done(); return { ok: true, message: `تم الربط مع @${me.result?.username}` }
  } catch { return { error: 'تعذّر الاتصال بتليجرام، جرّب بعد قليل' } }
}

export async function setBotEnabled(fd: FormData) {
  const { sb } = await requireOwner(); await saveRow(sb, { config: { enabled: fd.get('enabled') === '1' } }); done()
}

export async function setHandledBy(fd: FormData) {
  const { sb } = await requireOwner()
  const id = z.string().uuid().parse(fd.get('id')); const to = z.enum(['bot', 'human']).parse(fd.get('to'))
  await sb.from('bot_conversations').update({ handled_by: to, needs_human: false }).eq('id', id); done()
}

export async function sendManualReply(_: R | undefined, fd: FormData): Promise<R> {
  const { sb } = await requireOwner()
  const p = z.object({ id: z.string().uuid(), text: z.string().trim().min(1).max(4000) }).safeParse({ id: fd.get('id'), text: fd.get('text') })
  if (!p.success) return { error: 'اكتب رسالة' }
  const { data: c } = await sb.from('bot_conversations').select('id, channel, external_id').eq('id', p.data.id).maybeSingle()
  if (!c || c.channel !== 'telegram') return { error: 'الرد اليدوي متاح لمحادثات تليجرام فقط' }
  const token = decrypt((await botRow(sb)).secrets.token)
  if (!token) return { error: 'بوت الزبائن غير مضبوط' }
  const r = await sendTelegram(token, c.external_id, p.data.text, null).catch(() => null)
  if (!r?.ok) return { error: 'تعذّر الإرسال (ربما حظر الزبون البوت)' }
  await sb.from('bot_messages').insert({ conversation_id: c.id, role: 'bot', author: 'human', body: p.data.text })
  await sb.from('bot_conversations').update({ handled_by: 'human', needs_human: false, last_message_at: new Date().toISOString() }).eq('id', c.id)
  done(); return { ok: true }
}
