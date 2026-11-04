import type { Metadata } from 'next'
import { getBranches, getCategories, getProducts } from '@/lib/data'
import { ShopClient } from '@/components/store/ShopClient'
import { PageHead } from '@/components/store/Breadcrumbs'

export const revalidate = 60
export const metadata: Metadata = { title: 'المتجر', description: 'تسوّق وجه فرشات، مخدات، شراشف، ستائر، فرشات إسفنج، كنب وفرش عربي من مفروشات العصار.', alternates: { canonical: '/shop' } }
export default async function Shop() {
  const [products, categories, branches] = await Promise.all([getProducts(), getCategories(), getBranches()])
  return (
    <>
      <PageHead crumbs={[{ label: 'المتجر' }]} eyebrow="مجموعة العصار" title="المتجر" sub="مفروشات مختارة بعناية لكل زاوية في بيتك: من النوم الهادئ إلى جلسات الضيوف." />
      <ShopClient products={products} categories={categories} wa={branches[0]?.whatsapp ?? null} />
    </>
  )
}
