import type { Metadata } from 'next'
import { getProducts } from '@/lib/data'
import { CustomForm } from '@/components/store/CustomForm'
import { PageHead } from '@/components/store/Breadcrumbs'

export const revalidate = 60
export const metadata: Metadata = { title: 'اطلب تفصيل على مقاسك', description: 'تفصيل ستائر وفرش عربي وباطنة حسب قياسات بيتك. أدخل القياسات مع رسم توضيحي وسنؤكد لك السعر.', alternates: { canonical: '/custom' } }
export default async function Custom() {
  const products = (await getProducts()).filter((p) => p.is_custom)
  return (
    <>
      <PageHead crumbs={[{ label: 'تفصيل على المقاس' }]} eyebrow="تفصيل حسب المقاس" title="لأن منزلك يستحق تفاصيل على مقاسه" sub="اختر النوع وأدخل القياسات. حقول القياس تتغير حسب ما تختار، ونتواصل معك لتأكيد الخامة والسعر النهائي." />
      <div className="container-x py-10 md:py-14"><CustomForm products={products} /></div>
    </>
  )
}
