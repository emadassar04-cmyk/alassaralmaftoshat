import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Star } from 'lucide-react'
import { getBranches, getProduct, getProducts, getReviews } from '@/lib/data'
import { ProductBuy } from '@/components/store/ProductBuy'
import { ProductCard } from '@/components/store/ProductCard'
import { SITE, unitPrice } from '@/lib/format'

export const revalidate = 60
export async function generateStaticParams() { return (await getProducts()).map((p) => ({ slug: p.slug })) }
export async function generateMetadata(props: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const p = await getProduct((await props.params).slug)
  if (!p) return {}
  const img = p.product_images[0]?.url ?? '/img/og.jpg'
  return { title: p.name, description: p.description ?? undefined, alternates: { canonical: `/product/${p.slug}` }, openGraph: { title: p.name, description: p.description ?? undefined, images: [img] } }
}
export default async function ProductPage(props: PageProps<'/product/[slug]'>) {
  const p = await getProduct((await props.params).slug)
  if (!p) notFound()
  const [all, reviews, branches] = await Promise.all([getProducts(), getReviews(p.id), getBranches()])
  const images = [...p.product_images].sort((a, b) => a.sort - b.sort)
  const similar = all.filter((x) => x.id !== p.id && x.category_id === p.category_id).slice(0, 4)
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: images.map((i) => `${SITE}${i.url}`),
    offers: { '@type': 'Offer', priceCurrency: 'ILS', price: unitPrice(p), availability: 'https://schema.org/InStock', url: `${SITE}/product/${p.slug}` },
    ...(reviews.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}) }
  return (
    <div className="container-x py-8 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-3">
          {images.map((im, i) => (
            <div key={im.url} className="relative aspect-square overflow-hidden border border-copper/15 bg-night-2">
              <Image src={im.url} alt={im.alt ?? p.name} fill priority={i === 0} sizes="(max-width:768px) 100vw, 50vw" className="object-cover" /></div>))}
        </div>
        <div className="md:sticky md:top-24 md:self-start">
          {p.categories && <p className="eyebrow">{p.categories.name}</p>}
          <h1 className="font-display copper-text mt-2 text-4xl md:text-5xl">{p.name}</h1>
          {reviews.length > 0 && <p className="mt-2 flex items-center gap-1 text-sm text-copper-lt"><Star size={16} fill="currentColor" />{avg.toFixed(1)} <span className="text-muted">({reviews.length} تقييم)</span></p>}
          <p className="mt-4 text-cream/85">{p.description}</p>
          <div className="mt-6"><ProductBuy p={p} image={images[0]?.url ?? null} waPhone={branches[0]?.whatsapp ?? null} /></div>
        </div>
      </div>
      <section className="mt-16"><h2 className="font-display text-3xl text-copper-lt">التقييمات</h2>
        {reviews.length === 0 ? <p className="mt-3 text-muted">لا توجد تقييمات بعد. ستظهر تقييمات الزبائن هنا بعد مراجعتها.</p> : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">{reviews.map((r) => <li key={r.id} className="border border-copper/15 p-4"><p className="flex gap-0.5 text-copper">{Array.from({ length: r.rating }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</p><p className="mt-1">{r.body}</p><p className="mt-1 text-sm text-muted">{r.author_name}</p></li>)}</ul>)}
      </section>
      {similar.length > 0 && <section className="mt-16"><h2 className="font-display text-3xl text-copper-lt">منتجات مشابهة</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">{similar.map((s) => <ProductCard key={s.id} p={s} />)}</div></section>}
    </div>
  )
}
