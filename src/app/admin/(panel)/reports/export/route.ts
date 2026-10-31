import ExcelJS from 'exceljs'
import { requireOwner } from '@/lib/admin'
import { buildReport } from '@/lib/reports'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const { sb } = await requireOwner()
  const u = new URL(req.url); const g = (k: string) => u.searchParams.get(k) ?? ''
  const r = await buildReport(sb, g('type'), g('from'), g('to'), g('branch'))
  const wb = new ExcelJS.Workbook(); wb.creator = 'مفروشات العصار'
  const ws = wb.addWorksheet(r.title.slice(0, 30), { views: [{ rightToLeft: true, state: 'frozen', ySplit: 3 }] })
  ws.addRow([r.title]).font = { bold: true, size: 14 }; ws.addRow([r.subtitle]); const h = ws.addRow(r.columns)
  h.font = { bold: true, color: { argb: 'FFFFFFFF' } }; h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8F6A2E' } }; c.alignment = { horizontal: 'center' } })
  r.rows.forEach((row) => ws.addRow(row))
  r.moneyCols.forEach((i) => { ws.getColumn(i + 1).numFmt = '#,##0.00' })
  r.columns.forEach((c, i) => { ws.getColumn(i + 1).width = Math.max(14, c.length + 4) })
  ws.addRow([]); r.summary.forEach(([k, v]) => { const row = ws.addRow([k, v]); row.font = { bold: true } })
  const buf = await wb.xlsx.writeBuffer()
  return new Response(buf as ArrayBuffer, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="alassar-${g('type') || 'sales'}-${new Date().toISOString().slice(0, 10)}.xlsx"`, 'cache-control': 'no-store' } })
}
