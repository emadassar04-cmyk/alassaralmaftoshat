import { NextResponse } from 'next/server'
import { requireApiKey } from '@/lib/api-auth'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) { const d = await requireApiKey(req); if (d) return d; return NextResponse.json({ ok: true, service: 'alassar', time: new Date().toISOString() }) }
