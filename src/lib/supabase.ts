import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Anonymous server client: only what RLS lets the public read. */
export function sb() {
  return createClient(url || 'http://localhost', anon || 'anon', { auth: { persistSession: false, autoRefreshToken: false } })
}
export const hasSupabase = Boolean(url && anon)

/** Server-only: calls the SECURITY DEFINER RPCs with the shared secret (never reaches the browser). */
export async function serverRpc<T = unknown>(fn: string, args: Record<string, unknown>) {
  const secret = process.env.SERVER_RPC_SECRET
  if (!secret) throw new Error('SERVER_RPC_SECRET is not set')
  return sb().rpc(fn, { p_secret: secret, ...args }) as unknown as Promise<{ data: T | null; error: { message: string } | null }>
}
