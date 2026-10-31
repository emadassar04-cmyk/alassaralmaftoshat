'use client'
import { useEffect, type ReactNode } from 'react'
import { CartProvider } from '@/lib/cart'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let stop = () => {}
    // smooth scroll is a luxury: load it only once the browser is idle, never on the critical path
    const start = async () => {
      const { default: Lenis } = await import('lenis')
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
      let raf = requestAnimationFrame(function loop(t) { lenis.raf(t); raf = requestAnimationFrame(loop) })
      stop = () => { cancelAnimationFrame(raf); lenis.destroy() }
    }
    let idle: number | undefined; let timer: ReturnType<typeof setTimeout> | undefined
    if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => void start(), { timeout: 4000 })
    else timer = setTimeout(() => void start(), 2500)
    return () => { if (idle !== undefined) window.cancelIdleCallback(idle); clearTimeout(timer); stop() }
  }, [])
  return <CartProvider>{children}</CartProvider>
}
