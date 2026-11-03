import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = z.object({ conversation_id: z.string().uuid(), text: z.string().min(1).max(4000) }).safeParse(await req.json().catch(() => null)); if (!p.success) return jerr('بيانات غير صحيحة', 400)
  const { error } = await serverRpc('bot_save_reply', { p_conversation: p.data.conversation_id, p_body: p.data.text }); if (error) return jerr('تعذّر الحفظ', 400)
  return NextResponse.json({ ok: true })
}
