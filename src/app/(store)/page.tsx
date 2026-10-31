import { getBranches, getCategories, getProducts, getSetting } from '@/lib/data'
import { BranchesSection, Categories, CustomSection, Hero, ProductRail, Story, Testimonials, TrustBar } from '@/components/store/Sections'

export const revalidate = 60
export default async function Home() {
  const [cats, products, branches, home, tests] = await Promise.all([
    getCategories(), getProducts(), getBranches(),
    getSetting('home', { headline: 'مفروشات العصار', tagline: 'بيتك يستاهل الأفخم', badge: '30 عاماً من الثقة · فرعان في دير البلح والنصيرات' }),
    getSetting<{ name: string; text: string; place?: string }[]>('testimonials', []),
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(branches.map((b) => ({ '@context': 'https://schema.org', '@type': 'FurnitureStore', name: b.name, address: b.address, telephone: b.phone, parentOrganization: { '@type': 'Organization', name: 'مفروشات العصار' }, foundingDate: '1996' }))) }} />
      <Hero {...home} />
      <TrustBar />
      <Categories items={cats} />
      <ProductRail eyebrow="BEST SELLERS" title="الأكثر مبيعاً" items={products.filter((p) => p.is_bestseller)} href="/shop" />
      <ProductRail eyebrow="OFFERS" title="العروض" items={products.filter((p) => p.sale_price)} href="/shop?offers=1" />
      <CustomSection />
      <Story />
      <Testimonials items={tests} />
      <BranchesSection items={branches} />
    </>
  )
}
