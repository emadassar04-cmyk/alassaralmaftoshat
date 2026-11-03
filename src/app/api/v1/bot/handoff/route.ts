import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
import { dispatchPending } from '@/lib/webhooks'
export const dynamic = 'force-dynamic'
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = z.object({ conversation_id: z.string().uuid(), reason: z.string().max(300).default('') }).safeParse(await req.json().catch(() => null)); if (!p.success) return jerr('بيانات غير صحيحة', 400)
  const { error } = await serverRpc('bot_handoff', { p_conversation: p.data.conversation_id, p_reason: p.data.reason }); if (error) return jerr('تعذّر التحويل', 400)
  after(() => dispatchPending(5))
  return NextResponse.json({ ok: true, message: 'تم التحويل لموظف، أخبر الزبون إنه رح يتواصل معه قريباً' })
}
