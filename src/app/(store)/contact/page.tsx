import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarCheck, Clock, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react'
import { getBranches, getSetting } from '@/lib/data'
import { waLink } from '@/lib/format'
import { PageHead } from '@/components/store/Breadcrumbs'
import { SocialIcon, socialLinks, type Social } from '@/lib/social'

export const revalidate = 60
export const metadata: Metadata = { title: 'تواصل معنا', description: 'تواصل مع مفروشات العصار: واتساب واتصال لفرعي دير البلح والنصيرات، ساعات العمل والاتجاهات.', alternates: { canonical: '/contact' } }
export default async function Contact() {
  const [branches, social] = await Promise.all([getBranches(), getSetting<Social>('social', {})])
  const links = socialLinks(social)
  return (
    <>
      <PageHead crumbs={[{ label: 'تواصل معنا' }]} eyebrow="نسعد بخدمتك" title="تواصل معنا" sub="اسألنا عن أي منتج، أو اطلب تسعيرة تفصيل، أو احجز زيارة قياس. نرد عليك بأسرع وقت." />
      <div className="container-x space-y-8 py-10 md:py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {branches.map((b) => (
            <article key={b.id} className="card p-7">
              <h2 className="t-h3 !text-2xl">{b.name}</h2>
              <ul className="mt-5 space-y-3 text-[15px]">
                {b.address && <li className="flex gap-3"><MapPin size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" />{b.address}</li>}
                {b.phone && <li className="flex gap-3"><Phone size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" /><a href={`tel:${b.phone}`} dir="ltr" className="num link-u">{b.phone}</a></li>}
                {b.hours && <li className="flex gap-3"><Clock size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" />{b.hours}</li>}
              </ul>
              <div className="mt-7 grid gap-2 sm:grid-cols-3">
                {b.whatsapp && <a className="btn btn-solid !min-h-12 !px-3" href={waLink(b.whatsapp, `مرحباً ${b.name}`)} target="_blank" rel="noopener"><MessageCircle size={17} />واتساب</a>}
                {b.phone && <a className="btn !min-h-12 !px-3" href={`tel:${b.phone}`}><Phone size={17} />اتصال</a>}
                {b.map_url && <a className="btn !min-h-12 !px-3" href={b.map_url} target="_blank" rel="noopener"><Navigation size={17} />الاتجاهات</a>}
              </div>
            </article>))}
        </div>
        <div className="panel flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="t-h3">بدك حدا يقيس عندك؟</p><p className="mt-1 text-ink-2">فريقنا بيزورك وبياخد القياسات بدقة، والزيارة مجانية.</p></div>
          <Link href="/visit" className="btn btn-solid"><CalendarCheck size={18} />احجز زيارة قياس</Link>
        </div>
        {links.length > 0 && (
          <div className="text-center"><p className="eyebrow justify-center">تابعونا</p>
            <div className="mt-4 flex justify-center gap-3">{links.map((l) => <a key={l.key} href={l.url} target="_blank" rel="noopener" aria-label={l.name} className="grid h-12 w-12 place-items-center rounded-full border hairline bg-white text-charcoal transition-colors hover:border-brown hover:text-brown"><SocialIcon k={l.key} /></a>)}</div></div>)}
      </div>
    </>
  )
}
