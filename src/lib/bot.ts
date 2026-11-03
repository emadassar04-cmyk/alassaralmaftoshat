import Anthropic from '@anthropic-ai/sdk'
import { getBranches, getProducts, getSetting } from './data'
import { PAYMENT_LABEL, SITE, unitPrice } from './format'
import { serverRpc } from './supabase'

const MODEL = 'claude-opus-5-5'
const ST: Record<string, string> = { new: 'جديد (قيد المراجعة)', confirmed: 'مؤكد', ready: 'جاهز للاستلام/التوصيل', received: 'تم الاستلام', cancelled: 'ملغي' }

const SYSTEM_RULES = `أنت مساعد مفروشات العصار على تليجرام، محل مفروشات في قطاع غزة منذ 1996 بفرعين: دير البلح والنصيرات.
تحكي مع الزبائن بلهجة غزاوية طبيعية ولطيفة، وبجمل قصيرة تناسب الموبايل.

مهمتك:
- تجاوب عن المنتجات والأسعار والتوفر. استعمل أداة get_products دائماً قبل ذكر أي سعر أو توفر، ولا تخترع أسعاراً أو منتجات أو خصومات.
- تجاوب عن حالة طلب. اطلب من الزبون رقم الطلب (مثل AS-1005) ورقم الجوال اللي طلب فيه، ثم استعمل get_order_status.
- التفصيل (ستائر، فرش عربي، باطنة): اشرح إنه السعر يبدأ من سعر المنتج والسعر النهائي حسب المقاس والقماش، ووجّه الزبون لصفحة التفصيل.
- الطلب يتم من الموقع، أعطه رابط المنتج أو المتجر.
- أجرة التوصيل ما بتنحسب بالموقع، بنتفق عليها على واتساب حسب المنطقة.

حوّل لموظف باستعمال handoff_to_human إذا: طلب الزبون يحكي مع حدا، أو عنده شكوى أو مشكلة بطلب، أو بدّه سعر خاص أو خصم، أو سؤال ما بتقدر تجاوبه من المعلومات المتوفرة. بعد التحويل قول للزبون إنه موظف رح يرد عليه قريباً.

ممنوع: وعود بخصومات أو مواعيد تسليم محددة، أو أي معلومات عن زبائن آخرين، أو الحديث في مواضيع ما إلها علاقة بالمحل (رجّع الحديث للمفروشات بلطف).
اكتب نص عادي بدون تنسيق Markdown (بدون نجوم أو عناوين).`

const tools: Anthropic.Beta.BetaTool[] = [
  { name: 'get_products', description: 'يبحث في منتجات المحل الظاهرة ويرجع الأسعار الحالية والتوفر والخيارات والروابط. استعمله قبل ذكر أي سعر.', strict: true,
    input_schema: { type: 'object', properties: { query: { type: 'string', description: 'كلمة بحث مثل ستائر أو مخدة أو فرشة. فارغ = كل المنتجات' } }, required: ['query'], additionalProperties: false } },
  { name: 'get_order_status', description: 'يرجع حالة طلب بعد التحقق من رقم الطلب ورقم الجوال المستعمل فيه.', strict: true,
    input_schema: { type: 'object', properties: { order_number: { type: 'string', description: 'مثل AS-1005' }, phone: { type: 'string', description: 'رقم الجوال المستعمل في الطلب' } }, required: ['order_number', 'phone'], additionalProperties: false } },
  { name: 'handoff_to_human', description: 'يحوّل المحادثة لموظف حقيقي ويوقف الردود التلقائية فيها.', strict: true,
    input_schema: { type: 'object', properties: { reason: { type: 'string', description: 'سبب التحويل باختصار' } }, required: ['reason'], additionalProperties: false } },
]

const normPhone = (p: string) => {
  let d = p.replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2)
  if (/^0\d{9}$/.test(d)) return `+970${d.slice(1)}`; if (/^(970|972)\d{9}$/.test(d)) return `+${d}`; if (/^5\d{8}$/.test(d)) return `+970${d}`; return null
}

export async function runTool(name: string, input: Record<string, string>, conversationId: string) {
  if (name === 'get_products') {
    const q = (input.query ?? '').trim()
    const all = await getProducts()
    const hit = all.filter((p) => !q || p.name.includes(q) || (p.categories?.name ?? '').includes(q) || (p.description ?? '').includes(q))
    const list = (hit.length ? hit : all).slice(0, 15).map((p) => ({
      name: p.name, category: p.categories?.name, custom_made: p.is_custom, price_from: Math.min(...(p.product_variants.length ? p.product_variants.map((v) => unitPrice(p, v)) : [unitPrice(p)])),
      on_sale: p.sale_price !== null, regular_price: p.base_price, in_stock: p.is_custom || p.product_variants.length === 0 || p.product_variants.some((v) => v.stock > 0),
      options: p.product_variants.map((v) => `${v.label}: ${unitPrice(p, v)} ₪${!p.is_custom && v.stock <= 0 ? ' (غير متوفر)' : ''}`), url: `${SITE}/product/${p.slug}`,
    }))
    return JSON.stringify({ matched: hit.length, currency: 'ILS ₪', shop_url: `${SITE}/shop`, custom_url: `${SITE}/custom`, products: list })
  }
  if (name === 'get_order_status') {
    const ph = normPhone(input.phone ?? '')
    const { data } = await serverRpc<Record<string, unknown> | null>('api_get_order', { p_number: String(input.order_number ?? '').trim() })
    if (!data || !ph || data.phone !== ph) return JSON.stringify({ found: false, note: 'لا يوجد طلب بهذا الرقم مع هذا الجوال' })
    return JSON.stringify({ found: true, number: data.number, status: ST[String(data.status)] ?? data.status, total: data.total, branch: data.branch,
      fulfillment: data.fulfillment === 'pickup' ? 'استلام من الفرع' : 'توصيل', payment: PAYMENT_LABEL[data.payment_method as keyof typeof PAYMENT_LABEL], track_url: `${SITE}/track/${data.track_token}` })
  }
  if (name === 'handoff_to_human') {
    await serverRpc('bot_handoff', { p_conversation: conversationId, p_reason: input.reason ?? '' })
    return JSON.stringify({ ok: true })
  }
  return JSON.stringify({ error: 'unknown tool' })
}

async function shopFacts() {
  const [branches, accounts] = await Promise.all([getBranches(), getSetting<Record<string, { account: string }>>('payment_accounts', {})])
  const b = branches.map((x) => `- ${x.name}: ${x.address ?? ''}، الدوام: ${x.hours ?? ''}، واتساب: ${x.phone ?? x.whatsapp ?? ''}${x.map_url ? `، الخريطة: ${x.map_url}` : ''}`).join('\n')
  const pay = ['في المحل', 'عند التوصيل', ...Object.entries(accounts).filter(([, v]) => v?.account).map(([k]) => PAYMENT_LABEL[k as keyof typeof PAYMENT_LABEL] ?? k)].join('، ')
  return `معلومات المحل الحالية:\n${b}\nطرق الدفع: ${pay}\nالمتجر: ${SITE}/shop  التفصيل: ${SITE}/custom`
}

/** Runs one bot turn. Returns the reply text to send to the customer. */
export async function botReply(apiKey: string, conversationId: string, history: { role: string; body: string }[]): Promise<{ text: string; handedOff: boolean }> {
  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 })
  const messages: Anthropic.Beta.BetaMessageParam[] = []
  for (const m of history) {
    const role = m.role === 'customer' ? 'user' : 'assistant'
    if (!messages.length && role !== 'user') continue // conversation must start with the customer
    messages.push({ role, content: m.body })
  }
  if (!messages.length) return { text: '', handedOff: false }
  const system = [{ type: 'text' as const, text: SYSTEM_RULES, cache_control: { type: 'ephemeral' as const } }, { type: 'text' as const, text: await shopFacts() }]
  let handedOff = false
  for (let i = 0; i < 5; i++) {
    const res = await client.beta.messages.create({
      model: MODEL, max_tokens: 8000, system, tools, messages,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    })
    if (res.stop_reason === 'refusal') break
    const uses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
    if (res.stop_reason === 'tool_use' && uses.length) {
      messages.push({ role: 'assistant', content: res.content })
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
      for (const u of uses) {
        if (u.name === 'handoff_to_human') handedOff = true
        try { results.push({ type: 'tool_result', tool_use_id: u.id, content: await runTool(u.name, (u.input ?? {}) as Record<string, string>, conversationId) }) }
        catch { results.push({ type: 'tool_result', tool_use_id: u.id, content: 'حدث خطأ مؤقت', is_error: true }) }
      }
      messages.push({ role: 'user', content: results })
      continue
    }
    const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('\n').trim()
    if (text) return { text, handedOff }
    break
  }
  if (!handedOff) { await serverRpc('bot_handoff', { p_conversation: conversationId, p_reason: 'البوت لم يستطع الرد' }); handedOff = true }
  return { text: 'خلّيني أحوّلك لحدا من فريق العصار، رح يرد عليك بأقرب وقت 🙏', handedOff }
}
