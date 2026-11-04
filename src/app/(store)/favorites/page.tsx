import type { Metadata } from 'next'
import { getBranches, getProducts } from '@/lib/data'
import { PageHead } from '@/components/store/Breadcrumbs'
import { FavoritesClient } from '@/components/store/FavoritesClient'

export const revalidate = 60
export const metadata: Metadata = { title: 'المفضلة', robots: { index: false } }
export default async function Favorites() {
  const [products, branches] = await Promise.all([getProducts(), getBranches()])
  return (
    <>
      <PageHead crumbs={[{ label: 'المفضلة' }]} eyebrow="محفوظاتك" title="المفضلة" sub="المنتجات اللي حفظتها، محفوظة على هذا الجهاز." />
      <div className="container-x py-10 md:py-14"><FavoritesClient products={products} wa={branches[0]?.whatsapp ?? null} /></div>
    </>
  )
}
