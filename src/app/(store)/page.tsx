import { getBranches, getCategories, getProducts, getSetting } from '@/lib/data'
import { BranchesSection, Categories, CustomSection, Hero, ProductRail, Story, Testimonials, TrustBar, WhyUs } from '@/components/store/Sections'

export const revalidate = 60
export default async function Home() {
  const [cats, products, branches, home, tests] = await Promise.all([
    getCategories(), getProducts(), getBranches(),
    getSetting<{ headline: string; tagline: string; badge: string; testimonials_title?: string; hero_title?: string; hero_text?: string; hero_image?: string; story_text?: string }>('home', { headline: 'مفروشات العصار', tagline: 'بيتك يستاهل الأفخم', badge: '' }),
    getSetting<{ name: string; text: string; place?: string }[]>('testimonials', []),
  ])
  const best = products.filter((p) => p.is_bestseller)
  const offers = products.filter((p) => p.sale_price && !p.is_custom)
  const featured = products.filter((p) => p.is_featured)
  const wa = branches[0]?.whatsapp ?? null
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(branches.map((b) => ({ '@context': 'https://schema.org', '@type': 'FurnitureStore', name: b.name, address: b.address, telephone: b.phone, parentOrganization: { '@type': 'Organization', name: 'مفروشات العصار' }, foundingDate: '1996' }))) }} />
      <Hero tagline={home.tagline || 'بيتك يستاهل الأفخم'} categories={cats.length} title={home.hero_title || undefined} text={home.hero_text || undefined} image={home.hero_image || undefined} />
      <TrustBar />
      <Categories items={cats} />
      {featured.length > 0 && <ProductRail eyebrow="مختارات العصار" title="منتجات مميزة" items={featured} href="/shop" wa={wa} />}
      <ProductRail eyebrow="الأكثر طلباً" title="اختيارات زبائننا المفضّلة" sub="قطع أثبتت جودتها في بيوت كثيرة." items={best.length ? best : products} href="/shop" wa={wa} />
      <CustomSection />
      <ProductRail eyebrow="العروض" title="عروض العصار الحالية" sub="أسعار خاصة لفترة محدودة." items={offers} href="/shop?offers=1" wa={wa} />
      <Story text={home.story_text || undefined} />
      <WhyUs />
      <Testimonials items={tests} title={home.testimonials_title || undefined} />
      <BranchesSection items={branches} />
    </>
  )
}
