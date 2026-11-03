import { workflow, node, trigger, sticky, newCredential, ifElse, languageModel, tool, fromAi, expr } from '@n8n/workflow-sdk';

const SITE = 'https://alassaralmaftoshat.vercel.app';

const SYSTEM = 'أنت مساعد مفروشات العصار على تليجرام، محل مفروشات في قطاع غزة منذ 1996 بفرعين: دير البلح والنصيرات (مخزون مشترك).\n' +
'تحكي مع الزبائن بلهجة غزاوية طبيعية ولطيفة، وبجمل قصيرة تناسب الموبايل. العملة شيكل ₪ والأرقام إنجليزية.\n\n' +
'الأدوات:\n' +
'- get_products: استعملها دائماً قبل ذكر أي سعر أو توفر أو منتج. لا تخترع أسعاراً أو منتجات أو خصومات.\n' +
'- get_order_status: لحالة طلب. اطلب من الزبون رقم الطلب (مثل AS-1005) ورقم الجوال اللي طلب فيه، وبعدين استعملها.\n' +
'- handoff_to_human: حوّل لموظف إذا طلب الزبون يحكي مع حدا، أو عنده شكوى أو مشكلة بطلب، أو بدّه سعر خاص أو خصم، أو سؤال ما بتقدر تجاوبه. بعد التحويل قول للزبون إنه موظف رح يرد عليه قريباً.\n\n' +
'معلومات:\n' +
'- التفصيل (ستائر، فرش عربي، باطنة): السعر يبدأ من سعر المنتج والنهائي حسب المقاس والقماش، ووجّه الزبون لصفحة التفصيل ' + SITE + '/custom\n' +
'- الطلب يتم من الموقع ' + SITE + '/shop ، أعطه رابط المنتج من نتيجة get_products.\n' +
'- أجرة التوصيل ما بتنحسب بالموقع، بنتفق عليها على واتساب حسب المنطقة.\n\n' +
'ممنوع: وعود بخصومات أو مواعيد تسليم محددة، أو أي معلومات عن زبائن آخرين، أو الحديث في مواضيع ما إلها علاقة بالمحل (رجّع الحديث للمفروشات بلطف).\n' +
'اكتب نص عادي بدون تنسيق Markdown (بدون نجوم أو عناوين).';

const telegramIn = trigger({
  type: 'n8n-nodes-base.telegramTrigger',
  version: 1.5,
  config: {
    name: 'Customer Message',
    parameters: { updates: ['message'] },
    credentials: { telegramApi: newCredential('Alassar Customer Bot') }
  },
  output: [{ update_id: 1001, message: { message_id: 5, chat: { id: 123456, type: 'private' }, from: { id: 123456, first_name: 'Ahmad' }, text: 'مرحبا، قديش سعر الستائر؟' } }]
});

const hasText = ifElse({
  version: 2.2,
  config: {
    name: 'Is Text Message?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.message.text }}'), operator: { type: 'string', operation: 'notEmpty', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const saveIncoming = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Save Incoming Message',
    parameters: {
      method: 'POST',
      url: SITE + '/api/v1/bot/incoming',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ update_id: $json.update_id, chat_id: String($json.message.chat.id), name: [$json.message.from.first_name, $json.message.from.last_name].filter(Boolean).join(" ") || null, text: $json.message.text }) }}'),
      options: { timeout: 20000 }
    },
    credentials: { httpHeaderAuth: newCredential('Alassar Site API') }
  },
  output: [{ ok: true, duplicate: false, conversation_id: '00000000-0000-0000-0000-000000000000', should_reply: true, reason: null, is_start: false, history: [], history_text: '' }]
});

const shouldReply = ifElse({
  version: 2.2,
  config: {
    name: 'Bot Should Reply?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.should_reply }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const gemini = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.1,
  config: {
    name: 'Gemini',
    parameters: { modelName: 'models/gemini-flash-latest', options: { temperature: 0.4, maxOutputTokens: 1024 } },
    credentials: { googlePalmApi: newCredential('Gemini Alassar') }
  }
});

const productsTool = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.5,
  config: {
    name: 'get_products',
    parameters: {
      toolDescription: 'يبحث في منتجات المحل ويرجع الأسعار الحالية والتوفر والخيارات والروابط. استعمله قبل ذكر أي سعر.',
      method: 'GET',
      url: SITE + '/api/v1/bot/products',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'q', value: fromAi('query', 'كلمة بحث قصيرة مثل ستائر أو مخدة أو فرشة. فارغ = كل المنتجات', 'string') }] }
    },
    credentials: { httpHeaderAuth: newCredential('Alassar Site API') }
  }
});

const orderTool = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.5,
  config: {
    name: 'get_order_status',
    parameters: {
      toolDescription: 'يرجع حالة طلب بعد التحقق من رقم الطلب ورقم الجوال المستعمل فيه.',
      method: 'GET',
      url: SITE + '/api/v1/bot/order-status',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: { parameters: [
        { name: 'number', value: fromAi('order_number', 'رقم الطلب مثل AS-1005', 'string') },
        { name: 'phone', value: fromAi('phone', 'رقم الجوال المستعمل في الطلب', 'string') }
      ] }
    },
    credentials: { httpHeaderAuth: newCredential('Alassar Site API') }
  }
});

const handoffTool = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.5,
  config: {
    name: 'handoff_to_human',
    parameters: {
      toolDescription: 'يحوّل المحادثة لموظف حقيقي ويوقف الردود التلقائية فيها.',
      method: 'POST',
      url: SITE + '/api/v1/bot/handoff',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'keypair',
      bodyParameters: { parameters: [
        { name: 'conversation_id', value: expr('{{ $("Save Incoming Message").item.json.conversation_id }}') },
        { name: 'reason', value: fromAi('reason', 'سبب التحويل باختصار', 'string') }
      ] }
    },
    credentials: { httpHeaderAuth: newCredential('Alassar Site API') }
  }
});

const agent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Alassar Assistant',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.history_text ? "المحادثة السابقة:\\n" + $json.history_text + "\\n\\n" : "" }}{{ $json.is_start ? "الزبون فتح البوت الآن (/start). رحّب فيه باسم مفروشات العصار باختصار واسأله كيف بتقدر تساعده." : "رسالة الزبون الجديدة: " + $("Customer Message").item.json.message.text }}'),
      options: { systemMessage: SYSTEM, maxIterations: 6, enableStreaming: false }
    },
    subnodes: { model: gemini, tools: [productsTool, orderTool, handoffTool] }
  },
  output: [{ output: 'أهلين فيك! الستائر عنا بتبدأ من 25 ₪ للمتر.' }]
});

const sendReply = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send Reply',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $("Customer Message").item.json.message.chat.id }}'),
      text: expr('{{ $json.output.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }}'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Alassar Customer Bot') }
  },
  output: [{ ok: true, result: { message_id: 6 } }]
});

const saveReply = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Save Reply',
    parameters: {
      method: 'POST',
      url: SITE + '/api/v1/bot/reply',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ conversation_id: $("Save Incoming Message").item.json.conversation_id, text: $("Alassar Assistant").item.json.output }) }}')
    },
    credentials: { httpHeaderAuth: newCredential('Alassar Site API') }
  },
  output: [{ ok: true }]
});

const note = sticky('## بوت زبائن العصار\n1. تليجرام ← الموقع يحفظ الرسالة ويقرر إذا البوت يرد (تشغيل/إيقاف وتحويل لموظف من لوحة الموقع).\n2. Gemini يجاوب ويستعمل أدوات الموقع (منتجات، حالة طلب، تحويل لموظف).\n3. الرد يروح للزبون ويتسجل بالموقع.\n\nالحسابات: Alassar Customer Bot (توكن بوت الزبائن)، Gemini Alassar، Alassar Site API (Header X-API-Key).', [telegramIn, hasText, saveIncoming], { color: 4 });

export default workflow('alassar-customer-bot', 'Alassar - Telegram Customer Bot')
  .add(telegramIn)
  .to(hasText.onTrue(saveIncoming.to(shouldReply.onTrue(agent.to(sendReply.to(saveReply))))))
  .add(note);
