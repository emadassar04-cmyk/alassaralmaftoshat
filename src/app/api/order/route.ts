import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp, friendly, verifyTurnstile } from '@/lib/guard'
import { sb, serverRpc } from '@/lib/supabase'
import { SITE, orderMessage, waLink } from '@/lib/format'
import type { TrackedOrder } from '@/lib/types'

const S = z.object({
  name: z.string().min(2).max(80), phone: z.string().min(7).max(20), branch_id: z.string().uuid(),
  fulfillment: z.enum(['pickup', 'delivery']), address: z.string().max(300).optional(),
  payment_method: z.enum(['in_store', 'cod', 'palpay', 'jawwal_pay', 'bank_palestine']),
  coupon_code: z.string().max(40).optional(), notes: z.string().max(1000).optional(), hp: z.string().optional(), token: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(), variant_id: z.string().uuid().nullable().optional(), qty: z.number().int().min(1).max(50),
    measurements: z.record(z.string(), z.string().max(200)).nullable().optional(),
  })).min(1).max(30),
})
// Prices are NEVER taken from the browser: create_order() recomputes everything from the database.
export async function POST(req: Request) {
  const p = S.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ error: 'بيانات الطلب غير مكتملة' }, { status: 400 })
  if (p.data.hp) return NextResponse.json({ error: 'تعذّر إرسال الطلب' }, { status: 400 })
  const ip = await clientIp()
  if (!(await verifyTurnstile(p.data.token, ip))) return NextResponse.json({ error: 'تعذّر التحقق، أعد المحاولة' }, { status: 400 })
  const payload = { ...p.data, hp: undefined, token: undefined }
  const { data, error } = await serverRpc<{ number: string; token: string }>('create_order', { p_ip: ip, p_payload: payload })
  if (error || !data) return NextResponse.json({ error: friendly(error?.message ?? '') }, { status: 400 })
  const { data: o } = await sb().rpc('get_order_by_token', { p_token: data.token })
  const order = o as TrackedOrder | null
  const track = `${SITE}/track/${data.token}`
  return NextResponse.json({ number: data.number, token: data.token, whatsapp: order ? waLink(order.branch.whatsapp, orderMessage(order, track)) : null })
}
