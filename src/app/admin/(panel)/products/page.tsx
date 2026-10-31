import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import { fmt } from '@/lib/format'

export const metadata: Metadata = { title: 'المنتجات', robots: { index: false } }
export const dynamic = 'force-dynamic'
const clean = (s: string) => s.replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)

export default async function Products(props: PageProps<'/admin/products'>) {
  const { sb } = await requireStaff()
  const sp = await props.searchParams
  const v = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const { data: cats } = await sb.from('categories').select('id, name').order('sort')
  let q = sb.from('products').select('id, name, slug, base_price, sale_price, is_custom, status, categories(name), product_variants(stock), product_images(url, sort)').order('sort')
  if (v('cat')) q = q.eq('category_id', v('cat'))
  if (v('status')) q = q.eq('status', v('status'))
  if (clean(v('q'))) q = q.ilike('name', `%${clean(v('q'))}%`)
  const { data: rows } = await q
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="a-h1">المنتجات</h1><Link href="/admin/products/new" className="a-btn a-btn-solid">+ منتج جديد</Link></div>
      <form className="a-card grid gap-3 sm:grid-cols-4" method="get">
        <label className="a-lbl sm:col-span-2">بحث بالاسم<input name="q" defaultValue={v('q')} className="a-field mt-1" /></label>
        <label className="a-lbl">القسم<select name="cat" defaultValue={v('cat')} className="a-field mt-1"><option value="">الكل</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="a-lbl">الحالة<select name="status" defaultValue={v('status')} className="a-field mt-1"><option value="">الكل</option><option value="visible">ظاهر</option><option value="hidden">مخفي</option></select></label>
        <div className="flex gap-2 sm:col-span-4"><button className="a-btn a-btn-solid">تطبيق</button><Link href="/admin/products" className="a-btn">مسح</Link><span className="a-muted self-center">{rows?.length ?? 0} منتج</span></div>
      </form>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th></th><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th></tr></thead><tbody>
        {rows?.map((p) => {
          const img = [...(p.product_images as { url: string; sort: number }[])].sort((a, b) => a.sort - b.sort)[0]
          const stock = (p.product_variants as { stock: number }[]).reduce((n, x) => n + x.stock, 0)
          const minStock = (p.product_variants as { stock: number }[]).length ? Math.min(...(p.product_variants as { stock: number }[]).map((x) => x.stock)) : null
          return <tr key={p.id}><td className="w-16">{img && <Image src={img.url} alt="" width={48} height={48} className="h-12 w-12 rounded object-cover" />}</td>
            <td><Link href={`/admin/products/${p.id}`} className="font-medium text-[#8f6a2e] underline">{p.name}</Link>{p.is_custom && <span className="a-pill ms-2 bg-amber-100 text-amber-800">تفصيل</span>}</td>
            <td>{(p.categories as unknown as { name: string } | null)?.name}</td>
            <td className="whitespace-nowrap">{p.sale_price ? <><b>{fmt(p.sale_price)}</b> <s className="a-muted">{fmt(p.base_price)}</s></> : fmt(p.base_price)}</td>
            <td>{p.is_custom ? <span className="a-muted">—</span> : <span className={minStock !== null && minStock <= 5 ? 'font-semibold text-rose-700' : ''}>{stock}{minStock !== null && minStock <= 5 && ' ⚠'}</span>}</td>
            <td><span className={`a-pill ${p.status === 'visible' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{p.status === 'visible' ? 'ظاهر' : 'مخفي'}</span></td></tr>
        })}
        {!rows?.length && <tr><td colSpan={6} className="a-muted py-10 text-center">لا توجد منتجات</td></tr>}</tbody></table></div>
    </>
  )
}
