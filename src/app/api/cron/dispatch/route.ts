import { NextResponse } from 'next/server'
import { dispatchPending } from '@/lib/webhooks'

export const dynamic = 'force-dynamic'
// Safety-net retry (daily on the Hobby plan). Harmless to call publicly: it only processes events already due, and backoff is enforced in the database.
export async function GET() { const r = await dispatchPending(20); return NextResponse.json({ ok: true, ...r }) }
