export type Field = {
  key: string; label: string; type: 'number' | 'select' | 'text'; options?: string[]; hint?: string
  showIf?: { key: string; in: string[] }
}
export type MeasurementSchema = { diagram?: 'curtains' | 'majlis' | 'batana'; fields: Field[] }
export type Category = { id: string; slug: string; name: string; description: string | null; image_url: string | null }
export type Variant = { id: string; product_id: string; label: string; color: string | null; size: string | null; fabric: string | null; price: number | null; stock: number }
export type Product = {
  id: string; slug: string; name: string; description: string | null; category_id: string | null
  base_price: number; sale_price: number | null; is_custom: boolean; is_bestseller: boolean
  measurement_schema: MeasurementSchema | null
  product_images: { url: string; alt: string | null; sort: number }[]
  product_variants: Variant[]
  categories?: { slug: string; name: string } | null
}
export type Branch = { id: string; slug: string; name: string; address: string | null; whatsapp: string | null; phone: string | null; hours: string | null; map_url: string | null }
export type Post = { slug: string; title: string; excerpt: string | null; body: string; cover_url: string | null; published_at: string }
export type Review = { id: string; product_id: string; author_name: string; rating: number; body: string | null; created_at: string }
export type PaymentMethod = 'in_store' | 'cod' | 'palpay' | 'jawwal_pay' | 'bank_palestine'
export type OrderStatus = 'new' | 'confirmed' | 'ready' | 'received' | 'cancelled'
export type CartLine = {
  key: string; product_id: string; variant_id: string | null; slug: string; name: string; variant_label: string | null
  image: string | null; unit_price: number; qty: number; is_custom: boolean; measurements?: Record<string, string> | null
}
export type TrackedOrder = {
  number: string; status: OrderStatus; created_at: string; fulfillment: 'pickup' | 'delivery'; payment_method: PaymentMethod
  subtotal: number; discount: number; total: number; address: string | null; branch: { name: string; whatsapp: string | null }
  items: { product_id: string; name: string; variant: string | null; qty: number; price: number; measurements: Record<string, string> | null; is_custom: boolean }[]
}
