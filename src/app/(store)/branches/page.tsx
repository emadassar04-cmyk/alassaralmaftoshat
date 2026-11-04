import type { Metadata } from 'next'
import { BranchCards } from '@/components/store/Sections'
import { PageHead } from '@/components/store/Breadcrumbs'
import { getBranches } from '@/lib/data'

export const revalidate = 60
export const metadata: Metadata = { title: 'فروعنا', description: 'فرعا مفروشات العصار في دير البلح والنصيرات: العناوين وساعات العمل وواتساب.', alternates: { canonical: '/branches' } }
export default async function Branches() {
  const items = await getBranches()
  return (
    <>
      <PageHead crumbs={[{ label: 'الفروع' }]} eyebrow="زورونا" title="أهلاً بك في فروع العصار" sub="نسعد بزيارتك واكتشاف مجموعتنا عن قرب. المخزون مشترك بين الفرعين." />
      <div className="container-x py-10 md:py-16"><BranchCards items={items} /></div>
    </>
  )
}
