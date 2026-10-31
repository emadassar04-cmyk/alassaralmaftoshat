import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp, friendly } from '@/lib/guard'
import { serverRpc } from '@/lib/supabase'

const S = z.object({ code: z.string().min(2).max(40), phone: z.string().max(20).default(''), subtotal: z.number().min(0) })
export async function POST(req: Request) {
  const p = S.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ valid: false, message: 'بيانات غير صحيحة' }, { status: 400 })
  const { data, error } = await serverRpc<{ valid: boolean; discount?: number; message: string }>('validate_coupon',
    { p_ip: await clientIp(), p_code: p.data.code, p_phone: p.data.phone, p_subtotal: p.data.subtotal })
  if (error || !data) return NextResponse.json({ valid: false, message: friendly(error?.message ?? '') }, { status: 400 })
  return NextResponse.json(data)
}
