import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/admin'
import { ProductForm, type FormProduct } from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'تعديل منتج', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function ProductEdit(props: PageProps<'/admin/products/[id]'>) {
  const { id } = await props.params
  const { sb, staff } = await requireStaff()
  const { data: cats } = await sb.from('categories').select('id, name').order('sort')
  let product: FormProduct | null = null
  if (id !== 'new') {
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
    const { data } = await sb.from('products').select('*, product_variants(*), product_images(*)').eq('id', id).maybeSingle()
    if (!data) notFound()
    product = { ...data, product_variants: [...data.product_variants].sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort), product_images: [...data.product_images].sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort) } as FormProduct
  }
  return (
    <>
      <div><Link href="/admin/products" className="a-muted underline">← كل المنتجات</Link><h1 className="a-h1">{product ? product.name : 'منتج جديد'}</h1></div>
      <ProductForm product={product} categories={cats ?? []} canDelete={staff.role === 'owner'} />
    </>
  )
}
