import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
import { botSettings } from '@/lib/bot-api'

export const dynamic = 'force-dynamic'
const S = z.object({ update_id: z.coerce.number().int(), chat_id: z.union([z.string(), z.number()]).transform(String), name: z.string().max(100).optional().nullable(), text: z.string().min(1).max(4000) })
// n8n -> site: store the customer's message (once per Telegram update) and tell n8n whether the bot should answer.
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = S.safeParse(await req.json().catch(() => null)); if (!p.success) return jerr(p.error.issues[0]?.message ?? 'بيانات غير صحيحة', 400)
  const { data: st } = await serverRpc<{ duplicate: boolean; conversation_id?: string; handled_by?: string }>('bot_ingest', { p_update_id: p.data.update_id, p_chat_id: p.data.chat_id, p_name: p.data.name ?? null, p_text: p.data.text })
  if (!st) return jerr('تعذّر الحفظ', 500)
  if (st.duplicate) return NextResponse.json({ ok: true, duplicate: true, should_reply: false })
  const cfg = await botSettings()
  const { data: hist } = await serverRpc<{ role: string; body: string }[]>('bot_history', { p_conversation: st.conversation_id, p_limit: 20 })
  const history = (hist ?? []).map((m) => ({ role: m.role === 'customer' ? 'customer' : 'assistant', text: m.body }))
  const should_reply = !!cfg.enabled && st.handled_by === 'bot'
  return NextResponse.json({ ok: true, duplicate: false, conversation_id: st.conversation_id, should_reply, reason: !cfg.enabled ? 'bot_disabled' : st.handled_by === 'human' ? 'human_handling' : null,
    is_start: p.data.text.trim() === '/start', history, history_text: history.slice(0, -1).map((m) => `${m.role === 'customer' ? 'الزبون' : 'المساعد'}: ${m.text}`).join('\n') })
}
