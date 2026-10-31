'use client'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string } } }
const KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!KEY) return
    const t = setInterval(() => {
      if (window.turnstile && ref.current && !ref.current.hasChildNodes()) {
        window.turnstile.render(ref.current, { sitekey: KEY, callback: onToken, theme: 'dark', language: 'ar' }); clearInterval(t)
      }
    }, 300)
    return () => clearInterval(t)
  }, [onToken])
  if (!KEY) return null
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" /><div ref={ref} className="my-2" /></>
}
