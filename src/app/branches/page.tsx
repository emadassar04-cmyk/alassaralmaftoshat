import type { Metadata } from 'next'
import { BranchesSection } from '@/components/store/Sections'
import { getBranches } from '@/lib/data'

export const revalidate = 60
export const metadata: Metadata = { title: 'فروعنا', description: 'فرعا مفروشات العصار في دير البلح والنصيرات: العناوين وساعات العمل وواتساب.', alternates: { canonical: '/branches' } }
export default async function Branches() { return <BranchesSection items={await getBranches()} /> }
