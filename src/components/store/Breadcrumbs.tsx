import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { SITE } from '@/lib/format'

/** Visible breadcrumbs + schema.org BreadcrumbList (helps Google show the path in results). */
export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const all = [{ href: '/', label: 'الرئيسية' }, ...items]
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: `${SITE}${c.href}` } : {}) })) }
  return (
    <nav aria-label="مسار التصفح" className="text-[13px] text-ink-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronLeft size={13} className="text-muted" aria-hidden />}
            {c.href && i < all.length - 1 ? <Link href={c.href} className="link-u hover:text-charcoal">{c.label}</Link> : <span aria-current="page" className="text-charcoal">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHead({ crumbs, eyebrow, title, sub, children }: { crumbs: { href?: string; label: string }[]; eyebrow?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="border-b hairline bg-sand/60">
      <div className="container-x pb-10 pt-8 md:pb-14 md:pt-10">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <p className="eyebrow mt-8">{eyebrow}</p>}
        <h1 className="t-h2 mt-4 !text-[clamp(2.1rem,5.4vw,3.8rem)]">{title}</h1>
        {sub && <p className="t-lead mt-4 max-w-2xl">{sub}</p>}
        {children}
      </div>
    </header>
  )
}
