import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MessageCircle, Ruler, Star, Store, Truck } from 'lucide-react'
import { getBranches, getProduct, getProducts, getReviews } from '@/lib/data'
import { ProductBuy } from '@/components/store/ProductBuy'
import { ProductCard } from '@/components/store/ProductCard'
import { Breadcrumbs } from '@/components/store/Breadcrumbs'
import { Gallery } from '@/components/store/Gallery'
import { SITE, inStock, slugParam, unitPrice } from '@/lib/format'

export const revalidate = 60
export async function generateStaticParams() { return (await getProducts()).map((p) => ({ slug: p.slug })) }
export async function generateMetadata(props: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const p = await getProduct(slugParam((await props.params).slug))
  if (!p) return {}
  const img = p.product_images[0]?.url ?? '/img/og.jpg'
  return { title: p.name, description: p.description ?? undefined, alternates: { canonical: `/product/${p.slug}` }, openGraph: { title: p.name, description: p.description ?? undefined, images: [img] } }
}
export default async function ProductPage(props: PageProps<'/product/[slug]'>) {
  const p = await getProduct(slugParam((await props.params).slug))
  if (!p) notFound()
  const [all, reviews, branches] = await Promise.all([getProducts(), getReviews(p.id), getBranches()])
  const images = [...p.product_images].sort((a, b) => a.sort - b.sort)
  const similar = all.filter((x) => x.id !== p.id && x.category_id === p.category_id).slice(0, 4)
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: images.map((i) => `${SITE}${i.url}`),
    offers: { '@type': 'Offer', priceCurrency: 'ILS', price: unitPrice(p), availability: inStock(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', ...(p.sale_price && p.sale_ends_at ? { priceValidUntil: p.sale_ends_at.slice(0, 10) } : {}), url: `${SITE}/product/${p.slug}` },
    ...(reviews.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}) }
  const perks = [[Store, `متوفر للمعاينة في ${branches.length > 1 ? 'فرعَي' : 'فرع'} ${branches.map((b) => b.name.replace('فرع ', '')).join(' و')}`], [Truck, 'استلام من الفرع أو توصيل، وأجرة التوصيل نتفق عليها على واتساب'],
    [p.is_custom ? Ruler : MessageCircle, p.is_custom ? 'تفصيل على قياساتك، ونؤكد السعر النهائي قبل التنفيذ' : 'عندك سؤال؟ راسلنا على واتساب ونرد عليك بسرعة']] as const
  return (
    <div className="container-x py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Breadcrumbs items={[{ href: '/shop', label: 'المتجر' }, ...(p.categories ? [{ href: `/shop?cat=${p.categories.slug}`, label: p.categories.name }] : []), { label: p.name }]} />
      <div className="mt-6 grid gap-8 md:mt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Gallery images={images} name={p.name} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          {p.categories && <Link href={`/shop?cat=${p.categories.slug}`} className="eyebrow">{p.categories.name}</Link>}
          <h1 className="t-h2 mt-4 !text-[clamp(2rem,4.4vw,3.2rem)]">{p.name}</h1>
          {reviews.length > 0 && <p className="mt-3 flex items-center gap-1.5 text-sm text-brown"><Star size={16} fill="currentColor" /><span className="num">{avg.toFixed(1)}</span> <span className="text-ink-2">(<span className="num">{reviews.length}</span> تقييم)</span></p>}
          {p.description && <p className="t-lead mt-5">{p.description}</p>}
          <div className="mt-8 border-t hairline pt-8"><ProductBuy p={p} image={images[0]?.url ?? null} waPhone={branches[0]?.whatsapp ?? null} /></div>
          <ul className="mt-8 space-y-3.5 rounded-[var(--radius-lg)] bg-sand p-5 text-sm text-ink-2">
            {perks.map(([I, t]) => <li key={t} className="flex gap-3"><I size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" />{t}</li>)}
          </ul>
        </div>
      </div>
      <section className="mt-20 border-t hairline pt-12" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="t-h3 !text-2xl">التقييمات</h2>
        {reviews.length === 0 ? <p className="mt-3 text-ink-2">لا توجد تقييمات بعد. ستظهر تقييمات الزبائن هنا بعد مراجعتها.</p> : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">{reviews.map((r) => <li key={r.id} className="card p-6"><p className="flex gap-0.5 text-gold">{Array.from({ length: r.rating }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</p><p className="mt-3 leading-8">{r.body}</p><p className="mt-3 text-sm text-ink-2">{r.author_name}</p></li>)}</ul>)}
      </section>
      {similar.length > 0 && <section className="mt-20" aria-labelledby="similar-h"><p className="eyebrow">من نفس القسم</p><h2 id="similar-h" className="t-h2 mt-3 !text-[clamp(1.6rem,3.2vw,2.4rem)]">قد يعجبك أيضاً</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">{similar.map((s) => <ProductCard key={s.id} p={s} wa={branches[0]?.whatsapp ?? null} />)}</div></section>}
    </div>
  )
}
