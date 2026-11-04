import type { HTMLAttributes } from 'react'
/** Frosted-glass surface used across the glass store theme. */
export function GlassCard({ className = '', strong = false, ...p }: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return <div {...p} className={`${strong ? 'glass-strong' : 'glass'} rounded-3xl ${className}`} />
}
