import type { Metadata } from 'next'
import { Story, BranchesSection } from '@/components/store/Sections'
import { getBranches } from '@/lib/data'

export const revalidate = 60
export const metadata: Metadata = { title: 'قصتنا', description: 'مفروشات العصار منذ 1996: ثلاثة عقود من الثقة وجودة المفروشات في دير البلح والنصيرات.', alternates: { canonical: '/about' } }
export default async function About() {
  return (<><div className="container-x pt-14 text-center"><h1 className="font-display copper-text text-5xl md:text-7xl">قصتنا</h1><p className="mx-auto mt-5 max-w-xl text-cream/85">منذ عام 1996 ونحن نخدم بيوت غزة بالمفروشات الفاخرة. نؤمن أن البيت يستحق الأفخم، وأن الثقة تُبنى بالأمانة والجودة وخدمة ما بعد البيع.</p></div><Story /><BranchesSection items={await getBranches()} /></>)
}
