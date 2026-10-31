import type { Metadata } from 'next'
import { requireOwner } from '@/lib/admin'
import { BranchForm, HomeSettings, PaymentSettings, PixelSettings, TestimonialSettings } from '@/components/admin/MiscForms'

export const metadata: Metadata = { title: 'إعدادات المحل', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Settings() {
  const { sb } = await requireOwner()
  const [{ data: branches }, { data: st }] = await Promise.all([sb.from('branches').select('*').order('sort'), sb.from('store_settings').select('key, value')])
  const s = Object.fromEntries((st ?? []).map((x) => [x.key, x.value]))
  return (
    <>
      <h1 className="a-h1">إعدادات المحل</h1><p className="a-muted">كل ما هنا يظهر في المتجر فوراً (خلال دقيقة) بدون أي برمجة.</p>
      <h2 className="font-display text-2xl text-[#8f6a2e]">الفرعان</h2>
      {branches?.map((b) => <BranchForm key={b.id} b={b} />)}
      <h2 className="font-display text-2xl text-[#8f6a2e]">المتجر</h2>
      <HomeSettings v={s.home ?? { headline: 'مفروشات العصار', tagline: 'بيتك يستاهل الأفخم', badge: '' }} />
      <PaymentSettings v={s.payment_accounts ?? {}} />
      <TestimonialSettings v={s.testimonials ?? []} />
      <PixelSettings v={typeof s.meta_pixel_id === 'string' ? s.meta_pixel_id : ''} />
    </>
  )
}
