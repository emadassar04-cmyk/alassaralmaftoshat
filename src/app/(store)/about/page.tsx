import type { Metadata } from 'next'
import { Story, BranchesSection, WhyUs } from '@/components/store/Sections'
import { PageHead } from '@/components/store/Breadcrumbs'
import { getBranches, getSetting } from '@/lib/data'

export const revalidate = 60
export const metadata: Metadata = { title: 'قصتنا', description: 'مفروشات العصار منذ 1996: ثلاثة عقود من الثقة وجودة المفروشات في دير البلح والنصيرات.', alternates: { canonical: '/about' } }
export default async function About() {
  const [branches, home] = await Promise.all([getBranches(), getSetting<{ story_text?: string }>('home', {})])
  return (
    <>
      <PageHead crumbs={[{ label: 'قصتنا' }]} eyebrow="منذ 1996" title="قصة العصار" sub="منذ عام 1996 ونحن نخدم بيوت غزة بالمفروشات الفاخرة. نؤمن أن البيت يستحق الأفخم، وأن الثقة تُبنى بالأمانة والجودة وخدمة ما بعد البيع." />
      <Story heading={false} text={home.story_text || undefined} />
      <WhyUs />
      <BranchesSection items={branches} />
    </>
  )
}
