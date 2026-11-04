'use client'
import { ArrowUpDown } from 'lucide-react'
export const SORTS = [['default', 'المميز'], ['new', 'الأحدث'], ['asc', 'السعر من الأقل'], ['desc', 'السعر من الأعلى']] as const
export function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="glass relative flex h-12 items-center rounded-2xl !shadow-none ps-10 pe-3">
      <span className="sr-only">الترتيب</span>
      <ArrowUpDown size={16} className="pointer-events-none absolute start-4 text-charcoal/60" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full w-full cursor-pointer appearance-none bg-transparent pe-6 text-sm font-medium text-charcoal outline-none">
        {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  )
}
