import { getBranches, getCategories, getProducts, getSetting } from '@/lib/data'
import { BranchesSection, Categories, CustomSection, Hero, ProductRail, Story, Testimonials, TrustBar, WhyUs } from '@/components/store/Sections'

export const revalidate = 60
export default async function Home() {
  const [cats, products, branches, home, tests] = await Promise.all([
    getCategories(), getProducts(), getBranches(),
    getSetting<{ headline: string; tagline: string; badge: string; testimonials_title?: string }>('home', { headline: 'مفروشات العصار', tagline: 'بيتك يستاهل الأفخم', badge: '' }),
    getSetting<{ name: string; text: string; place?: string }[]>('testimonials', []),
  ])
  const best = products.filter((p) => p.is_bestseller)
  const offers = products.filter((p) => p.sale_price)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(branches.map((b) => ({ '@context': 'https://schema.org', '@type': 'FurnitureStore', name: b.name, address: b.address, telephone: b.phone, parentOrganization: { '@type': 'Organization', name: 'مفروشات العصار' }, foundingDate: '1996' }))) }} />
      <Hero tagline={home.tagline || 'بيتك يستاهل الأفخم'} categories={cats.length} />
      <TrustBar />
      <Categories items={cats} />
      <ProductRail eyebrow="الأكثر طلباً" title="اختيارات زبائننا المفضّلة" sub="قطع أثبتت جودتها في بيوت كثيرة." items={best.length ? best : products} href="/shop" />
      <CustomSection />
      <ProductRail eyebrow="العروض" title="عروض العصار الحالية" items={offers} href="/shop?offers=1" />
      <Story />
      <WhyUs />
      <Testimonials items={tests} title={home.testimonials_title || undefined} />
      <BranchesSection items={branches} />
    </>
  )
}
