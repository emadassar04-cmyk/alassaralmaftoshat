import Link from 'next/link'

/** Wordmark: a quiet walnut monogram (the letter ع inside a rotated square, like a quilting stitch) + Arabic name + Latin signature. */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <rect x="8" y="8" width="24" height="24" rx="3" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="12.5" y="12.5" width="15" height="15" rx="2" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".55" />
      <text x="20" y="25.5" textAnchor="middle" fontSize="15" fontFamily="var(--font-display)" fill="currentColor">ع</text>
    </svg>
  )
}

export function Logo({ tone = 'dark', size = 'md' }: { tone?: 'dark' | 'light'; size?: 'md' | 'lg' }) {
  const c = tone === 'light' ? 'text-ivory' : 'text-charcoal'
  return (
    <Link href="/" aria-label="مفروشات العصار — الرئيسية" className={`inline-flex items-center gap-2.5 ${c}`}>
      <Mark className={`${size === 'lg' ? 'h-12 w-12' : 'h-9 w-9'} ${tone === 'light' ? 'text-gold' : 'text-brown'}`} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-medium ${size === 'lg' ? 'text-3xl' : 'text-[1.35rem]'}`}>العصار</span>
        <span className={`mt-1 whitespace-nowrap text-[9px] tracking-[0.38em] ${tone === 'light' ? 'text-gold' : 'text-muted'}`} dir="ltr">AL ASSAR · 1996</span>
      </span>
    </Link>
  )
}
