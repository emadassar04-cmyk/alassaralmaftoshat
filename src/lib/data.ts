import { sb, hasSupabase } from './supabase'
import type { Branch, Category, Post, Product, Review } from './types'

const PRODUCT_SELECT = '*, product_images(url,alt,sort), product_variants(id,product_id,label,color,size,fabric,price,stock), categories(slug,name)'

async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!hasSupabase) return fallback
  try {
    const { data, error } = await fn()
    if (error) { console.error('[data]', error); return fallback }
    return data ?? fallback
  } catch (e) { console.error('[data]', e); return fallback }
}

export const getCategories = () => safe<Category[]>(() => sb().from('categories').select('*').order('sort'), [])
export const getBranches = () => safe<Branch[]>(() => sb().from('branches').select('*').eq('is_active', true).order('sort'), [])
export const getProducts = () => safe<Product[]>(() => sb().from('products').select(PRODUCT_SELECT).order('sort') as never, [])
export async function getProduct(slug: string) {
  const r = await safe<Product[]>(() => sb().from('products').select(PRODUCT_SELECT).eq('slug', slug).limit(1) as never, [])
  return r[0] ?? null
}
export const getPosts = () => safe<Post[]>(() => sb().from('posts').select('slug,title,excerpt,body,cover_url,published_at').eq('published', true).order('published_at', { ascending: false }), [])
export async function getPost(slug: string) { return (await safe<Post[]>(() => sb().from('posts').select('*').eq('slug', slug).eq('published', true).limit(1), []))[0] ?? null }
export const getReviews = (productId: string) => safe<Review[]>(() => sb().from('reviews').select('id,product_id,author_name,rating,body,created_at').eq('product_id', productId).order('created_at', { ascending: false }).limit(20), [])
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return safe<T>(async () => { const r = await sb().from('store_settings').select('value').eq('key', key).maybeSingle(); return { data: (r.data?.value as T) ?? null, error: r.error } }, fallback)
}
