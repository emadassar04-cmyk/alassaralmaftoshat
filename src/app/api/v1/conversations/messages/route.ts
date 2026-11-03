import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
const S = z.object({ channel: z.enum(['telegram', 'whatsapp']), external_id: z.string().min(1).max(100), role: z.enum(['customer', 'bot']), text: z.string().min(1).max(4000),
  customer_name: z.string().max(100).optional(), phone: z.string().max(25).optional(), at: z.string().datetime().optional() })
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = S.safeParse(await req.json().catch(() => null)); if (!p.success) return jerr(p.error.issues[0]?.message ?? 'بيانات غير صحيحة', 400)
  const { data, error } = await serverRpc<string>('api_save_message', { p_channel: p.data.channel, p_external: p.data.external_id, p_name: p.data.customer_name ?? null, p_phone: p.data.phone ?? null, p_role: p.data.role, p_body: p.data.text, p_at: p.data.at ?? null })
  if (error) return jerr('تعذّر حفظ الرسالة', 400)
  return NextResponse.json({ ok: true, conversation_id: data }, { status: 201 })
}
