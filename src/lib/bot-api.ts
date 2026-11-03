import { timingSafeEqual } from 'node:crypto'
import { serverRpc } from './supabase'
import { serverSig } from './secure'

export type BotConfig = { enabled?: boolean; provider?: 'gemini' | 'claude'; mode?: 'site' | 'n8n'; n8n_url?: string; fallback?: boolean; username?: string | null; connected?: boolean; relay?: { ok: boolean; at: string; error?: string } }
type Cfg = { config: BotConfig; secrets: Record<string, string> }
export async function botSettings() { const { data } = await serverRpc<Cfg>('bot_config', {}); return data?.config ?? {} }

/** Signs a relayed Telegram message so /api/v1/bot/incoming only accepts messages that really came through the site's webhook. */
export const relaySig = (updateId: number, chatId: string, text: string) => serverSig('bot-relay', `${updateId}:${chatId}:${text}`)
export function relaySigOk(updateId: number, chatId: string, text: string, sig: string) {
  const a = Buffer.from(relaySig(updateId, chatId, text)); const b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}
