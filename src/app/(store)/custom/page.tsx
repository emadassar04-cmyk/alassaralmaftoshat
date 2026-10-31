import type { Metadata } from 'next'
import { getProducts } from '@/lib/data'
import { CustomForm } from '@/components/store/CustomForm'

export const revalidate = 60
export const metadata: Metadata = { title: 'اطلب تفصيل على مقاسك', description: 'تفصيل ستائر وفرش عربي وباطنة حسب قياسات بيتك. أدخل القياسات مع رسم توضيحي وسنؤكد لك السعر.', alternates: { canonical: '/custom' } }
export default async function Custom() {
  const products = (await getProducts()).filter((p) => p.is_custom)
  return (
    <div className="container-x py-12">
      <p className="eyebrow text-center">MADE TO MEASURE</p>
      <h1 className="font-display copper-text mt-2 text-center text-4xl md:text-6xl">اطلب تفصيل على مقاسك</h1>
      <p className="mx-auto mb-10 mt-3 max-w-xl text-center text-muted">اختر النوع وأدخل القياسات. حقول القياس تتغير حسب ما تختار.</p>
      <CustomForm products={products} />
    </div>
  )
}
