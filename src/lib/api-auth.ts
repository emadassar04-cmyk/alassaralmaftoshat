import { NextResponse } from 'next/server'
import { serverRpc } from './supabase'
import { sha256 } from './secure'

export const jerr = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })
/** Returns a Response when the request is NOT allowed, otherwise null. Header: X-API-Key. A disabled integration rejects everything. */
export async function requireApiKey(req: Request) {
  const k = req.headers.get('x-api-key') ?? ''
  if (!/^as_live_[a-f0-9]{32}$/.test(k)) return jerr('مفتاح API مفقود أو غير صحيح', 401)
  const { data } = await serverRpc<boolean>('api_authenticate', { p_hash: sha256(k) })
  return data === true ? null : jerr('مفتاح غير صالح أو الربط متوقف', 401)
}
