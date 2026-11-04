'use client'
export function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${active ? 'gold-grad shadow-[0_6px_18px_-6px_rgba(201,162,39,.7)]' : 'glass !shadow-none text-charcoal hover:bg-white/70'}`}>{children}</button>
  )
}
