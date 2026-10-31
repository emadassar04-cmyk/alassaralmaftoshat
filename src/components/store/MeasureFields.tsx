'use client'
import type { Field, MeasurementSchema } from '@/lib/types'

function Diagram({ kind }: { kind?: string }) {
  const c = '#c8a36a'
  if (kind === 'curtains') return (
    <svg viewBox="0 0 220 150" className="w-full max-w-xs" role="img" aria-label="رسم توضيحي لقياس الشباك">
      <rect x="50" y="25" width="120" height="85" fill="none" stroke={c} strokeWidth="2" /><line x1="110" y1="25" x2="110" y2="110" stroke={c} strokeOpacity=".4" /><line x1="50" y1="12" x2="170" y2="12" stroke={c} markerStart="url(#a)" /><text x="110" y="9" fill={c} fontSize="10" textAnchor="middle">العرض</text>
      <line x1="185" y1="25" x2="185" y2="110" stroke={c} /><text x="198" y="70" fill={c} fontSize="10">الارتفاع</text><line x1="30" y1="5" x2="190" y2="5" stroke={c} strokeOpacity=".3" strokeDasharray="3" /><text x="12" y="10" fill={c} fontSize="9">سقف</text>
    </svg>)
  if (kind === 'majlis') return (
    <svg viewBox="0 0 220 150" className="w-full max-w-xs" role="img" aria-label="رسم توضيحي لقياس الجلسة">
      <path d="M30 120V30H190V50H55V120Z" fill="none" stroke={c} strokeWidth="2" /><text x="110" y="24" fill={c} fontSize="10" textAnchor="middle">الضلع 1</text><text x="14" y="78" fill={c} fontSize="10">2</text><text x="200" y="45" fill={c} fontSize="10">3</text>
      <text x="110" y="140" fill={c} fontSize="9" textAnchor="middle">قِس كل ضلع من الداخل بالسنتيمتر</text>
    </svg>)
  return (
    <svg viewBox="0 0 220 150" className="w-full max-w-xs" role="img" aria-label="رسم توضيحي للباطنة">
      <path d="M40 60L130 40L190 70L100 92Z" fill="none" stroke={c} strokeWidth="2" /><path d="M40 60V80L100 112V92M190 70V90L100 112" fill="none" stroke={c} strokeWidth="2" /><text x="75" y="104" fill={c} fontSize="10">الطول</text><text x="160" y="106" fill={c} fontSize="10">العرض</text><text x="198" y="82" fill={c} fontSize="10">السماكة</text>
    </svg>)
}
export function MeasureFields({ schema, value, onChange }: { schema: MeasurementSchema; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const visible = (f: Field) => !f.showIf || f.showIf.in.includes(value[schema.fields.find((x) => x.key === f.showIf!.key)?.label ?? ''] ?? '')
  const set = (f: Field, v: string) => onChange({ ...value, [f.label]: v })
  return (
    <div className="space-y-4">
      <div className="flex justify-center border border-copper/15 bg-night p-3"><Diagram kind={schema.diagram} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.filter(visible).map((f) => (
          <label key={f.key} className="block text-sm text-muted">{f.label}
            {f.type === 'select' ? (
              <select required className="field mt-1" value={value[f.label] ?? ''} onChange={(e) => set(f, e.target.value)}><option value="" disabled>اختر</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
            ) : (
              <input required className="field mt-1" inputMode={f.type === 'number' ? 'decimal' : 'text'} dir={f.type === 'number' ? 'ltr' : undefined} value={value[f.label] ?? ''} onChange={(e) => set(f, e.target.value)} />
            )}
            {f.hint && <span className="mt-1 block text-xs text-muted/70">{f.hint}</span>}
          </label>
        ))}
      </div>
    </div>
  )
}
