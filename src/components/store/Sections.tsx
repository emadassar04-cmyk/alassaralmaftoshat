import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Award, Clock, Layers, MapPin, MessageCircle, Navigation, Phone, Ruler, ShieldCheck, Store } from 'lucide-react'
import type { Branch, Category, Product } from '@/lib/types'
import { Reveal } from './Reveal'
import { ProductCard } from './ProductCard'
import { waLink } from '@/lib/format'
import { MEDIA, branchMedia, type Media } from '@/lib/media'

/** Small honest caption on placeholder art, so nothing passes for a real photo of the shop or a product. */
function Illustrative({ m, text = 'صورة تعبيرية' }: { m: Media; text?: string }) {
  if (m.real) return null
  return <span className="absolute bottom-3 start-3 z-10 rounded-full bg-white/80 px-2.5 py-1 text-[11px] text-ink-2 backdrop-blur">{text}</span>
}

export function SectionHead({ eyebrow, title, sub, action, center = false }: { eyebrow: string; title: string; sub?: string; action?: { href: string; label: string }; center?: boolean }) {
  return (
    <Reveal className={`mb-10 flex flex-col gap-5 md:mb-14 ${center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={center ? 'max-w-2xl' : 'max-w-2xl'}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="t-h2 mt-4 text-charcoal">{title}</h2>
        {sub && <p className="t-lead mt-4">{sub}</p>}
      </div>
      {action && <Link href={action.href} className="btn shrink-0 self-start md:self-auto">{action.label}<ArrowLeft size={17} className="arrow" /></Link>}
    </Reveal>
  )
}
/** @deprecated kept for pages that still import it */
export const SectionTitle = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => <SectionHead eyebrow={eyebrow} title={title} sub={sub} center />

/* ---------------- Hero ---------------- */
export function Hero({ tagline, categories, title, text, image }: { tagline: string; categories: number; title?: string; text?: string; image?: string }) {
  const heroImg: Media = image ? { src: image, real: true, alt: 'مفروشات العصار' } : MEDIA.hero
  return (
    <section className="relative overflow-hidden pb-10 pt-6 md:pb-16 md:pt-10">
      <div className="container-x grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="hero-in relative z-10 order-2 lg:order-1">
          <p className="eyebrow">مفروشات العصار · {tagline}</p>
          {title ? <h1 className="t-hero mt-6 text-charcoal [text-wrap:balance]">{title}</h1> : <h1 className="t-hero mt-6 text-charcoal"><span className="block">منذ 1996…</span><span className="block lg:whitespace-nowrap">نصنع <span className="text-brown">تفاصيل الراحة</span></span><span className="block">في منزلك</span></h1>}
          <p className="t-lead mt-6 max-w-xl">{text || 'مفروشات تجمع بين جودة الاختيار، جمال التفاصيل، والتفصيل الذي يناسب مساحتك.'}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-solid">اكتشف مجموعتنا<ArrowLeft size={18} className="arrow" /></Link>
            <Link href="/custom" className="btn">صمّم مفروشاتك على مقاسك</Link>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-line border-t hairline pt-6">
            {[['1996', 'سنة البداية'], ['2', 'فرعان في غزة'], [String(categories), 'أقسام مفروشات']].map(([n, l]) => (
              <div key={l} className="px-3 first:ps-0"><dt className="sr-only">{l}</dt><dd className="num font-display text-[clamp(1.6rem,3.4vw,2.3rem)] font-light text-charcoal">{n}</dd><dd className="mt-1 text-xs text-ink-2">{l}</dd></div>
            ))}
          </dl>
        </div>
        <div className="relative order-1 lg:order-2">
          <div className="media hero-img aspect-[4/5] !rounded-[var(--radius-xl)] sm:aspect-[5/4] lg:aspect-[4/4.6]">
            <Image src={heroImg.src} alt={heroImg.alt} fill preload fetchPriority="high" sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent" />
            <Illustrative m={heroImg} />
          </div>
          <div className="glass absolute -bottom-6 end-4 hidden w-60 rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-lift)] sm:block lg:-end-6">
            <p className="flex items-center gap-2 text-sm font-medium text-brown"><Award size={18} strokeWidth={1.5} />30 عاماً من الثقة</p>
            <p className="mt-2 text-[13px] leading-6 text-ink-2">نختار الأقمشة بعناية، ونفصّل على مقاس كل بيت.</p>
          </div>
          <div className="glass absolute end-4 top-4 rounded-full px-4 py-2 text-[13px] text-charcoal shadow-[var(--shadow-soft)] sm:start-6 sm:end-auto sm:top-6">
            <span className="me-2 inline-block h-2 w-2 rounded-full bg-success align-middle" />فرعا دير البلح والنصيرات يستقبلونكم
          </div>
        </div>
      </div>
    </section>
  )
}

const PROMISE = [[Award, 'خبرة منذ 1996'], [ShieldCheck, 'جودة نثق بها'], [Ruler, 'تفصيل حسب المقاس']] as const
export function TrustBar() {
  return (
    <section aria-label="وعد العصار" className="border-y hairline bg-white">
      <ul className="container-x grid grid-cols-3 divide-x divide-line">
        {PROMISE.map(([I, t]) => <li key={t} className="flex flex-col items-center justify-center gap-2 py-5 text-center text-[13px] text-charcoal sm:flex-row sm:gap-3 sm:text-[15px]"><I size={20} strokeWidth={1.4} className="text-brown" />{t}</li>)}
      </ul>
    </section>
  )
}

/* ---------------- Collections: editorial bento ---------------- */
// Hand-tuned spans (4 cols × 4 rows on desktop, 2 cols on mobile) so the grid reads like a magazine spread, not a template.
const SPAN8 = ['col-span-2 row-span-2', 'col-span-2 md:col-span-2', 'col-span-1', 'col-span-1', 'col-span-1 md:row-span-2', 'col-span-1', 'col-span-2 md:col-span-2', 'col-span-2 md:col-span-3']
const MD_FILL = ['', 'md:col-span-2', 'md:col-span-3']
/** Any other count: 3 columns, a 2×2 lead tile, and the last tile stretched so no hole is left (2 cols on mobile). */
function spans(n: number) {
  if (n >= 8) return SPAN8
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return n === 1 ? 'col-span-2 row-span-2 md:col-span-3' : 'col-span-2 row-span-2'
    const last = i === n - 1
    const mob = last && (n - 1) % 2 === 1 ? 'col-span-2' : 'col-span-1'
    const r = (4 + n - 1) % 3
    return `${mob} ${last && r ? MD_FILL[3 - r] : 'md:col-span-1'}`
  })
}
export function Categories({ items }: { items: Category[] }) {
  return (
    <section className="section container-x" aria-labelledby="collections">
      <SectionHead eyebrow="المجموعات" title="كل ما يحتاجه بيتك، بتفاصيل تليق به" sub="من وجه الفرشة إلى الجلسة العربية الكاملة. تصفّح أقسامنا واختر ما يناسب مساحتك." action={{ href: '/shop', label: 'تصفّح المتجر' }} />
      <h2 id="collections" className="sr-only">أقسامنا</h2>
      <div className={`grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:gap-4 lg:auto-rows-[230px] ${items.length >= 8 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {items.slice(0, 8).map((c, i, all) => (
          <Reveal key={c.id} delay={(i % 4) * 0.06} className={spans(all.length)[i] ?? 'col-span-1'}>
            <Link href={`/shop?cat=${c.slug}`} className="group media block h-full">
              {c.image_url && <Image src={c.image_url} alt="" fill sizes={i === 0 ? '(max-width:768px) 100vw, 50vw' : '(max-width:768px) 50vw, 25vw'} className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
              <span className="num absolute end-4 top-4 text-xs text-white/80" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-6">
                <div>
                  <h3 className={`font-display font-light text-white ${i === 0 ? 'text-[clamp(1.6rem,3.4vw,2.6rem)]' : 'text-[clamp(1.15rem,2vw,1.6rem)]'}`}>{c.name}</h3>
                  {c.description && <p className={`mt-1 text-[13px] text-white/80 ${i === 0 || i === 7 ? 'block' : 'hidden md:block'}`}>{c.description}</p>}
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/90 text-charcoal transition-transform duration-500 group-hover:-translate-x-1"><ArrowLeft size={16} /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Product rails ---------------- */
export function ProductRail({ eyebrow, title, sub, items, href, wa = null }: { eyebrow: string; title: string; sub?: string; items: Product[]; href: string; wa?: string | null }) {
  if (!items.length) return null
  return (
    <section className="section">
      <div className="container-x"><SectionHead eyebrow={eyebrow} title={title} sub={sub} action={{ href, label: 'عرض الكل' }} /></div>
      <div className="container-x">
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4">
          {items.slice(0, items.length >= 8 ? 8 : 4).map((p, i) => <div key={p.id} className="w-[70vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none"><Reveal delay={(i % 4) * 0.06}><ProductCard p={p} wa={wa} /></Reveal></div>)}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Made to measure ---------------- */
const STEPS = [['اختر النوع', 'ستائر، فرش عربي أو باطنة.'], ['أدخل المقاس', 'حقول واضحة مع رسم يشرح كيف تقيس.'], ['نؤكد معك', 'نراجع القياسات والخامة ونؤكد السعر النهائي.']]
export function CustomSection() {
  return (
    <section className="section" aria-labelledby="custom-h">
      <div className="container-x">
        <div className="panel grid overflow-hidden lg:grid-cols-2">
          <div className="relative min-h-[320px] lg:min-h-[560px]">
            <Image src={MEDIA.custom.src} alt={MEDIA.custom.alt} fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            <Illustrative m={MEDIA.custom} />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-16">
            <Reveal>
              <p className="eyebrow">تفصيل حسب المقاس</p>
              <h2 id="custom-h" className="t-h2 mt-4">لأن منزلك يستحق تفاصيل على مقاسه</h2>
              <p className="t-lead mt-5">اختر المقاس والخامة والتفاصيل، ودعنا نساعدك في الوصول إلى النتيجة التي تناسب منزلك.</p>
              <ol className="mt-9 space-y-5">
                {STEPS.map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brown/30 bg-white font-display text-brown">{i + 1}</span>
                    <div><p className="font-medium text-charcoal">{t}</p><p className="text-sm text-ink-2">{d}</p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/custom" className="btn btn-solid">ابدأ طلب التفصيل<ArrowLeft size={18} className="arrow" /></Link><Link href="/visit" className="btn">احجز زيارة قياس مجانية</Link></div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Our story ---------------- */
const STORY = [['1996', 'بداية الحكاية', 'افتتحنا أول محل بحلم بسيط: مفروشات تليق بكل بيت.'], ['2005', 'التفصيل على المقاس', 'بدأنا نفصّل الستائر والفرش العربي حسب كل بيت.'], ['2015', 'افتتاح فرع النصيرات', 'اتسعت العائلة وافتتحنا فرعاً ثانياً لنقترب منكم.'], ['اليوم', 'خبرة وثقة وجودة', 'ما زلنا نختار الأفخم لبيتك، وبكل أمانة.']]
export function Story({ heading = true, text }: { heading?: boolean; text?: string }) {
  return (
    <section className="section bg-white" aria-labelledby="story-h">
      <div className="container-x grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">قصة العصار</p>
          {heading ? <h2 id="story-h" className="t-h2 mt-4">ثلاثون عاماً نصنع فيها الراحة، بيتاً بعد بيت</h2> : <p id="story-h" className="t-h2 mt-4">ثلاثون عاماً نصنع فيها الراحة، بيتاً بعد بيت</p>}
          <p className="t-lead mt-5 whitespace-pre-line">{text || 'بدأت الحكاية في دير البلح بمحل صغير وثقة كبيرة. اليوم نستقبلكم في فرعين، وما زالت القاعدة نفسها: الزبون جارنا، والجودة وعد.'}</p>
          <div className="media mt-8 hidden aspect-[4/3] lg:block"><Image src={MEDIA.story.src} alt={MEDIA.story.alt} fill sizes="40vw" className="object-cover" /><Illustrative m={MEDIA.story} /></div>
        </Reveal>
        <ol className="relative border-s hairline">
          {STORY.map(([y, t, d], i) => (
            <li key={y} className="relative ps-8 pb-12 last:pb-0 sm:ps-12">
              <Reveal delay={i * 0.06}>
                <span className={`absolute -start-[7px] top-3 h-3.5 w-3.5 rounded-full border-2 ${i === STORY.length - 1 ? 'border-brown bg-brown' : 'border-gold bg-white'}`} />
                <p className="num font-display text-[clamp(2.6rem,6vw,4.2rem)] font-light leading-none text-champagne [-webkit-text-stroke:1px_var(--color-gold)]">{y}</p>
                <h3 className="t-h3 mt-3 text-charcoal">{t}</h3>
                <p className="mt-2 max-w-md text-ink-2">{d}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------- Why Al-Assar ---------------- */
const WHY = [[Award, 'خبرة منذ 1996', 'ثلاثة عقود في اختيار المفروشات لبيوت غزة ومعرفة ما يدوم.'], [Ruler, 'تفصيل حسب المقاس', 'ستائر وفرش عربي وباطنة تُفصَّل على قياسات بيتك بالضبط.'], [Layers, 'تنوع في المفروشات', 'تشكيلة واسعة: من المخدات والشراشف إلى الجلسات العربية.'], [Store, 'فروع لاستقبالكم', 'زورونا في دير البلح أو النصيرات وشاهدوا الخامات عن قرب.']] as const
export function WhyUs() {
  return (
    <section className="section container-x" aria-labelledby="why-h">
      <SectionHead eyebrow="لماذا العصار" title="تفاصيل صغيرة تصنع فرقاً كبيراً" center />
      <h2 id="why-h" className="sr-only">لماذا تختار العصار</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map(([I, t, d], i) => (
          <li key={t}><Reveal delay={i * 0.06} className="card h-full p-7 transition-shadow duration-500 hover:shadow-[var(--shadow-lift)]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sand text-brown"><I size={22} strokeWidth={1.4} /></span>
            <h3 className="t-h3 mt-6 !text-xl">{t}</h3>
            <p className="mt-2 text-[15px] text-ink-2">{d}</p>
          </Reveal></li>
        ))}
      </ul>
    </section>
  )
}

/* ---------------- Shop voice (owner's own words) ---------------- */
export function Testimonials({ items, title = 'كلمة من العصار' }: { items: { name: string; text: string; place?: string }[]; title?: string }) {
  if (!items.length) return null
  return (
    <section className="section bg-sand" aria-labelledby="voice-h">
      <div className="container-x">
        <SectionHead eyebrow="بكلماتنا" title={title} center />
        <h2 id="voice-h" className="sr-only">{title}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <figure className="card flex h-full flex-col p-8">
                <span aria-hidden className="font-display text-6xl leading-none text-gold">”</span>
                <blockquote className="mt-2 flex-1 text-[17px] leading-9 text-charcoal">{t.text}</blockquote>
                <figcaption className="mt-6 border-t hairline pt-4 text-sm text-brown">{t.name}{t.place && <span className="text-muted"> · {t.place}</span>}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Branches ---------------- */
export function BranchCards({ items }: { items: Branch[] }) {
  return (
    <div className="space-y-6 md:space-y-10">
      {items.map((b, i) => {
        const m = branchMedia(b.slug)
        return (
          <Reveal key={b.id}>
            <article className="card grid overflow-hidden md:grid-cols-[1.25fr_1fr]">
              <div className={`relative aspect-[16/10] md:aspect-auto md:min-h-[420px] ${i % 2 ? 'md:order-2' : ''}`}>
                <Image src={m.src} alt={m.real ? m.alt : ''} fill sizes="(max-width:768px) 100vw, 55vw" className="object-cover" />
                <Illustrative m={m} text="صورة تعبيرية · صورة الفرع قريباً" />
              </div>
              <div className="flex flex-col p-7 sm:p-10">
                <p className="eyebrow">فروع العصار</p>
                <h3 className="t-h2 mt-3 !text-[clamp(1.8rem,3.4vw,2.6rem)]">{b.name}</h3>
                <ul className="mt-7 space-y-4 text-[15px]">
                  {b.address && <li className="flex gap-3"><MapPin size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" /><span><span className="block text-xs text-muted">العنوان</span>{b.address}</span></li>}
                  {b.phone && <li className="flex gap-3"><Phone size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" /><span><span className="block text-xs text-muted">الهاتف</span><a href={`tel:${b.phone}`} dir="ltr" className="num link-u">{b.phone}</a></span></li>}
                  {b.hours && <li className="flex gap-3"><Clock size={19} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brown" /><span><span className="block text-xs text-muted">ساعات العمل</span>{b.hours}</span></li>}
                </ul>
                <div className="mt-auto grid gap-2.5 pt-9 sm:grid-cols-3">
                  {b.phone && <a className="btn !min-h-12 !px-4" href={`tel:${b.phone}`}><Phone size={17} />اتصال</a>}
                  {b.whatsapp && <a className="btn btn-solid !min-h-12 !px-4" href={waLink(b.whatsapp, `مرحباً ${b.name}`)} target="_blank" rel="noopener"><MessageCircle size={17} />واتساب</a>}
                  {b.map_url && <a className="btn !min-h-12 !px-4" href={b.map_url} target="_blank" rel="noopener"><Navigation size={17} />الاتجاهات</a>}
                </div>
              </div>
            </article>
          </Reveal>
        )
      })}
    </div>
  )
}
export function BranchesSection({ items, as = 'h2' }: { items: Branch[]; as?: 'h1' | 'h2' }) {
  return (
    <section className="section container-x" aria-labelledby="branches-h">
      <Reveal className="mb-10 max-w-2xl md:mb-14">
        <p className="eyebrow">زورونا</p>
        {as === 'h1' ? <h1 id="branches-h" className="t-h2 mt-4">أهلاً بك في فروع العصار</h1> : <h2 id="branches-h" className="t-h2 mt-4">أهلاً بك في فروع العصار</h2>}
        <p className="t-lead mt-4">نسعد بزيارتك واكتشاف مجموعتنا عن قرب.</p>
      </Reveal>
      <BranchCards items={items} />
    </section>
  )
}
