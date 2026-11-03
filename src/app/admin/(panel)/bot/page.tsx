import type { Metadata } from 'next'
import Link from 'next/link'
import { requireOwner, dt } from '@/lib/admin'
import { decrypt, maskSecret } from '@/lib/secure'
import { SITE } from '@/lib/format'
import { BotKeysForm, ConnectButton } from '@/components/admin/BotForms'
import { setBotEnabled, setHandledBy } from '@/app/admin/bot-actions'

export const metadata: Metadata = { title: 'بوت تليجرام', robots: { index: false } }
export const dynamic = 'force-dynamic'
/** ISO timestamp `d` days ago (server-rendered page, evaluated per request). */
const since = (d: number) => new Date(Date.now() - d * 864e5).toISOString()
function Stat({ l, v, tone = '' }: { l: string; v: number | null; tone?: string }) {
  return <div className="a-card"><p className="a-muted">{l}</p><p className={`font-display text-3xl ${tone}`}>{v ?? 0}</p></div>
}
type Hook = { url?: string; pending_update_count?: number; last_error_message?: string; last_error_date?: number }

export default async function BotPage() {
  const { sb } = await requireOwner()
  const { data: row } = await sb.from('integration_settings').select('config, secrets').eq('key', 'bot').maybeSingle()
  const config = (row?.config ?? {}) as { enabled?: boolean; username?: string | null; connected?: boolean; provider?: 'gemini' | 'claude'; mode?: 'site' | 'n8n' }
  const mode = config.mode === 'site' ? 'site' : 'n8n'
  const provider = config.provider === 'claude' ? 'claude' : 'gemini'
  const secrets = (row?.secrets ?? {}) as Record<string, string>
  const token = decrypt(secrets.token); const claudeKey = decrypt(secrets.anthropic_key); const geminiKey = decrypt(secrets.gemini_key); const key = provider === 'claude' ? claudeKey : geminiKey
  let hook: Hook | null = null
  if (token) { try { const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, { cache: 'no-store', signal: AbortSignal.timeout(6000) }); hook = ((await r.json()) as { result?: Hook }).result ?? null } catch { hook = null } }
  const hookOk = mode === 'site' ? !!hook?.url && hook.url === `${SITE}/api/telegram/bot` : !!hook?.url && !hook.url.startsWith(SITE)
  const ready = mode === 'site' ? !!token && !!key && hookOk : !!token && hookOk
  const tgConv = () => sb.from('bot_conversations').select('id', { count: 'exact', head: true }).eq('channel', 'telegram')
  const [all, week, waiting, human, msgsToday, aiToday, humanToday, { data: list }] = await Promise.all([
    tgConv(), tgConv().gte('last_message_at', since(7)), tgConv().eq('needs_human', true), tgConv().eq('handled_by', 'human'),
    sb.from('bot_messages').select('id, bot_conversations!inner(channel)', { count: 'exact', head: true }).eq('bot_conversations.channel', 'telegram').eq('role', 'customer').gte('sent_at', since(1)),
    sb.from('bot_messages').select('id, bot_conversations!inner(channel)', { count: 'exact', head: true }).eq('bot_conversations.channel', 'telegram').eq('role', 'bot').eq('author', 'ai').gte('sent_at', since(1)),
    sb.from('bot_messages').select('id, bot_conversations!inner(channel)', { count: 'exact', head: true }).eq('bot_conversations.channel', 'telegram').eq('role', 'bot').eq('author', 'human').gte('sent_at', since(1)),
    sb.from('bot_conversations').select('id, customer_name, external_id, handled_by, needs_human, last_message_at').eq('channel', 'telegram').order('needs_human', { ascending: false }).order('last_message_at', { ascending: false }).limit(25),
  ])
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="a-h1">بوت تليجرام</h1>
        {config.username && <a className="a-btn" target="_blank" rel="noopener" href={`https://t.me/${config.username}`}>فتح البوت @{config.username}</a>}</div>
      <p className="a-muted">مساعد تلقائي للزبائن يعمل داخل الموقع 24 ساعة (بدون n8n أو ngrok)، يجيب عن الأسعار والتوفر والتفصيل وحالة الطلب من بيانات الموقع الحقيقية، ويحوّل لك المحادثة عند الحاجة.</p>

      <section className="a-card flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="font-semibold">الحالة</h2>
          <p className="mt-1 text-sm">{config.enabled && ready ? <span className="a-pill bg-emerald-100 text-emerald-800">يعمل ويرد تلقائياً</span> : config.enabled ? <span className="a-pill bg-amber-100 text-amber-800">مُفعّل لكن الإعداد ناقص</span> : <span className="a-pill bg-stone-200 text-stone-700">متوقف (يحفظ الرسائل فقط)</span>}</p>
          <ul className="a-muted mt-2 space-y-0.5"><li>{token ? '✅' : '⬜'} توكن البوت</li><li>طريقة التشغيل: <b>{mode === 'n8n' ? 'عبر n8n' : 'داخل الموقع'}</b></li>{mode === 'site' && <li>{key ? '✅' : '⬜'} مفتاح {provider === 'claude' ? 'Claude' : 'Gemini'}</li>}<li>{hookOk ? '✅' : '⬜'} {mode === 'n8n' ? 'تليجرام مربوط بـ n8n (Telegram Trigger مفعّل)' : 'مربوط بتليجرام'}{hook?.url && mode === 'n8n' && <span dir="ltr" className="ms-1 text-xs">({new URL(hook.url).host})</span>}{hook?.last_error_message && <span className="text-rose-700"> · آخر خطأ: {hook.last_error_message}</span>}</li></ul></div>
        <form action={setBotEnabled}><input type="hidden" name="enabled" value={config.enabled ? '0' : '1'} /><button className={`a-btn ${config.enabled ? 'a-btn-danger' : 'a-btn-solid'}`}>{config.enabled ? 'إيقاف البوت' : 'تشغيل البوت'}</button></form>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat l="محادثات بانتظار موظف" v={waiting.count} tone={waiting.count ? 'text-rose-700' : ''} /><Stat l="محادثات نشطة (7 أيام)" v={week.count} />
        <Stat l="رسائل الزبائن (24 ساعة)" v={msgsToday.count} /><Stat l="ردود البوت (24 ساعة)" v={aiToday.count} />
        <Stat l="ردودك اليدوية (24 ساعة)" v={humanToday.count} /><Stat l="محادثات بيدك الآن" v={human.count} /><Stat l="كل المحادثات" v={all.count} />
      </section>

      <section className="a-card a-scroll space-y-3"><h2 className="font-semibold">المحادثات</h2>
        <table className="a-table"><thead><tr><th>الزبون</th><th>من يرد</th><th>آخر رسالة</th><th></th></tr></thead><tbody>
          {list?.map((c) => <tr key={c.id}><td><Link href={`/admin/conversations/${c.id}`} className="font-medium text-[#8f6a2e] underline">{c.customer_name ?? c.external_id}</Link>{c.needs_human && <span className="a-pill ms-2 bg-rose-100 text-rose-800">ينتظر رداً</span>}</td>
            <td>{c.handled_by === 'human' ? '👤 أنت' : '🤖 البوت'}</td><td className="whitespace-nowrap">{dt(c.last_message_at)}</td>
            <td><form action={setHandledBy}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="to" value={c.handled_by === 'human' ? 'bot' : 'human'} /><button className="a-btn !min-h-8">{c.handled_by === 'human' ? 'إرجاع للبوت' : 'استلام'}</button></form></td></tr>)}
          {!list?.length && <tr><td colSpan={4} className="a-muted py-8 text-center">لا محادثات بعد</td></tr>}</tbody></table></section>

      <section className="a-card space-y-3"><h2 className="font-semibold">الإعداد</h2>
        <ol className="a-muted list-decimal space-y-1 ps-5"><li>أنشئ بوتاً جديداً للزبائن من @BotFather بالأمر <span dir="ltr">/newbot</span> وانسخ التوكن (لا تستعمل بوت الإشعارات).</li>
          <li>أنشئ مفتاح Gemini مجاناً من <span dir="ltr">aistudio.google.com</span> ← Get API key (أو مفتاح Claude من <span dir="ltr">console.anthropic.com</span> إن اخترت Claude).</li><li>الصقهما هنا واحفظ، ثم اضغط «ربط البوت بتليجرام»، ثم «تشغيل البوت».</li></ol>
        <BotKeysForm tokenMasked={maskSecret(token)} keyMasked={maskSecret(claudeKey)} geminiMasked={maskSecret(geminiKey)} provider={provider} mode={mode} />
        {token && mode === 'site' && <ConnectButton />}
        {mode === 'n8n' && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">في وضع n8n: لا تضغط «ربط البوت» هنا. الربط يتم تلقائياً عند تفعيل workflow البوت في n8n (عقدة Telegram Trigger). التوكن هنا مطلوب فقط لإرسال ردودك اليدوية من الداشبورد. توثيق نقاط الـ HTTP في صفحة الربط ← توثيق API.</p>}</section>
    </>
  )
}
