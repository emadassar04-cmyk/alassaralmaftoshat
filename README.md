# مفروشات العصار

متجر عربي RTL لمحل مفروشات في غزة (Next.js + Supabase + Vercel). التفاصيل في `CLAUDE.md`.

## التشغيل محلياً
```bash
cp .env.example .env.local   # املأ القيم
npm install && npm run dev
```

## قاعدة البيانات
الـ migrations في `supabase/migrations/` بالترتيب (0001 → 0004). السر `SERVER_RPC_SECRET` يُخزَّن في Vercel، وبصمته (sha256) فقط في `app_private.secrets`.
لتدويره: ولّد سراً جديداً، حدّث البصمة في الجدول، ثم حدّث متغير Vercel وأعد النشر.
