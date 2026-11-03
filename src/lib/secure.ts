import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes } from 'node:crypto'

// Integration secrets are encrypted at rest (AES-256-GCM). The key is derived from the server-only SERVER_RPC_SECRET, so the database alone cannot decrypt them.
const key = () => Buffer.from(hkdfSync('sha256', process.env.SERVER_RPC_SECRET ?? '', 'assar-integrations', 'v1', 32))
export function encrypt(plain: string) {
  const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return `v1:${iv.toString('base64')}:${c.getAuthTag().toString('base64')}:${ct.toString('base64')}`
}
export function decrypt(token?: string | null) {
  if (!token) return ''
  const [v, iv, tag, ct] = token.split(':')
  if (v !== 'v1') return ''
  try { const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64')); d.setAuthTag(Buffer.from(tag, 'base64')); return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8') } catch { return '' }
}
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
export const hmac = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('hex')
/** Server-only HMAC (key derived from SERVER_RPC_SECRET) used to prove a payload came from this site, e.g. bot messages relayed through n8n. */
export const serverSig = (label: string, body: string) => createHmac('sha256', Buffer.from(hkdfSync('sha256', process.env.SERVER_RPC_SECRET ?? '', 'assar-sig', label, 32))).update(body).digest('hex')
export const randomHex = (bytes: number) => randomBytes(bytes).toString('hex')
export const maskSecret = (s: string) => (s ? `••••••••${s.slice(-4)}` : '')
/** Only public https endpoints (no localhost / private networks) may be targeted by outgoing webhooks. */
export function safeHttpsUrl(u: string) {
  try {
    const x = new URL(u); const h = x.hostname.toLowerCase()
    if (process.env.NODE_ENV !== 'production' && x.protocol === 'http:' && h === 'localhost') return true // local testing only
    if (x.protocol !== 'https:') return false
    return !(h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/.test(h))
  } catch { return false }
}
