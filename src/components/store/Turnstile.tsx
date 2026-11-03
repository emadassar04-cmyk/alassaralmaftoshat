'use client'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id?: string) => void } } }
const KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Cloudflare Turnstile. Tokens are single-use: bump `resetKey` after a failed submit to get a fresh one. */
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (t: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null); const id = useRef<string | null>(null)
  useEffect(() => {
    if (!KEY) return
    const t = setInterval(() => {
      if (window.turnstile && ref.current && !id.current) {
        id.current = window.turnstile.render(ref.current, { sitekey: KEY, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken(''), theme: 'dark', language: 'ar' })
        clearInterval(t)
      }
    }, 300)
    return () => { clearInterval(t); if (id.current && window.turnstile) { window.turnstile.remove(id.current); id.current = null } }
  }, [onToken])
  useEffect(() => { if (resetKey && id.current && window.turnstile) { onToken(''); window.turnstile.reset(id.current) } }, [resetKey, onToken])
  if (!KEY) return null
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" /><div ref={ref} className="my-2 min-h-[65px]" /></>
}
