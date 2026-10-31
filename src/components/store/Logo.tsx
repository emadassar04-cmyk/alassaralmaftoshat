import Link from 'next/link'
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Link href="/" className="inline-flex flex-col items-center leading-none">
      <span className={`font-display copper-text ${size === 'lg' ? 'text-5xl' : 'text-2xl'}`}>العصار</span>
      <span className="mt-1 text-[9px] tracking-[0.45em] text-copper" dir="ltr">AL-ASSAR · SINCE 1996</span>
    </Link>
  )
}
