export type VisitConfig = { enabled: boolean; days: number[]; slots: string[]; capacity: number; lead_days: number; horizon_days: number; items: string[] }
export type Availability = { config: VisitConfig; today: string; booked: Record<string, number> }
export type VisitStatus = 'new' | 'confirmed' | 'done' | 'cancelled'

export const DAY_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
export const VISIT_STATUS_AR: Record<VisitStatus, string> = { new: 'جديد', confirmed: 'مؤكد', done: 'تمت الزيارة', cancelled: 'ملغي' }
export const DEFAULT_VISITS: VisitConfig = { enabled: true, days: [0, 1, 2, 3, 4, 6], slots: ['10:00', '12:00', '14:00', '16:00', '18:00'], capacity: 1, lead_days: 1, horizon_days: 14, items: ['ستائر', 'فرش عربي', 'باطنة', 'أخرى'] }

/** "14:00" -> "2:00 مساءً" */
export function slotLabel(s: string) {
  const [h, m] = s.split(':').map(Number)
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'صباحاً' : 'مساءً'}`
}
/** Calendar math on plain YYYY-MM-DD strings (UTC noon avoids DST edges). */
export function addDays(day: string, n: number) { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const dow = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay()
export function dayLabel(day: string, withYear = false) {
  const [y, m, d] = day.split('-').map(Number)
  return `${DAY_AR[dow(day)]} ${d}/${m}${withYear ? `/${y}` : ''}`
}
export function openDays(a: Availability) {
  const out: string[] = []
  for (let i = a.config.lead_days; i <= a.config.horizon_days; i++) { const d = addDays(a.today, i); if (a.config.days.includes(dow(d))) out.push(d) }
  return out
}
export const left = (a: Availability, day: string, slot: string) => Math.max(0, a.config.capacity - (a.booked[`${day} ${slot}`] ?? 0))
