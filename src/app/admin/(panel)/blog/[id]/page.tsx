import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/admin'
import { PostForm } from '@/components/admin/MiscForms'

export const metadata: Metadata = { title: 'مقال', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function PostEdit(props: PageProps<'/admin/blog/[id]'>) {
  const { id } = await props.params
  const { sb } = await requireStaff()
  let post = null
  if (id !== 'new') { if (!/^[0-9a-f-]{36}$/.test(id)) notFound(); const { data } = await sb.from('posts').select('id, title, slug, excerpt, body, published').eq('id', id).maybeSingle(); if (!data) notFound(); post = data }
  return <><div><Link href="/admin/blog" className="a-muted underline">← المدونة</Link><h1 className="a-h1">{post ? 'تعديل مقال' : 'مقال جديد'}</h1></div><PostForm post={post} /></>
}
