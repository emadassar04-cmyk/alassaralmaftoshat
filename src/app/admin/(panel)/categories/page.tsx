import type { Metadata } from 'next'
import { requireStaff } from '@/lib/admin'
import { CategoryManager, type Cat } from '@/components/admin/CategoryForms'

export const metadata: Metadata = { title: 'الأقسام', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Categories() {
  const { sb } = await requireStaff()
  const { data } = await sb.from('categories').select('id, name, slug, description, image_url, is_visible, sort, products(id)').order('sort').order('name')
  const cats: Cat[] = (data ?? []).map(({ products, ...c }) => ({ ...c, products: (products as unknown[] | null)?.length ?? 0 }) as Cat)
  return (
    <>
      <h1 className="a-h1">الأقسام</h1>
      <p className="a-muted">الترتيب هنا هو ترتيب ظهور الأقسام في الرئيسية والقوائم. القسم الفاضي ما بيظهر للزبائن حتى لو كان «ظاهر».</p>
      <CategoryManager cats={cats} />
    </>
  )
}
