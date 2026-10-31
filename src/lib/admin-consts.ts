// Client-safe constants/helpers (no server-only imports)
export type Role = 'owner' | 'supervisor'
export const PAYMENT_AR: Record<string, string> = { in_store: 'في المحل', cod: 'عند التوصيل', palpay: 'PalPay', jawwal_pay: 'جوال باي', bank_palestine: 'بنك فلسطين' }
export const STATUS_AR: Record<string, string> = { new: 'جديد', confirmed: 'مؤكد', ready: 'جاهز', received: 'مستلم', cancelled: 'ملغي' }
export const STATUS_TONE: Record<string, string> = { new: 'bg-amber-100 text-amber-800', confirmed: 'bg-sky-100 text-sky-800', ready: 'bg-violet-100 text-violet-800', received: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-rose-100 text-rose-800' }
export const dt = (s: string) => new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Gaza' })
