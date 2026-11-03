/** ISO timestamp for the start/end of a calendar day in Gaza (handles the DST offset for that date). */
export function gazaIso(day: string, end = false) {
  const t = new Date(`${day}T12:00:00Z`)
  const off = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Gaza', timeZoneName: 'longOffset' }).formatToParts(t).find((p) => p.type === 'timeZoneName')?.value.replace('GMT', '') || '+02:00'
  return `${day}T${end ? '23:59:59' : '00:00:00'}${off === '' ? '+00:00' : off}`
}
export const isDay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
