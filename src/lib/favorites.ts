'use client'
import { useCallback, useSyncExternalStore } from 'react'

/** Visitor favorites, kept on the device (no accounts). Stored as product slugs. */
const KEY = 'as_favs'
const EVT = 'as-favs'
let cache: string[] | null = null
const read = (): string[] => {
  if (cache) return cache
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); cache = Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 200) : [] } catch { cache = [] }
  return cache
}
const EMPTY: string[] = []
function subscribe(cb: () => void) {
  const on = (e: Event) => { if (e instanceof StorageEvent && e.key !== KEY) return; cache = null; cb() }
  window.addEventListener(EVT, on); window.addEventListener('storage', on)
  return () => { window.removeEventListener(EVT, on); window.removeEventListener('storage', on) }
}
export function useFavorites() {
  const favs = useSyncExternalStore(subscribe, read, () => EMPTY)
  const toggle = useCallback((slug: string) => {
    const cur = read(); const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur]
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    cache = next; window.dispatchEvent(new Event(EVT))
  }, [])
  return { favs, has: (slug: string) => favs.includes(slug), toggle, count: favs.length }
}
