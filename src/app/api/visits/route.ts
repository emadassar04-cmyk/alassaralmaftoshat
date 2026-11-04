import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { clientIp, friendly, verifyTurnstile } from '@/lib/guard'
import { serverRpc } from '@/lib/supabase'
import { dispatchPending } from '@/lib/webhooks'

const S = z.object({
  name: z.string().min(2).max(80), phone: z.string().min(7).max(20), branch_id: z.string().uuid(),
  area: z.string().min(2).max(80), address: z.string().max(300).optional(), notes: z.string().max(500).optional(),
  items: z.array(z.string().max(40)).max(10).default([]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.string().regex(/^\d{2}:\d{2}$/),
  hp: z.string().optional(), token: z.string().optional(),
})
// Booking is validated again in create_visit(): window, open days, slot list and capacity (with a lock against double booking).
export async function POST(req: Request) {
  const p = S.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ error: 'الرجاء تعبئة الحقول المطلوبة' }, { status: 400 })
  if (p.data.hp) return NextResponse.json({ error: 'تعذّر إرسال الحجز' }, { status: 400 })
  const ip = await clientIp()
  if (!(await verifyTurnstile(p.data.token, ip))) return NextResponse.json({ error: 'تعذّر التحقق، أعد المحاولة' }, { status: 400 })
  const { data, error } = await serverRpc<{ number: string; date: string; slot: string; branch: string; whatsapp: string | null }>('create_visit', { p_ip: ip, p_payload: { ...p.data, hp: undefined, token: undefined } })
  if (error || !data) return NextResponse.json({ error: friendly(error?.message ?? ''), code: error?.message?.includes('slot_taken') ? 'slot_taken' : undefined }, { status: 400 })
  after(() => dispatchPending())
  return NextResponse.json(data)
}
