import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaff, dt } from '@/lib/admin'
import { deletePost } from '@/app/admin/misc-actions'

export const metadata: Metadata = { title: 'المدونة', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function BlogAdmin() {
  const { sb } = await requireStaff()
  const { data } = await sb.from('posts').select('id, title, slug, published, published_at').order('published_at', { ascending: false })
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="a-h1">المدونة</h1><Link href="/admin/blog/new" className="a-btn a-btn-solid">+ مقال جديد</Link></div>
      <p className="a-muted">مقالات النصائح تساعد زبائنك على إيجادك في جوجل.</p>
      <div className="a-card a-scroll !p-0"><table className="a-table"><thead><tr><th>العنوان</th><th>الحالة</th><th>التاريخ</th><th></th></tr></thead><tbody>
        {data?.map((p) => <tr key={p.id}><td><Link href={`/admin/blog/${p.id}`} className="font-medium text-[#8f6a2e] underline">{p.title}</Link></td><td><span className={`a-pill ${p.published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>{p.published ? 'منشور' : 'مسودة'}</span></td><td>{dt(p.published_at)}</td>
          <td><form action={deletePost}><input type="hidden" name="id" value={p.id} /><button className="a-btn a-btn-danger !min-h-8 !px-2" aria-label="حذف">✕</button></form></td></tr>)}</tbody></table></div>
    </>
  )
}
