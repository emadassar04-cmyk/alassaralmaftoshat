'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

/** Subscribes (via Realtime, filtered by RLS to staff) to new orders and refreshes the page data. */
export function LiveOrders() {
  const router = useRouter(); const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    const sb = supabaseBrowser()
    const ch = sb.channel('orders-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
      if (p.eventType === 'INSERT') { setToast(`طلب جديد ${(p.new as { number?: string }).number ?? ''}`); setTimeout(() => setToast(null), 6000) }
      router.refresh()
    }).subscribe()
    return () => { void sb.removeChannel(ch) }
  }, [router])
  if (!toast) return null
  return <div role="status" className="fixed start-4 top-4 z-50 rounded-lg bg-[#8f6a2e] px-4 py-3 text-white shadow-lg">🔔 {toast}</div>
}
