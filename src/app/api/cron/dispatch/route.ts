import { NextResponse } from 'next/server'
import { dispatchPending } from '@/lib/webhooks'
import { serverRpc } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
// Safety-net retry (daily on the Hobby plan). Harmless to call publicly: it only processes events already due, and backoff is enforced in the database.
// Also enqueues the morning digest of today's measurement visits (once per day, enforced in the DB).
export async function GET() { await serverRpc('visits_digest', {}); const r = await dispatchPending(20); return NextResponse.json({ ok: true, ...r }) }
