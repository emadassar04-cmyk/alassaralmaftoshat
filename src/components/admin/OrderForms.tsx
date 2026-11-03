'use client'
import { useActionState } from 'react'
import { setItemPrice, setOrderStatus } from '@/app/admin/orders-actions'
import { STATUS_AR } from '@/lib/admin-consts'

export function StatusForm({ id, status }: { id: string; status: string }) {
  const [s, action, pending] = useActionState(setOrderStatus, undefined)
  return (
    <form key={status} action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="a-lbl">الحالة<select name="status" defaultValue={status} className="a-field mt-1 w-40">{Object.entries(STATUS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <button className="a-btn a-btn-solid" disabled={pending}>{pending ? '...' : 'تحديث'}</button>
      {s?.error && <p className="w-full text-sm text-rose-700" role="alert">{s.error}</p>}{s?.ok && <p className="w-full text-sm text-emerald-700" role="status">تم التحديث</p>}
    </form>
  )
}
export function ItemPriceForm({ id, unit, custom }: { id: string; unit: number; custom: number | null }) {
  const [s, action, pending] = useActionState(setItemPrice, undefined)
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input name="price" inputMode="decimal" dir="ltr" defaultValue={custom ?? ''} placeholder={String(unit)} aria-label="سعر خاص للوحدة" className="a-field !min-h-9 w-24" />
      <button className="a-btn !min-h-9" disabled={pending}>{pending ? '...' : 'حفظ'}</button>
      {s?.error && <span className="text-xs text-rose-700">{s.error}</span>}{s?.ok && <span className="text-xs text-emerald-700">✓</span>}
    </form>
  )
}
export function PrintButton() { return <button className="a-btn a-btn-solid no-print" onClick={() => window.print()}>طباعة / حفظ PDF</button> }
