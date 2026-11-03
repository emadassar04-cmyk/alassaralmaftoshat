import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { friendly } from '@/lib/guard'
import { serverRpc } from '@/lib/supabase'
import { dispatchPending } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'
const S = z.object({
  name: z.string().min(2).max(80), phone: z.string().min(7).max(20), branch: z.string().min(2).max(60), // branch slug or id
  fulfillment: z.enum(['pickup', 'delivery']), address: z.string().max(300).optional(), payment_method: z.enum(['in_store', 'cod', 'palpay', 'jawwal_pay', 'bank_palestine']),
  coupon_code: z.string().max(40).optional(), notes: z.string().max(1000).optional(),
  items: z.array(z.object({ product_id: z.string().uuid(), variant_id: z.string().uuid().nullable().optional(), qty: z.number().int().min(1).max(50), measurements: z.record(z.string(), z.string().max(200)).nullable().optional() })).min(1).max(30),
})
// Prices are recomputed by the database exactly like website orders.
export async function POST(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const p = S.safeParse(await req.json().catch(() => null)); if (!p.success) return jerr(p.error.issues[0]?.message ?? 'بيانات غير صحيحة', 400)
  const { branch, ...rest } = p.data
  const isId = /^[0-9a-f-]{36}$/.test(branch)
  const { data, error } = await serverRpc<{ number: string; token: string; total: number }>('create_order', { p_ip: 'api', p_payload: { ...rest, ...(isId ? { branch_id: branch } : { branch_slug: branch }) } })
  if (error || !data) return jerr(friendly(error?.message ?? ''), 400)
  after(() => dispatchPending())
  return NextResponse.json({ ok: true, number: data.number, total: data.total, track_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/track/${data.token}` }, { status: 201 })
}
