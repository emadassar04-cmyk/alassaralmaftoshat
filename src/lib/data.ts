import { sb, hasSupabase } from './supabase'
import type { Branch, Category, Post, Product, Review } from './types'

const PRODUCT_SELECT = '*, product_images(url,alt,sort), product_variants(id,product_id,label,color,size,fabric,price,stock,sort), categories(slug,name)'

async function safe<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!hasSupabase) return fallback
  try {
    const { data, error } = await fn()
    if (error) { console.error('[data]', error); return fallback }
    return data ?? fallback
  } catch (e) { console.error('[data]', e); return fallback }
}

/** Storefront categories: only those with at least one visible product, so customers never land on an empty section. */
export const getCategories = async () => (await safe<(Category & { products?: unknown })[]>(() => sb().from('categories').select('*, products!inner(id)').eq('products.status', 'visible').eq('is_visible', true).order('sort') as never, []))
  .map(({ products: _p, ...c }) => c as Category)
export const getBranches = () => safe<Branch[]>(() => sb().from('branches').select('*').eq('is_active', true).order('sort'), [])
/** Mirrors app_private.active_sale(): a scheduled offer only counts inside its window, so the site never shows a price the server won't charge. */
const saleActive = (p: Product, now = Date.now()) => p.sale_price != null && (!p.sale_starts_at || Date.parse(p.sale_starts_at) <= now) && (!p.sale_ends_at || Date.parse(p.sale_ends_at) > now)
const ordered = (l: Product[]) => l.map((p) => ({ ...p, sale_price: saleActive(p) ? p.sale_price : null, product_variants: [...p.product_variants].sort((a, b) => ((a as { sort?: number }).sort ?? 0) - ((b as { sort?: number }).sort ?? 0)) }))
export const getProducts = async () => ordered(await safe<Product[]>(() => sb().from('products').select(PRODUCT_SELECT).order('sort') as never, []))
export async function getProduct(slug: string) {
  const r = ordered(await safe<Product[]>(() => sb().from('products').select(PRODUCT_SELECT).eq('slug', slug).limit(1) as never, []))
  return r[0] ?? null
}
export const getPosts = () => safe<Post[]>(() => sb().from('posts').select('slug,title,excerpt,body,cover_url,published_at').eq('published', true).order('published_at', { ascending: false }), [])
export async function getPost(slug: string) { return (await safe<Post[]>(() => sb().from('posts').select('*').eq('slug', slug).eq('published', true).limit(1), []))[0] ?? null }
export const getReviews = (productId: string) => safe<Review[]>(() => sb().from('reviews').select('id,product_id,author_name,rating,body,created_at').eq('product_id', productId).order('created_at', { ascending: false }).limit(20), [])
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return safe<T>(async () => { const r = await sb().from('store_settings').select('value').eq('key', key).maybeSingle(); return { data: (r.data?.value as T) ?? null, error: r.error } }, fallback)
}
