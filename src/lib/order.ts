import { sb } from './supabase'
import type { TrackedOrder } from './types'
export async function getOrderByToken(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null
  const { data } = await sb().rpc('get_order_by_token', { p_token: token })
  return (data as TrackedOrder | null) ?? null
}
