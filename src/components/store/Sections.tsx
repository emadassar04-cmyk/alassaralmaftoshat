import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, MessageCircle, Quote, Ruler, ShieldCheck, Truck, Wallet, Award } from 'lucide-react'
import type { Branch, Category, Product } from '@/lib/types'
import { Reveal } from './Reveal'
import { ProductCard } from './ProductCard'
import { waLink } from '@/lib/format'

export function Hero({ headline, tagline, badge }: { headline: string; tagline: string; badge: string }) {
  return (
    <section className="relative flex min-h-[88svh] items-end overflow-hidden">
      <Image src="/img/h/hero.webp" alt="" fill preload fetchPriority="high" sizes="100vw" className="kenburns object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/25" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(200,163,106,.22),transparent_60%)]" />
      <div className="container-x relative z-10 pb-16 pt-32 text-center">
        <p className="eyebrow">AL-ASSAR · SINCE 1996</p>
        <h1 className="font-display copper-text glow-text mt-5 text-[clamp(3.2rem,13vw,8.5rem)] leading-[1.05]">{headline}</h1>
        <p className="font-display mt-3 text-[clamp(1.5rem,5vw,2.6rem)] text-cream">{tagline}</p>
        <p className="mx-auto mt-5 inline-block border border-copper/40 bg-night/60 px-4 py-1.5 text-sm text-copper-lt backdrop-blur">{badge}</p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/shop" className="btn btn-solid">تسوّق الآن</Link>
          <Link href="/custom" className="btn">اطلب تفصيل على مقاسك</Link>
        </div>
      </div>
    </section>
  )
}

const TRUST = [[Award, '30 عاماً من الخبرة'], [MapPin, 'فرعان في غزة'], [Ruler, 'تفصيل حسب المقاس'], [Wallet, 'دفع مرن'], [Truck, 'توصيل متوفر']] as const
export function TrustBar() {
  return (
    <section className="border-y border-copper/15 bg-night-2" aria-label="لماذا العصار">
      <ul className="container-x grid grid-cols-2 gap-y-5 py-6 text-center md:grid-cols-5">
        {TRUST.map(([I, t]) => <li key={t} className="flex flex-col items-center gap-2 text-sm text-cream"><I className="text-copper" size={24} />{t}</li>)}
      </ul>
    </section>
  )
}

export function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-10 text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display copper-text mt-3 text-[clamp(2rem,6vw,3.4rem)]">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-muted">{sub}</p>}
      <div className="divider mx-auto mt-6 max-w-xs" />
    </Reveal>
  )
}

export function Categories({ items }: { items: Category[] }) {
  return (
    <section className="section container-x">
      <SectionTitle eyebrow="COLLECTIONS" title="أقسامنا" sub="كل ما يحتاجه بيتك من مفروشات" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {items.map((c, i) => (
          <Reveal key={c.id} delay={(i % 4) * 0.07}>
            <Link href={`/shop?cat=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden border border-copper/15">
              {c.image_url && <Image src={c.image_url} alt="" fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-[1400ms] group-hover:scale-110" />}
              <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4"><h3 className="font-display text-2xl text-copper-lt">{c.name}</h3><p className="hidden text-xs text-muted md:block">{c.description}</p></div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function ProductRail({ eyebrow, title, items, href }: { eyebrow: string; title: string; items: Product[]; href: string }) {
  if (!items.length) return null
  return (
    <section className="section container-x">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
        {items.slice(0, 8).map((p, i) => <Reveal key={p.id} delay={(i % 4) * 0.06}><ProductCard p={p} /></Reveal>)}
      </div>
      <div className="mt-10 text-center"><Link href={href} className="btn">عرض المزيد</Link></div>
    </section>
  )
}

export function CustomSection() {
  return (
    <section className="relative overflow-hidden bg-olive/40">
      <Image src="/img/h/custom.webp" alt="" fill sizes="100vw" className="object-cover opacity-30" />
      <div className="container-x section relative text-center">
        <Reveal>
          <p className="eyebrow">MADE TO MEASURE</p>
          <h2 className="font-display copper-text mt-3 text-[clamp(2rem,6vw,3.6rem)]">فرش عربي، باطنة، ستائر… على مقاس بيتك بالضبط</h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">اختر النوع، أدخل القياسات بسهولة مع رسم يشرح كيف تقيس، ونتواصل معك لتأكيد السعر النهائي.</p>
          <Link href="/custom" className="btn btn-solid mt-8">ابدأ طلب التفصيل</Link>
        </Reveal>
      </div>
    </section>
  )
}

const STORY = [['1996', 'بداية الحكاية', 'افتتحنا أول محل بحلم صغير: مفروشات تليق بكل بيت.'], ['2005', 'التفصيل على المقاس', 'بدأنا نفصّل الستائر والفرش العربي حسب كل بيت.'], ['2015', 'فرع النصيرات', 'اتسعت العائلة وافتتحنا فرعاً ثانياً لنقترب منكم.'], ['اليوم', '30 عاماً من الثقة', 'ما زلنا نصنع الأفخم لبيتك، وبكل أمانة.']]
export function Story() {
  return (
    <section className="section container-x">
      <SectionTitle eyebrow="OUR STORY" title="قصتنا" sub="ثلاثة عقود من الثقة" />
      <ol className="relative mx-auto max-w-2xl border-s border-copper/30 ps-8">
        {STORY.map(([y, t, d], i) => (
          <li key={y} className="relative pb-10 last:pb-0">
            <Reveal delay={i * 0.08}>
              <span className="absolute -start-[2.6rem] top-1.5 h-3 w-3 rounded-full bg-copper shadow-[0_0_14px_#c8a36a]" />
              <p className="font-display text-3xl text-copper-lt">{y}</p><h3 className="text-lg text-cream">{t}</h3><p className="text-sm text-muted">{d}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-center text-xs text-muted">الأحداث الزمنية للتوضيح ويتم تعديلها لاحقاً من إدارة الموقع.</p>
    </section>
  )
}

export function Testimonials({ items }: { items: { name: string; text: string; place?: string }[] }) {
  if (!items.length) return null
  return (
    <section className="section bg-night-2">
      <div className="container-x">
        <SectionTitle eyebrow="TESTIMONIALS" title="آراء زبائننا" />
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <figure className="h-full border border-copper/20 bg-night p-6"><Quote className="text-copper/60" /><blockquote className="mt-3 text-cream/90">{t.text}</blockquote>
                <figcaption className="mt-4 text-sm text-copper-lt">{t.name}{t.place && <span className="text-muted"> · {t.place}</span>}</figcaption></figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BranchCards({ items }: { items: Branch[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((b, i) => (
        <Reveal key={b.id} delay={i * 0.1}>
          <article className="h-full border border-copper/25 bg-night-2 p-7">
            <h3 className="font-display text-3xl text-copper-lt">{b.name}</h3>
            <ul className="mt-4 space-y-2 text-sm text-cream/85">
              <li className="flex gap-2"><MapPin size={18} className="mt-0.5 shrink-0 text-copper" />{b.address}</li>
              <li className="flex gap-2"><Clock size={18} className="mt-0.5 shrink-0 text-copper" />{b.hours}</li>
              {b.phone && <li className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-copper" /><span dir="ltr">{b.phone}</span></li>}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-solid" href={waLink(b.whatsapp, `مرحباً ${b.name}`)} target="_blank" rel="noopener"><MessageCircle size={18} />واتساب</a>
              {b.map_url && <a className="btn" href={b.map_url} target="_blank" rel="noopener">الخريطة</a>}
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  )
}
export function BranchesSection({ items }: { items: Branch[] }) {
  return <section className="section container-x"><SectionTitle eyebrow="VISIT US" title="فرعانا" sub="تفضّل بزيارتنا أو راسلنا على واتساب" /><BranchCards items={items} /></section>
}
