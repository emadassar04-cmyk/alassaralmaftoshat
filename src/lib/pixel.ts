declare global { interface Window { fbq?: (...a: unknown[]) => void } }
export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) window.fbq('track', event, data)
}
