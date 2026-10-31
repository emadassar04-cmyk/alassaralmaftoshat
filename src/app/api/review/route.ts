import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp, friendly } from '@/lib/guard'
import { serverRpc } from '@/lib/supabase'

const S = z.object({ token: z.string().min(20).max(100), product_id: z.string().uuid(), rating: z.number().int().min(1).max(5), name: z.string().min(2).max(60), body: z.string().max(1000).default('') })
export async function POST(req: Request) {
  const p = S.safeParse(await req.json().catch(() => null))
  if (!p.success) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
  const { error } = await serverRpc('submit_review', { p_ip: await clientIp(), p_token: p.data.token, p_product: p.data.product_id, p_rating: p.data.rating, p_name: p.data.name, p_body: p.data.body })
  if (error) return NextResponse.json({ error: friendly(error.message) }, { status: 400 })
  return NextResponse.json({ ok: true })
}
