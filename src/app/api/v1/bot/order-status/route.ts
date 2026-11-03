import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
import { runTool } from '@/lib/bot'
export const dynamic = 'force-dynamic'
// ?number=AS-1005&phone=059... — answers only when the phone matches the order (no data about other customers).
export async function GET(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  const u = new URL(req.url).searchParams
  return new NextResponse(await runTool('get_order_status', { order_number: u.get('number') ?? '', phone: u.get('phone') ?? '' }, ''), { headers: { 'content-type': 'application/json' } })
}
