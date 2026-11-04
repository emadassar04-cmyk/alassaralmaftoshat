import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getBranches, getCategories, getProducts } from '@/lib/data'
import { ShopClient } from '@/components/store/ShopClient'
import { Breadcrumbs } from '@/components/store/Breadcrumbs'

export const revalidate = 60
export const metadata: Metadata = { title: 'المتجر', description: 'تسوّق وجه فرشات، مخدات، شراشف، ستائر، فرشات إسفنج، كنب وفرش عربي من مفروشات العصار.', alternates: { canonical: '/shop' } }
export default async function Shop() {
  const [products, categories, branches] = await Promise.all([getProducts(), getCategories(), getBranches()])
  return (
    <div className="relative">
      <section className="relative overflow-hidden pb-16 pt-8 md:pb-20 md:pt-12">
        <div aria-hidden className="glow-drift absolute -top-24 start-[10%] h-72 w-72 rounded-full bg-[#c9a227]/30 blur-3xl" />
        <div aria-hidden className="glow-drift absolute -bottom-16 end-[8%] h-64 w-64 rounded-full bg-[#0f4c5c]/20 blur-3xl [animation-delay:-6s]" />
        <div className="container-x relative">
          <Breadcrumbs items={[{ label: 'المتجر' }]} />
          <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,4.5rem)] font-medium leading-tight text-charcoal">المتجر</h1>
          <p className="mt-3 max-w-xl text-[17px] text-charcoal/70">مفروشات مختارة بعناية لكل زاوية في بيتك: من النوم الهادئ إلى جلسات الضيوف.</p>
          <Link href="/custom" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#8f6f0f] hover:underline">بدك مقاس خاص؟ اطلب تفصيل<ChevronLeft size={15} /></Link>
        </div>
      </section>
      <ShopClient products={products} categories={categories} wa={branches[0]?.whatsapp ?? null} />
    </div>
  )
}
