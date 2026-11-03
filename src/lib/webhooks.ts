import { decrypt, hmac, safeHttpsUrl } from './secure'
import { serverRpc } from './supabase'

type Claimed = { id: string; event: string; payload: unknown; created_at: string; attempts: number }
export const buildBody = (id: string, event: string, created_at: string, data: unknown) => JSON.stringify({ id, event, created_at, data })

export async function postToN8n(url: string, secret: string, id: string, event: string, created_at: string, data: unknown) {
  const body = buildBody(id, event, created_at, data)
  const res = await fetch(url, {
    method: 'POST', body, signal: AbortSignal.timeout(8000),
    headers: { 'content-type': 'application/json', 'x-assar-event': event, 'x-assar-delivery': id, 'x-assar-secret': secret, 'x-assar-signature': `sha256=${hmac(secret, body)}` },
  })
  return res
}

/** Sends due events to n8n. Failures are recorded and retried later; they never touch the order flow. Never throws. */
export async function dispatchPending(limit = 10): Promise<{ sent: number; failed: number }> {
  const out = { sent: 0, failed: 0 }
  try {
    const { data: cfg } = await serverRpc<{ config: { enabled?: boolean; webhook_url?: string }; secrets: { signing?: string } }>('dispatch_config', {})
    if (!cfg?.config?.enabled || !cfg.config.webhook_url || !safeHttpsUrl(cfg.config.webhook_url)) return out
    const secret = decrypt(cfg.secrets?.signing)
    const { data: rows } = await serverRpc<Claimed[]>('dispatch_claim', { p_limit: limit })
    for (const r of rows ?? []) {
      let ok = false, http: number | null = null, err: string | null = null
      try { const res = await postToN8n(cfg.config.webhook_url, secret, r.id, r.event, r.created_at, r.payload); http = res.status; ok = res.ok; if (!ok) err = `HTTP ${res.status}` }
      catch (e) { err = e instanceof Error ? e.message : 'network error' }
      await serverRpc('dispatch_result', { p_id: r.id, p_ok: ok, p_http: http, p_error: err })
      if (ok) out.sent++; else out.failed++
    }
  } catch (e) { console.error('[dispatch]', e) }
  return out
}
