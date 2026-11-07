'use client'
import type { ReactNode } from 'react'
import { CartProvider } from '@/lib/cart'

// Native scrolling only: smooth-scroll libraries hijack the wheel/touch and feel heavy on phones.
export function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}
