import type { Metadata } from 'next'
import { requireOwner } from '@/lib/admin'

export const metadata: Metadata = { title: 'التقارير', robots: { index: false } }
export const dynamic = 'force-dynamic'
export default async function Reports() {
  const { sb } = await requireOwner()
  const { data: branches } = await sb.from('branches').select('id, name').order('sort')
  return (
    <>
      <h1 className="a-h1">التقارير</h1><p className="a-muted">للمالك فقط. اختر النوع والفترة ثم نزّل Excel أو افتح نسخة للطباعة وحفظها PDF.</p>
      <form method="get" className="a-card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="a-lbl">نوع التقرير<select name="type" className="a-field mt-1"><option value="sales">المبيعات (طلب لكل سطر)</option><option value="orders">تفاصيل الطلبات (بند لكل سطر)</option><option value="customers">الزبائن (كل الفترات)</option></select></label>
        <label className="a-lbl">الفرع<select name="branch" className="a-field mt-1"><option value="">الفرعان</option>{branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="a-lbl">من تاريخ<input type="date" name="from" className="a-field mt-1" /></label>
        <label className="a-lbl">إلى تاريخ<input type="date" name="to" className="a-field mt-1" /></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
          <button formAction="/admin/reports/export" className="a-btn a-btn-solid">تنزيل Excel</button>
          <button formAction="/admin/reports/print" className="a-btn">عرض للطباعة / PDF</button></div>
      </form>
    </>
  )
}
