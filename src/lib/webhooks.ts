import { decrypt, hmac, safeHttpsUrl } from './secure'
import { serverRpc } from './supabase'
import { telegramText } from './telegram-messages'

type Claimed = { id: string; event: string; payload: Record<string, unknown>; created_at: string; attempts: number; target: 'n8n' | 'telegram' }
type Cfg = Record<string, { config: Record<string, unknown>; secrets: Record<string, string> }>
export const buildBody = (id: string, event: string, created_at: string, data: unknown) => JSON.stringify({ id, event, created_at, data })

export async function postToN8n(url: string, secret: string, id: string, event: string, created_at: string, data: unknown) {
  const body = buildBody(id, event, created_at, data)
  return fetch(url, {
    method: 'POST', body, signal: AbortSignal.timeout(8000),
    headers: { 'content-type': 'application/json', 'x-assar-event': event, 'x-assar-delivery': id, 'x-assar-secret': secret, 'x-assar-signature': `sha256=${hmac(secret, body)}` },
  })
}
export async function sendTelegram(token: string, chatId: string, text: string, parseMode: 'HTML' | null = 'HTML') {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', signal: AbortSignal.timeout(10000), headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...(parseMode ? { parse_mode: parseMode } : {}), disable_web_page_preview: true }),
  })
}

/** Delivers due outbox events (n8n webhook and/or direct Telegram). Failures are recorded and retried; they never touch the order flow. Never throws. */
export async function dispatchPending(limit = 10): Promise<{ sent: number; failed: number }> {
  const out = { sent: 0, failed: 0 }
  try {
    const { data: cfg } = await serverRpc<Cfg>('dispatch_config2', {})
    const { data: rows } = await serverRpc<Claimed[]>('dispatch_claim2', { p_limit: limit })
    for (const r of rows ?? []) {
      let ok = false, http: number | null = null, err: string | null = null
      try {
        if (r.target === 'telegram') {
          const t = cfg?.telegram; const token = decrypt(t?.secrets?.token); const chat = String(t?.config?.chat_id ?? '')
          const text = telegramText(r.event, (r.payload ?? {}) as Record<string, unknown>)
          if (!text) { ok = true; http = 204 } // nothing to notify for this event
          else if (!token || !chat) err = 'تليجرام غير مضبوط'
          else { const res = await sendTelegram(token, chat, text); http = res.status; ok = res.ok; if (!ok) err = `Telegram ${res.status}: ${((await res.json().catch(() => ({}))) as { description?: string }).description ?? ''}` }
        } else {
          const n = cfg?.n8n; const url = String(n?.config?.webhook_url ?? '')
          if (!n?.config?.enabled || !url || !safeHttpsUrl(url)) err = 'n8n متوقف أو الرابط غير صالح'
          else { const res = await postToN8n(url, decrypt(n.secrets?.signing), r.id, r.event, r.created_at, r.payload); http = res.status; ok = res.ok; if (!ok) err = `HTTP ${res.status}` }
        }
      } catch (e) { err = e instanceof Error ? e.message : 'network error' }
      await serverRpc('dispatch_result', { p_id: r.id, p_ok: ok, p_http: http, p_error: err })
      if (ok) out.sent++; else out.failed++
    }
  } catch (e) { console.error('[dispatch]', e) }
  return out
}
