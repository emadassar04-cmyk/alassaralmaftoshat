# مفروشات العصار (Al-Assar) — ملخص ثابت للمشروع

- متجر عربي RTL فاخر لمحل مفروشات في غزة (منذ 1996): فرعا دير البلح والنصيرات، مخزون مشترك. العملة ₪ والأرقام إنجليزية.
- الشعار: «بيتك يستاهل الأفخم». Mobile-first (زوار فيسبوك على الموبايل). الأداء أولوية (غزة: إنترنت ضعيف).
- المنتجات المفصّلة (`is_custom`): فرش عربي، باطنة، ستائر؛ حقول القياس من `products.measurement_schema` (jsonb) لا من الكود.

## التقنيات
Next.js 16 (App Router) + TypeScript + Tailwind v4، Framer Motion + Lenis، Supabase (Postgres/Auth/Storage + RLS)، Vercel.
**Next 16 مختلف عن المعروف**: اقرأ `node_modules/next/dist/docs/` قبل كتابة كود جديد (`params` Promise، `PageProps<'/route'>`، لا middleware بل proxy).

## الهوية «ليل ونحاس»
خلفية `#0E0B09`، نحاسي `#C8A36A`/`#E6C48E`، كريمي `#F3EBDD`، ثانوي `#A89C8A`، زيتوني `#2E3A2F`. عناوين Reem Kufi ونص IBM Plex Sans Arabic. الرموز في `src/app/globals.css`.

## الأمان (قواعد ثابتة)
- لا أسرار في المتصفح. مفتاح anon/publishable فقط للعامة؛ كل الجداول RLS.
- الكتابة من الزائر (طلب/ليد/تقييم/كوبون) فقط عبر `/api/*` ← RPC من نوع SECURITY DEFINER تتحقق من `SERVER_RPC_SECRET` (hash في `app_private.secrets`). السيرفر يعيد حساب الأسعار من القاعدة.
- حماية السبام: honeypot + rate limit داخل القاعدة (`app_private.rl`) + Turnstile عند ضبط المفاتيح.
- المخزون يُخصم عند التحويل إلى «مؤكد» ويُرجع عند الإلغاء (trigger). منتجات التفصيل خارج المخزون.
- كل تعديل على القاعدة = migration في `supabase/migrations/`.

## الأدوار
المالك (كل شيء) / مشرف بضاعة (منتجات، مخزون، عروض، طلبات، تقييمات؛ لا مالية ولا إعدادات) / الزبون (رابط تتبع فقط). تُطبَّق بـ RLS (`is_staff()`، `is_owner()`).

## المراحل
1) المتجر (هذه المرحلة) 2) لوحات التحكم 3) ربط n8n والبوت. لا تبدأ مرحلة قبل موافقة المالك.
