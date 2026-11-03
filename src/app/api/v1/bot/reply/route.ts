import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
import { decrypt } from '@/lib/secure'
import { sendTelegram } from '@/lib/webhooks'
export const dynamic = 'force-dynamic'
// n8n -> site: send the bot's reply to the customer on Telegram (with the site's bot token) and record it. send:false = record only.
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = z.object({ conversation_id: z.string().uuid(), text: z.string().trim().min(1).max(4000), send: z.boolean().default(true) }).safeParse(await req.json().catch(() => null)); if (!p.success) return jerr('بيانات غير صحيحة', 400)
  if (p.data.send) {
    const [{ data: chat }, { data: cfg }] = await Promise.all([serverRpc<string>('bot_chat_id', { p_conversation: p.data.conversation_id }), serverRpc<{ secrets: { token?: string } }>('bot_config', {})])
    const token = decrypt(cfg?.secrets?.token)
    if (!chat || !token) return jerr('المحادثة أو توكن البوت غير موجود', 400)
    const r = await sendTelegram(token, chat, p.data.text, null).catch(() => null)
    if (!r?.ok) return jerr('تعذّر الإرسال على تليجرام', 502)
  }
  const { error } = await serverRpc('bot_save_reply', { p_conversation: p.data.conversation_id, p_body: p.data.text }); if (error) return jerr('تعذّر الحفظ', 400)
  return NextResponse.json({ ok: true, sent: p.data.send })
}
