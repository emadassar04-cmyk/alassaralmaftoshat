import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
import { runTool } from '@/lib/bot'
export const dynamic = 'force-dynamic'
// Compact, bot-friendly product search: ?q=ستائر
export async function GET(req: Request) {
  const d = await requireApiKey(req); if (d) return d
  return new NextResponse(await runTool('get_products', { query: new URL(req.url).searchParams.get('q') ?? '' }, ''), { headers: { 'content-type': 'application/json' } })
}
