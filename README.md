# LUXE — متجر عطور فاخر

متجر إلكتروني للعطور الفاخرة للسوق المصري (EGP) — تجربة تسوق سينمائية بمعايير عالمية.

## الستاك

| الطبقة    | الأداة                                |
| --------- | ------------------------------------- |
| Framework | Next.js 16 App Router (Turbopack)     |
| Language  | TypeScript (strict)                   |
| Styling   | Tailwind CSS v4 + shadcn/ui           |
| Animation | Framer Motion + GSAP (dynamic import) |
| Forms     | React Hook Form + Zod                 |
| Auth      | Auth.js (next-auth v5)                |
| DB        | PostgreSQL + Prisma                   |
| State     | Zustand                               |
| Email     | Resend                                |

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## إعدادات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم (PostgreSQL إلزامي).

## البنية

```
src/
├─ app/           # التوجيه فقط
├─ features/      # كود الأعمال (components/actions/services/repositories/schemas/types)
├─ components/    # ui · motion · layout
├─ lib/           # prisma · utils
├─ hooks/
├─ stores/        # Zustand
└─ config/        # site config
```

## أوامر

| أمر                  | الوصف          |
| -------------------- | -------------- |
| `npm run dev`        | خادم التطوير   |
| `npm run build`      | بناء الإنتاج   |
| `npm run lint`       | فحص ESLint     |
| `npm run type-check` | فحص TypeScript |
| `npm run format`     | تنسيق Prettier |
