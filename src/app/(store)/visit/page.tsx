import type { Metadata } from 'next'
import { CalendarCheck, Home, Ruler } from 'lucide-react'
import { getBranches } from '@/lib/data'
import { PageHead } from '@/components/store/Breadcrumbs'
import { VisitForm } from '@/components/store/VisitForm'

export const revalidate = 60
export const metadata: Metadata = { title: 'احجز زيارة قياس مجانية', description: 'احجز موعداً لزيارة فريق مفروشات العصار لبيتك وأخذ قياسات الستائر والفرش العربي والباطنة بدقة. اختر الفرع واليوم والوقت.', alternates: { canonical: '/visit' } }
const STEPS = [[CalendarCheck, 'احجز موعدك', 'اختر الفرع واليوم والوقت المناسب.'], [Home, 'نزورك في البيت', 'فريقنا يقيس بدقة ويعرض عليك عينات الأقمشة.'], [Ruler, 'نفصّل على مقاسك', 'نؤكد السعر ونبدأ التفصيل.']] as const
export default async function Visit() {
  const branches = await getBranches()
  return (
    <>
      <PageHead crumbs={[{ href: '/custom', label: 'تفصيل على المقاس' }, { label: 'حجز زيارة قياس' }]} eyebrow="زيارة مجانية" title="احجز زيارة قياس لبيتك" sub="مش متأكد من القياسات؟ فريق العصار بيجيك على البيت، بيقيس بدقة، وبيساعدك تختار القماش المناسب.">
        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {STEPS.map(([I, t, d], i) => <li key={t} className="flex gap-3 rounded-[var(--radius-lg)] bg-white/70 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brown"><I size={19} strokeWidth={1.5} /></span><div><p className="text-sm font-medium"><span className="num text-gold">{i + 1}.</span> {t}</p><p className="text-xs text-ink-2">{d}</p></div></li>)}
        </ol>
      </PageHead>
      <div className="container-x py-10 md:py-14"><VisitForm branches={branches} /></div>
    </>
  )
}
