import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serverRpc } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
// Public: free/booked counts per slot for one branch (no personal data).
export async function GET(req: Request) {
  const b = z.string().uuid().safeParse(new URL(req.url).searchParams.get('branch'))
  if (!b.success) return NextResponse.json({ error: 'الفرع غير صحيح' }, { status: 400 })
  const { data, error } = await serverRpc('visit_availability', { p_branch: b.data })
  if (error || !data) return NextResponse.json({ error: 'تعذّر تحميل المواعيد' }, { status: 500 })
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } })
}
