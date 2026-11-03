import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
import { dispatchPending } from '@/lib/webhooks'
export const dynamic = 'force-dynamic'
export async function PATCH(req: Request, ctx: { params: Promise<{ number: string }> }) {
  const d = await requireApiKey(req); if (d) return d
  const { number } = await ctx.params
  const p = z.object({ status: z.enum(['new', 'confirmed', 'ready', 'received', 'cancelled']) }).safeParse(await req.json().catch(() => null))
  if (!p.success || !/^AS-\d{3,8}$/i.test(number)) return jerr('الحالة أو رقم الطلب غير صحيح', 400)
  const { data, error } = await serverRpc<{ number: string; status: string }>('api_set_order_status', { p_number: number, p_status: p.data.status })
  if (error || !data) return jerr(error?.message.includes('not_found') ? 'الطلب غير موجود' : error?.message.includes('stock') || error?.message.includes('check') ? 'المخزون لا يكفي لتأكيد الطلب' : 'تعذّر تحديث الحالة', error?.message.includes('not_found') ? 404 : 400)
  after(() => dispatchPending())
  return NextResponse.json({ ok: true, ...data })
}
