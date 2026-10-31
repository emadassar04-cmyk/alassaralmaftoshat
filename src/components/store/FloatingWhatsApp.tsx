'use client'
import { MessageCircle } from 'lucide-react'
import { track } from '@/lib/pixel'
import { waLink } from '@/lib/format'

export function FloatingWhatsApp({ phone }: { phone: string | null }) {
  if (!phone) return null
  return (
    <a href={waLink(phone, 'مرحباً مفروشات العصار، عندي استفسار')} target="_blank" rel="noopener" aria-label="تواصل معنا على واتساب"
      onClick={() => track('Contact')}
      className="fixed bottom-5 start-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,.35)] transition-transform hover:scale-105">
      <MessageCircle size={28} />
    </a>
  )
}
