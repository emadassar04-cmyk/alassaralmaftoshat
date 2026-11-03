import { NextResponse } from 'next/server'
import { requireApiKey, jerr } from '@/lib/api-auth'
import { serverRpc } from '@/lib/supabase'
export const dynamic = 'force-dynamic'
export async function GET(req: Request, ctx: { params: Promise<{ number: string }> }) {
  const d = await requireApiKey(req); if (d) return d
  const { number } = await ctx.params
  if (!/^AS-\d{3,8}$/i.test(number)) return jerr('رقم الطلب غير صحيح (مثال: AS-1001)', 400)
  const { data } = await serverRpc<Record<string, unknown> | null>('api_get_order', { p_number: number })
  if (!data) return jerr('الطلب غير موجود', 404)
  return NextResponse.json({ ok: true, order: { ...data, track_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/track/${data.track_token}` } })
}
