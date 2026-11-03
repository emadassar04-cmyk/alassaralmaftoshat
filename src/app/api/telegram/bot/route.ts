import { NextResponse, after } from 'next/server'
import { serverRpc } from '@/lib/supabase'
import { decrypt, sha256 } from '@/lib/secure'
import { sendTelegram, dispatchPending } from '@/lib/webhooks'
import { botReply } from '@/lib/bot'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
type Cfg = { config: { enabled?: boolean }; secrets: { token?: string; anthropic_key?: string; webhook_hash?: string } }
type Update = { update_id: number; message?: { chat: { id: number; type: string }; from?: { first_name?: string; last_name?: string; username?: string }; text?: string } }

const WELCOME = 'أهلاً وسهلاً فيك بمفروشات العصار 👋\nأنا المساعد التلقائي، بقدر أساعدك بالأسعار والمنتجات والتفصيل وحالة طلبك.\nشو بتحب تعرف؟'

// Telegram -> site. Always answers 200 quickly; the reply is produced in the background (after()).
export async function POST(req: Request) {
  const { data: cfg } = await serverRpc<Cfg>('bot_config', {})
  const hdr = req.headers.get('x-telegram-bot-api-secret-token') ?? ''
  if (!cfg?.secrets?.webhook_hash || sha256(hdr) !== cfg.secrets.webhook_hash) return NextResponse.json({ ok: false }, { status: 401 })
  const u = (await req.json().catch(() => null)) as Update | null
  const msg = u?.message
  if (!u || !msg || msg.chat.type !== 'private') return NextResponse.json({ ok: true })
  const token = decrypt(cfg.secrets.token); const chat = String(msg.chat.id)
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || msg.from?.username || null
  after(async () => {
    try {
      if (!msg.text) { await sendTelegram(token, chat, 'حالياً بقدر أقرأ الرسائل المكتوبة بس 🙏 اكتبلي سؤالك.', null); return }
      const { data: st } = await serverRpc<{ duplicate: boolean; conversation_id?: string; handled_by?: string }>('bot_ingest', { p_update_id: u.update_id, p_chat_id: chat, p_name: name, p_text: msg.text })
      if (!st || st.duplicate || !st.conversation_id) return
      if (!cfg.config.enabled || st.handled_by === 'human') return // human mode: the owner replies from the dashboard
      let text: string
      if (msg.text.trim() === '/start') text = WELCOME
      else {
        const key = decrypt(cfg.secrets.anthropic_key)
        if (!key) return
        const { data: hist } = await serverRpc<{ role: string; body: string }[]>('bot_history', { p_conversation: st.conversation_id, p_limit: 20 })
        text = (await botReply(key, st.conversation_id, hist ?? [])).text
      }
      if (!text) return
      const r = await sendTelegram(token, chat, text.slice(0, 4000), null)
      if (r.ok) await serverRpc('bot_save_reply', { p_conversation: st.conversation_id, p_body: text })
      await dispatchPending(5) // deliver a possible handoff notification right away
    } catch (e) {
      console.error('[telegram-bot]', e)
      await sendTelegram(token, chat, 'صار عندنا خلل مؤقت، جرّب كمان شوي أو راسلنا على واتساب 🙏', null).catch(() => {})
    }
  })
  return NextResponse.json({ ok: true })
}
