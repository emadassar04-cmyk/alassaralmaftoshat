'use client'
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { CartLine } from './types'
import { track } from './pixel'

type Ctx = {
  lines: CartLine[]; count: number; subtotal: number; open: boolean; setOpen: (v: boolean) => void
  add: (l: Omit<CartLine, 'key'>) => void; setQty: (key: string, q: number) => void; remove: (key: string) => void; clear: () => void
}
const C = createContext<Ctx | null>(null)
type A = { t: 'load'; lines: CartLine[] } | { t: 'add'; l: CartLine } | { t: 'qty'; key: string; q: number } | { t: 'rm'; key: string } | { t: 'clear' }
function reduce(s: CartLine[], a: A): CartLine[] {
  switch (a.t) {
    case 'load': return a.lines
    case 'add': { const e = s.find((x) => x.key === a.l.key); return e && !a.l.is_custom ? s.map((x) => (x.key === a.l.key ? { ...x, qty: Math.min(50, x.qty + a.l.qty) } : x)) : [...s, a.l] }
    case 'qty': return s.map((x) => (x.key === a.key ? { ...x, qty: Math.max(1, Math.min(50, a.q)) } : x))
    case 'rm': return s.filter((x) => x.key !== a.key)
    case 'clear': return []
  }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reduce, [])
  const [open, setOpen] = useState(false)
  const ready = useRef(false)
  useEffect(() => { try { dispatch({ t: 'load', lines: JSON.parse(localStorage.getItem('as_cart') || '[]') }) } catch {} setTimeout(() => { ready.current = true }, 0) }, [])
  useEffect(() => { if (ready.current) localStorage.setItem('as_cart', JSON.stringify(lines)) }, [lines])
  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen, count: lines.reduce((n, l) => n + l.qty, 0), subtotal: lines.reduce((n, l) => n + l.unit_price * l.qty, 0),
    add: (l) => {
      const key = l.is_custom ? `${l.product_id}:${l.variant_id}:${Date.now()}` : `${l.product_id}:${l.variant_id ?? ''}`
      dispatch({ t: 'add', l: { ...l, key } }); setOpen(true)
      track('AddToCart', { content_ids: [l.product_id], content_name: l.name, value: l.unit_price * l.qty, currency: 'ILS' })
    },
    setQty: (key, q) => dispatch({ t: 'qty', key, q }), remove: (key) => dispatch({ t: 'rm', key }), clear: () => dispatch({ t: 'clear' }),
  }), [lines, open])
  return <C.Provider value={value}>{children}</C.Provider>
}
export const useCart = () => { const c = useContext(C); if (!c) throw new Error('CartProvider missing'); return c }
