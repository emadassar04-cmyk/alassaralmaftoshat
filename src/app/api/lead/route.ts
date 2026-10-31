import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp, friendly, verifyTurnstile } from '@/lib/guard'
import { serverRpc } from '@/lib/supabase'

const S = z.object({ phone: z.string().min(7).max(20), hp: z.string().optional(), token: z.string().optional() })
export async function POST(req: Request) {
  const p = S.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
  if (p.data.hp) return NextResponse.json({ code: 'ASSAR-000000' }) // honeypot: pretend success
  const ip = await clientIp()
  if (!(await verifyTurnstile(p.data.token, ip))) return NextResponse.json({ error: 'تعذّر التحقق، أعد المحاولة' }, { status: 400 })
  const { data, error } = await serverRpc<{ code: string }>('create_lead', { p_ip: ip, p_phone: p.data.phone, p_source: 'popup' })
  if (error || !data) return NextResponse.json({ error: friendly(error?.message ?? '') }, { status: 400 })
  return NextResponse.json({ code: data.code })
}
