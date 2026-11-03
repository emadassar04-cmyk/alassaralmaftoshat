import type { Metadata } from 'next'
import Link from 'next/link'
import { requireOwner, dt } from '@/lib/admin'
import { decrypt, maskSecret } from '@/lib/secure'
import { FacebookCard, GmailCard, N8nCard, RetryAll, TelegramCard, WhatsAppCard, type Badge } from '@/components/admin/IntegrationCards'
import { resendWebhook } from '@/app/admin/integrations-actions'

export const metadata: Metadata = { title: 'الربط', robots: { index: false } }
export const dynamic = 'force-dynamic'
const bad = (ok: boolean, on = 'متصل'): Badge => ok ? { label: on, tone: 'ok' } : { label: 'غير متصل', tone: 'off' }
const STAT: Record<string, string> = { pending: 'بالانتظار', sent: 'أُرسل', failed: 'فشل (سيُعاد)', dead: 'توقفت المحاولات' }
const TONE: Record<string, string> = { pending: 'bg-amber-100 text-amber-800', sent: 'bg-emerald-100 text-emerald-800', failed: 'bg-rose-100 text-rose-800', dead: 'bg-stone-300 text-stone-800' }

export default async function Integrations() {
  const { sb } = await requireOwner()
  const [{ data: rows }, { data: keys }, { data: logs }, { data: st }] = await Promise.all([
    sb.from('integration_settings').select('*'), sb.from('api_keys').select('prefix, last_used_at').is('revoked_at', null).order('created_at', { ascending: false }).limit(1),
    sb.from('webhook_logs').select('id, event, target, status, attempts, http_status, error, created_at').order('created_at', { ascending: false }).limit(15),
    sb.from('store_settings').select('value').eq('key', 'meta_pixel_id').maybeSingle()])
  const g = (k: string) => rows?.find((r) => r.key === k)
  const n8n = g('n8n'), wa = g('whatsapp'), tg = g('telegram'), fb = g('facebook'), gm = g('gmail')
  const c = (r: typeof n8n) => (r?.config ?? {}) as Record<string, string & boolean>
  const lastSent = logs?.find((l) => l.http_status != null && l.target === 'n8n')
  const n8nBadge: Badge = !c(n8n).enabled ? { label: c(n8n).webhook_url ? 'متوقف' : 'غير متصل', tone: c(n8n).webhook_url ? 'warn' : 'off' } : n8n?.last_test_status?.startsWith('ok') || lastSent?.status === 'sent' ? { label: 'متصل', tone: 'ok' } : { label: 'مُفعّل (لم يُختبر)', tone: 'warn' }
  const failed = logs?.filter((l) => l.status === 'failed' || l.status === 'dead').length ?? 0
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="a-h1">الربط</h1><Link href="/admin/integrations/docs" className="a-btn">توثيق API لـ n8n</Link></div>
      <p className="a-muted">كل المفاتيح السرية تُحفظ مشفّرة وتظهر مخفية. فشل الإرسال إلى n8n لا يوقف أي طلب أبداً: يُسجَّل ويُعاد لاحقاً تلقائياً.</p>
      <N8nCard badge={n8nBadge} last={n8n?.last_used_at ? dt(n8n.last_used_at) : null} url={c(n8n).webhook_url ?? ''} enabled={!!c(n8n).enabled} signingMasked={maskSecret(decrypt((n8n?.secrets as Record<string, string>)?.signing))}
        keyPrefix={keys?.[0]?.prefix ?? null} lastWebhook={lastSent ? `HTTP ${lastSent.http_status} · ${lastSent.event}` : null} />
      <WhatsAppCard badge={bad(!!c(wa).phone_id && wa?.last_test_status === 'ok')} last={wa?.last_test_at ? dt(wa.last_test_at) : null} phoneId={c(wa).phone_id ?? ''} tokenMasked={maskSecret(decrypt((wa?.secrets as Record<string, string>)?.token))} />
      <TelegramCard badge={bad(!!c(tg).chat_id && tg?.last_test_status === 'ok')} last={tg?.last_test_at ? dt(tg.last_test_at) : null} chatId={c(tg).chat_id ?? ''} tokenMasked={maskSecret(decrypt((tg?.secrets as Record<string, string>)?.token))} notify={!!c(tg).notify} />
      <FacebookCard badge={bad(!!c(fb).page_url || !!st?.value, 'مضبوط')} pageUrl={c(fb).page_url ?? ''} pixel={typeof st?.value === 'string' ? st.value : ''} />
      <GmailCard badge={bad(!!c(gm).email, 'مضبوط')} email={c(gm).email ?? ''} />
      <section className="a-card a-scroll space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl text-[#8f6a2e]">سجل الأحداث المرسلة (n8n وتليجرام)</h2>{failed > 0 && <RetryAll />}</div>
        <table className="a-table"><thead><tr><th>الحدث</th><th>الوجهة</th><th>الحالة</th><th>المحاولات</th><th>HTTP</th><th>الوقت</th><th></th></tr></thead><tbody>
          {logs?.map((l) => <tr key={l.id}><td dir="ltr" className="text-end font-mono">{l.event}</td><td>{l.target === 'telegram' ? 'تليجرام' : 'n8n'}</td><td><span className={`a-pill ${TONE[l.status]}`}>{STAT[l.status]}</span>{l.error && <p className="a-muted mt-1">{l.error}</p>}</td><td>{l.attempts}</td><td dir="ltr" className="text-end">{l.http_status ?? '—'}</td><td className="whitespace-nowrap">{dt(l.created_at)}</td>
            <td>{l.status !== 'sent' && <form action={resendWebhook}><input type="hidden" name="id" value={l.id} /><button className="a-btn !min-h-8">إعادة إرسال</button></form>}</td></tr>)}
          {!logs?.length && <tr><td colSpan={7} className="a-muted py-8 text-center">لا أحداث بعد. فعّل الربط وسيظهر هنا كل ما يُرسل.</td></tr>}</tbody></table>
      </section>
    </>
  )
}
