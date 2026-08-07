# CLAUDE.md — مرجع السياق المشترك

> هذا الملف يُقرأ تلقائيًا في بداية كل جلسة. أي قرار جديد يجب أن يُسجَّل هنا فورًا،
> وإلا ستعمل الجلسة التالية بسياق قديم.

---

## المشروع

متجر عطور فاخر باسم **ADDICTIONX** — «Feel the Rush» — للسوق المصري، Front + Back في مشروع واحد.
الجمهور المستهدف: **شباب** — لذلك الإبهار البصري هو الأولوية القصوى، لا الـ minimal الهادئ.

الهدف: تجربة **سينمائية مبهرة** تُشعِر المستخدم أنه يتعامل مع علامة عطور فاخرة شبابية، لا marketplace.
المستوى المطلوب: **production-ready startup**، لا demo ولا حلول مؤقتة.

- المسار: `D:\E-Commrece`
- السوق: مصر · العملة: EGP
- الهوية: أسود عميق + نيون أحمر + فضي معدني (metallic) + خط القلب (Heartbeat) كتوقيع بصري
- التصميم: Cinematic · Neon · Premium · غني بالحركة

---

## أسلوب العمل مع walid

- الشرح **بالعربية الفصحى المبسطة**، مع الإبقاء على المصطلحات التقنية بالإنجليزية.
- **خطوة بخطوة. ملف واحد في كل مرة.** انتظر تأكيده قبل الانتقال للملف التالي.
- **لا تُعطِ الحل مباشرة إلا إذا طلب.** اشرح سبب كل سطر.
- عند وجود أكثر من طريقة: ابدأ بالأسهل، ثم اذكر البدائل.
- عند وجود خطأ: حدّد مكانه → اشرح سببه → اكتب التصحيح موضحًا الفرق.
- تعامل معه كمُتدرِّب يريد فهم البرمجة بعمق، لا نسخ الحلول.

**السبب:** يريد أن يفهم المشروع بعمق يكفي لإعادة هيكلته بنفسه، لا مجرد تشغيله.

---

## الستاك المُثبَّت

| الطبقة          | الأداة                                                      |
| --------------- | ----------------------------------------------------------- |
| Framework       | Next.js 16 App Router (Turbopack default)                   |
| Language        | TypeScript (strict)                                         |
| Styling         | Tailwind CSS v4 + shadcn/ui (Base UI)                       |
| Animation       | Framer Motion (framer-motion) + GSAP (dynamic import فقط)   |
| Icons           | Lucide React                                                |
| Forms           | React Hook Form + Zod                                       |
| Auth            | Auth.js v5 (beta) — Credentials + PrismaAdapter + جلسات JWT |
| DB              | PostgreSQL (local `luxury_perfume`) + Prisma                |
| Password        | bcryptjs (CJS)                                              |
| State           | Zustand                                                     |
| Images          | Cloudinary                                                  |
| Email           | Resend                                                      |
| Package Manager | npm (registry: npmmirror)                                   |
| Quality         | ESLint (flat config) · Prettier · Husky                     |
| Deploy          | Vercel                                                      |

---

## القرارات المعمارية وأسبابها

### 1. Next.js fullstack بطبقات صريحة — لا Express منفصل

كانت الخطة السابقة API منفصل بـ Express. **أُلغيت**، والسبب تقني لا تفضيلي:

- الـ Server Actions تتحول إلى مجرد **proxy** يُنادي HTTP — طبقة زائدة بلا مقابل.
- الـ Server Components تفقد أقوى ميزة فيها: القراءة من الـ DB مباشرة بدون round-trip.
- Auth.js مُصمَّم ليعيش داخل Next — مع API منفصل تدير الـ session في مكانين أو تكتب JWT handoff يدويًا.
- Vercel وحدها لا تكفي — تحتاج host ثانيًا للـ API: تكلفة أكبر، ops أكثر، ونقطة فشل زائدة.

**الهدف التعليمي الأصلي من Express** (فهم فصل الطبقات بيديك) تحقَّق بالطبقات الصريحة داخل Next:

```
Server Action  →  Service  →  Repository  →  Prisma
```

**القاعدة الحاكمة:** الـ Server Action **لا تلمس Prisma أبدًا**. تُنادي service،
والـ service تُنادي repository، والـ repository وحده يعرف Prisma.

> استثناء مستقبلي: عند الحاجة لـ background jobs أو payment webhooks، تُناقَش خدمة منفصلة وقتها.

### 2. Framer Motion أساسًا · GSAP بـ dynamic import فقط

البريف طلب Motion أساسًا وGSAP "فقط إن لزم"، لكن مشاهد الـ hero والـ gallery
scroll-driven وتحتاج ScrollTrigger. تحميل المكتبتين في الـ initial bundle **يضرب هدف 90+ Lighthouse**.

- Framer Motion (`framer-motion` package) → كل شيء: page transitions · hover · stagger · layout.
  مكوّنات الحركة دائمًا Client Components (`"use client"`) تُستدعى من صفحات Server Components.
- GSAP ScrollTrigger → داخل مشاهد الـ scroll السينمائية فقط، عبر `dynamic()` مع `ssr: false`.
- **احترم `prefers-reduced-motion` دائمًا.** الأداء أولًا.

### 3. الأموال تُخزَّن كأعداد صحيحة (قروش)

لا `Float` ولا `Double` للأسعار أبدًا — الـ floating point يُنتج أخطاء تقريب في الحسابات المالية.
كل المبالغ `Int` بوحدة **القرش** (100 قرش = 1 جنيه)، والتحويل للعرض في طبقة الـ UI فقط.

### 4. سير عمل الصور

لا توجد أداة توليد صور في هذه الجلسة. التقسيم: **أنا أكتب الـ prompts وأعالج الصور،
وwalid يُولِّدها في GPT**، ثم تُرفع على Cloudinary.

### 5. قاعدة الأصالة

المراجع (`21st.dev` · `motionsites.ai` · أي design reference) **إلهام فقط**:
تُدرَس أنماط التفاعل ولغة الحركة وتجربة المستخدم. **لا نسخ** لتصميم أو كود أو branding.

### 6. الترجمه (i18n) — AR/EN عبر `[lang]` segment

- المسار يأخذ الشكل `/ar/...` و `/en/...` (dynamic segment `[lang]`) — صديق لـ SEO.
- ملف `proxy.ts` (بديل middleware في Next 16) يحوّل `/` → اللغة الافتراضية (`ar`).
- القواميس في `src/lib/i18n/dictionary.ts` (نوع `Dictionary` مشتق من `as const`).
- `dir` و `lang` يُحدَّدان من الـ segment في الـ layout — `ar` = rtl، `en` = ltr.
- اللغة الافتراضية: العربية.

### 7. الثيم — دارك افتراضي مع تبديل

- دارك هو الافتراضي (class `dark` على `<html>`)، مع زر تبديل ليل/نهار.
- `ThemeProvider` في `src/components/theme/theme-provider.tsx` يخزّن التفضيل في `localStorage`.
- الألوان كلها متغيرات CSS (`--background`, `--primary`, ...) — دارك في `:root,.dark` و فاتح في `:root[data-theme="light"]`.

### 8. الإبهار البصري — أولوية قصوى (Hero)

الجمهور شباب، فالمشاهد الافتتاحية غنية بالحركة، بمكونات في `src/components/motion/`:

- `AnimatedTitle` — حروف بتدخل واحد ورا التاني بـ `blur + rotateX + y`، وعنوان `text-metallic-shine` بيلمع بشكل متحرك.
- `AuroraBackground` — أورورا متحركة (توهج أحمر + كرات أرجوانية/حمراء بتتحرك + ضباب سفلي).
- `ParticleField` — جسيمات متوهجة بتطير للأعلى بنبض.
- `HeartbeatLine` — خط القلب كتوقيع بصري بيتكرر.
- دائمًا `prefers-reduced-motion` محترم وكل شيء بأداء عالي (transform/opacity فقط).

### 9. Auth.js v5 فعلية مع DB

- `next-auth@^5.0.0-beta.29` + `@auth/prisma-adapter` + Credentials provider + **جلسات JWT** (لا database sessions).
- التركيب: `src/lib/auth.ts` (authOptions) · route handler `/api/auth/[...nextauth]/route.ts` · `src/types/next-auth.d.ts` (يثري `Session.user.id` و `role`).
- كلمة المرور: **`bcryptjs`** (يعمل CJS بنجاح مع `next build` — خلافًا لـ `bcrypt` الأصلي الذي كسر البناء).
- التسجيل عبر **Server Action** (`registerAction` في `src/features/auth/actions.ts`) — لا REST endpoint. واجهات login/register تكلم `signIn("credentials")` مع تمرير `callbackUrl`.
- `AUTH_SECRET` + `AUTH_TRUST_HOST=true` في `.env` (ضروري لبيئة dev المحلية).

### 10. الأدوار (Roles) والحماية

- `User.role`: `CUSTOMER` | `ADMIN`. تسلسل الوصول:
  - غير مسجّل → `redirect` إلى `/{lang}/login?callbackUrl=...`
  - عميل → `redirect` إلى `/{lang}/account` (لا يرى admin)
  - أدمن → يفتح اللوحة كاملة.
- **حماية مزدوجة:** `<admin>/layout.tsx` (redirect قبل أي render) + `requireAdmin()` داخل كل Server Action (لا يُعتمد على الـ UI وحده).

### 11. لوحة التحكم (admin)

- المسارات: `/{lang}/admin` (نظرة عامة: إحصائيات + أحدث الطلبات + مخزون منخفض) · `products` + `products/new` + `products/[id]` (CRUD) · `orders` + `orders/[id]` (فلاتر حالة + تفاصيل + تغيير حالة + إدارة الشحنة) · `users` (إضافة/حذف مستخدم + تغيير دور) · `coupons` (إنشاء/تفعيل/حذف كوبونات) · `settings` (إعدادات الشحن).
- كل منطق الـ admin في `src/features/admin/` (actions · status · mappers) و `src/components/admin/` (product-form · product-actions · order-status-select · user-role-select · admin-nav · add-user-form · delete-user-button · shipment-form · coupon-form · coupon-actions · shipping-settings-form).
- نموذج المنتج (create/edit) نموذج واحد موحّد يحوي حقولًا ثنائية اللغة (ar/en) + notes + ألوان art + variants ديناميكية + **نسبة خصم** (`discountPercent` 0–90) تُحسب منها `compareAtPrice` تلقائيًا (`round(base / (1 - pct/100))` حيث base = أقل سعر variant). الـ **Sale** = وجود `compareAtPrice` — فلتر "على العرض" في قائمة المنتجات + شارة في بطاقات الستورفرنت + صفحة المنتج.
- `user-role-select` يمنع المستخدم من تغيير دوره هو.
- إضافة مستخدم: `createUser` (الاسم/البريد/كلمة المرور/الدور — البريد يُطبَّع lowercase عبر zod). حذف مستخدم: `deleteUser` (لا يحذف نفسه · طلباته تُفصل `userId→null` في معاملة مع الحذف).
- الشحن: `updateOrderStatus` عند SHIPPED يُنشئ/يحدّث `Shipment` (carrier افتراضي Bosta + shippedAt)، وعند DELIVERED يُحدّث deliveredAt، وعند CANCELLED/REFUNDED يحذف الشحنة. `updateShipment` لتعديل carrier/tracking يدويًا. الـ `shipment-form` في تفاصيل الطلب.
- **الكوبونات:** `Coupon` model (`code` فريد · `discountType` PERCENT|FIXED · `discountValue` — النسبة % تُخزَّن كما هي والمبلغ الثابت بالقروش ×100 · `minOrderAmount`/`maxDiscount` بالقروش (nullable مع `@default(0)`) · `maxUses`/`expiresAt`/`startsAt` nullable · `usedCount`). `createCoupon` (يرفض تكرار الكود) · `toggleCoupon` · `deleteCoupon`. التحقق الفعلي في `createOrder` (الخادم مصدر الحقيقة) + `validateCoupon` للتحقق الفوري في الواجهة. **خطر TypeScript:** `minOrderAmount` في الـ schema `Int?` — أي مقارنة معه تحتاج `?? 0`.
- **إعدادات الشحن:** `StoreSetting` model (key/value — `shipping_fee_qirsh` · `free_shipping_threshold_qirsh` · `default_carrier`). `updateShippingSettings` (upsert + `clearConfigCache` + revalidate). `getShippingConfig()` في `src/lib/store-config.ts` (قراءة DB بذاكرة 5 ثوانٍ + fallback للافتراضيات 5000/150000/Bosta) + route عام `GET /api/shipping-config` (no-store) يقرؤه الـ checkout-form و cart-drawer. الشحن مجاني إذا `subtotal - discount >= threshold`. الثوابت في `src/lib/checkout-config.ts` أصبحت fallback فقط — لا تعديل عليها.

### 11b. داشبورد العميل (account)

- صفحة `/{lang}/account` تبويبات: **نظرة عامة / طلباتي / عناويني / مفضلتي** (مكوّن client `account-tabs` يستقبل بيانات serializable).
- تفاصيل طلب العميل: `/{lang}/account/orders/[id]` للقراءة فقط — عناصر الطلب + عنوان التوصيل + **تتبع الشحنة** (carrier/tracking/status من `Shipment`).
- المفضلة: `WishlistItem` model (فعل) + `toggleWishlist` (server action، upsert/delete حسب الحالة) + زر `WishlistButton` في بطاقة المنتج وصفحة المنتج + `getWishlistIds` (React cache) لجلب ids المستخدم في الستورفرنت. غير المسجّل لا يرى الأزرار.
- **خطأ Node لا Browser:** `toLocaleDateString` لا يقبل `timeStyle` (الباوزرات تتسامح، Node يرمي `Invalid option: timeStyle`) — استخدم `toLocaleString` للتاريخ+الوقت.

### 8b. الإبهار البصري — الموجة الثانية (ميلستون الأنيميشن)

طلَب walid: **العميل يجب أن يَنبهر بصريًا** — كل شاشة ستورفرنت عليها توقيع حركي. **المنفَّذ (wave 1):**

- `src/components/motion/reveal.tsx` — نظام الظهور عند التمرير: `Reveal` (عنصر واحد) + `RevealStagger`/`RevealItem` (شبكات متتالية)، `whileInView` مرة واحدة + احترام `prefers-reduced-motion`. استُخدم في الرئيسية (بست سيلرز/المجموعات/المزايا) و catalog (بطاقات/فلتر) وصفحة المنتج.
- `src/components/motion/marquee.tsx` — شريط كلمات متحرك (3 نسخ + `@keyframes marquee-x` translateX(–33.33%)، يتوقف عند الـ hover) يُركَّب مباشرة بعد الـ hero في الرئيسية (كلمات من `dict.home.ticker`).
- `src/components/motion/fly-to-cart.tsx` — **طيران المنتج للسلة:** `flyToCart(rect)` يطلق `CustomEvent("addictionx:fly-to-cart")`، و`<CartFlyProvider/>` (مثبّت في `[lang]/layout.tsx`) يطيّر جرعة ضوء من الزر إلى `[data-cart-target]` (أيقونة السلة في `cart-button`) ويبعث `addictionx:cart-bump` لنبضة الأيقونة. `AddToCartButton` يطلقه من `getBoundingClientRect` + `whileTap` + نبضة نجاح.
- بطاقة المنتج: hover سينمائي — توهج نيون (`mix-blend-screen`) + شريط ضوء ماسح (`skew + translateX` 700ms) + حلقة مضيئة (`shadow red`) — كلها transform/opacity على CSS.
- `SectionHeading` الآن `Reveal` + عنوان `text-metallic-shine` + خط heartbeat تحته (توقيع العلامة).
- الأزرار الرئيسية: CTA الختامي بنبض `heartbeat-pulse`؛ زر الـ hero الأساسي بـ shadow نيون.
- **منجز (wave 2):** `PageTransition` (يلف `{children}` في اللayout — دخول ناعم مع كل تنقّل عبر الـ pathname كـ key) · `CursorGlow` (توهج نيون بذاكرة spring يتبع المؤشر — Desktop + `pointer:fine` فقط، يُفعَّل من أول حركة ماوس لتجنّب setState متزامن في effect) · `CountUp` + `StatsBand` (عدّادات أرقام حقيقية من DB — عدد المنتجات/إجمالي التقييمات/أعلى تقييم — تعدّ عند الظهور) · نبضة wishlist (انفجار قلب + دوران عند التفعيل).

**القاعدة الحاكمة (ثابتة):** Framer Motion فقط (client components) · transform/opacity فقط للأداء · `prefers-reduced-motion` إجباري · كل حركة ≤ ~800ms · لا حركة بلا غرض (كل حركة تحكي "فخامة/حماس/دفعة"). لا touch لواجهات الأدمن إلا ما يفيد.

- **ملاحظة حركية:** `dict.*` من النوع `as const` — أي مكوّن يقبل مصفوفة من القاموس اجعل البروب `readonly string[]`.

### 12. قاعدة Next 16 / حدود Server↔Client (أخطاء حقيقية وقعت)

- `params` و `searchParams` **async** إجباريًا (يجب `await params`).
- `proxy.ts` بديل الـ middleware (Next 16).
- مكوّن Server يستورد `motion` يخرّب الـ SSR — الحل `"use client"` أو CSS hover بدله.
- **`Functions cannot be passed directly to Client Components`** — لا يجوز تمرير دوال/كلاسات (مثل icons lucide) من Server Component إلى Client Component. وقعت فعلًا في `admin/layout.tsx` (مصفوفة nav تحوي icons). **الحل:** تُعرَّف الأيقونات/البنية داخل الـ client component نفسه، ويُمرَّر بيانات سيرياليزابل فقط (نصوص/مسارات).
- Base UI Button للـ polymorphism يستخدم `render={<Link/>}` — لا `asChild`.

### 13. القراءة من DB والبذور

- الستورفرنت يقرأ من DB عبر `src/features/catalog/data/products-db.ts` (بنفس واجهة `Product` الـ mock — الـ mock يبقى مرجع الشكل فقط). الصفحات القارئة `force-dynamic`.
- البذور: `prisma/seed.ts` + `npm run db:seed` (عبر `tsx` devDep) → أدمن + 8 منتجات + 3 مجموعات + variant 100ml لكل منتج.
- الأسعار في DB `Int` بالقروش — التحويل من جنيه: `egpToQirsh` (×100) في `admin/actions.ts`، والعرض عبر `formatPrice()` في `products.ts`.
- `gender` في DB: `MALE/FEMALE/UNISEX` — الستورفرنت يحوّلها lowercase.

### 14. تقييمات المنتجات (Customer Reviews)

- **السياسة:** تقييم واحد لكل منتج/مستخدم — `Review` upsert على المفتاح المركّب `productId_userId`. التقييم يُنشر (isApproved) فقط بعد موافقة الأدمن، وتعديل العميل لِتقييمه المعتمد يُعيده pending.
- **المنطق:** `src/features/reviews/actions.ts` — `createReview` (upsert + zod؛ العنوان اختياري ≤80، المحتوى 3–1000) · `moderateReview` (موافقة/رفض) · `deleteReview`. كل تغيير معتمد يستدعي `recomputeProductStats` (يُعاد حساب `rating` = round(avg×10)/10 و `reviewsCount` من التقييمات المعتمدة **الفعلية** — البذور كانت أرقامًا تسويقية وهمية فتنهار عند أول موافقة، وهذا مقصود).
- **الواجهات:** `star-input.tsx` (StarInput تفاعلي + StarDisplay للعرض) · `review-form.tsx` (نموذج العميل — كتابة/تعديل + حالة نجاح/خطأ) · `review-actions.tsx` (أزرار أدمن: موافقة/رفض/حذف).
- **التضمين:** صفحة المنتج `product/[slug]` — قائمة المعتمدين (مع user.name) + `rating.toFixed(1)` + نموذج العميل إن كان مسجّلًا (مع `existing` لتعديل تقييمه) أو رابط تسجيل دخول مع callbackUrl · لوحة `admin/reviews` (كل التقييمات مع منتج/مستخدم/شارة pending + ReviewActions).
- **مفاتيح القاموس:** `dict.reviews.*` (title/summary/noReviews/loginPrompt/writeTitle/editTitle/titlePlaceholder/contentPlaceholder/submit/update/success/reviewError/by/pendingBadge/reviewOn) + `dict.admin.reviews/approve/reject`.

### 15. إدارة المجموعات (Collections) من الداشبورد

- **النموذج:** `Collection` model جديد (migration `collections`): `slug` فريد + `nameAr/nameEn` + `sortOrder` + `isActive`. **لا FK بينها وبين Product** — `Product.collection` يبقى slug نصيًا (قرار تعمّدي حتى لا تنكسر كل الأماكن التي تقرأ الـ slug).
- **إصلاح البذرة:** كانت تستخدم `prisma.category` لِلمجموعات — **حُوّلت إلى `prisma.collection`**.
- **القراءة:** `getCollections()` في `products-db.ts` (DB، fallback إلى المصفوفة الثابتة `collections` في `products.ts` إذا كانت القاعدة فارغة — يجب `map` لأن الثابت `readonly`). المستخدمون: footer · home · catalog (فلاتر) · نموذج المنتج (select يعرض `slug — name`).
- **الإدارة:** `src/features/admin/collections-actions.ts` — `createCollection` (رفض تكرار slug عبر zod regex) · `deleteCollection` (يمنع الحذف إن كان بها منتجات — `NOT_EMPTY`). الصفحة `admin/collections` تعرض كل مجموعة مع **عدد عطورها وأسمائها** (تُجمع بالـ slug عبر Map). نموذج `collection-form.tsx` (slug يُشتق تلقائيًا من الاسم الإنجليزي) + زر `collection-delete.tsx`.
- **مفاتيح القاموس:** `dict.admin.collections/addCollection/collectionNameAr/collectionNameEn/collectionSlug/collectionCreated/collectionCreateError/collectionDeleteError/collectionEmpty/collectionProducts/noCollections`.

### 15b. السوشيال — الروابط الحقيقية (بلا فيسبوك)

- `siteConfig.social` في `src/config/site.ts`: **Instagram `https://www.instagram.com/addictionn_x`** و **TikTok `https://www.tiktok.com/@addiction_x8`** — **حُذف facebook نهائيًا**. الفوتر يعرض Instagram + TikTok فقط.

### 16. هرم النوتات في صفحة المنتج

- قسم المكونات في `product/[slug]` أصبح **شكل هرم**: القاعدة (الأوسع) أسفل، فالقلب، فالمقدمة (الأضيق) أعلى — بطل ضوئي بدل الأعمدة المتساوية. اسم المجموعة يُقرأ من `getCollections()` ديناميكيًا (لا hardcode rush/noir/gold).

### 17. العناوين — CRUD كامل من حساب العميل

- `Address` model موجود أصلًا؛ أُضيف `createAddress`/`updateAddress`/`deleteAddress` في `features/account/actions.ts` (zod + ملكية عبر `userId` — `updateMany/deleteMany` بشرط `userId` حتى لا تُعدِّل عناوين الغير، و`isDefault` يُقلَع من البقية في نفس المعاملة).
- UI: `account/components/address-manager.tsx` (قائمة + إضافة/تعديل/حذف/شارة افتراضي) + `address-form.tsx` (نفس حقول الـ checkout + district/building/apartment/landmark الاختيارية، empty→`null`). يبدأ من تبويب "عناويني" في `account-tabs`.
- مفاتيح `dict.account.*` (addAddress/addressSave/addressEdit/addressDelete/noAddresses/defaultAddress/setAsDefault/addressSaved/addressError/field*). تحقق حي: إنشاء → عرض → حذف.

### 17b. إلغاء الطلب (العميل)

- `cancelOrder` في `features/account/actions.ts`: **فقط لصاحب الطلب وفقط PENDING** — غير ذلك `NOT_CANCELLABLE`. معاملة تعكس `createOrder`: status→CANCELLED + حذف الشحنة + `stock: increment(quantity)` لكل `OrderItem.variantId`.
- **لمسة في admin:** `updateOrderStatus` عند CANCELLED/REFUNDED **أعاد إرجاع المخزون** (كان مفقودًا — كان الأدمن يلغي طلبًا ويضيع المخزون).
- زر `cancel-order-button.tsx` يظهر في تفاصيل الطلب (account/orders/[id]) عند PENDING فقط. مفاتيح: cancelOrder/cancelConfirm/orderCancelled/cancelError/cancelUnavailable. تحقق حي: طلب PENDING → إلغاء → CANCELLED + المخزون رجع (8→10).

### 17c. النشرة البريدية (Newsletter)

- `NewsletterEntry` model موجود؛ أُضيف `features/newsletter/actions.ts`: `subscribeNewsletter` (zod email + upsert lowercase — يُعاد تفعيله إن كان مغلقًا، بلا تسجيل دخول) + `toggleNewsletterEntry`/`deleteNewsletterEntry` (محمية بـ requireAdmin).
- الستورفرنت: **سكشن مستقل فوق الفوتر** (`layout/newsletter-section.tsx` — مش داخل الفوتر، حتى لا يقطع أعمدة الفوتر) — عنوان + نموذج inline في `layout/newsletter-form.tsx` — `dict.newsletter.*` AR/EN.
- الأدمن: `admin/newsletter` (جدول email/date/status + تفعيل/إيقاف/حذف) + إدخال nav. مفاتيح: `dict.admin.newsletter/newsletterEmpty/newsletterActive/newsletterInactive`.

### 18. الـ hero السينمائي — فيديو تفاعلي يُسحَب بالماوس

- **قرار مثبّت:** الـ hero يبقى **أسود دائمًا** (`bg-[#0a0a0a]`) مستقلًا عن الثيم — الفيديو void لا يمكنه التكيّف مع خلفية فاتحة، والتغيير للأسود بعدها مقصود ودرامي. باقي الصفحة تتبع الثيم.
- **الأصول:** `public/left.mp4` (أمام→شمال) و `public/right.mp4` (أمام→يمين) — **يبدآن بنفس الإطار الأمامي حرفيًا، بلا أي مزامنة**.
- **المبدأ:** الفيديو لا يُشغَّل على الديسكتوب — **تقنية الـ sprite filmstrip** (مثل مواقع العطور الفاخرة): استخرجنا كل كادرات الفيديو مرة واحدة إلى صورة شبكة `public/sprites/left.jpg` و `right.jpg` (6400×2160 = 10 أعمدة × 6 صفوف = 60 خلية × 640×360)، والحركة صارت لمجرد `background-position` على لوحين (`background-size: 1000% 600%`) داخل `raf` — **صفر seek وصف الاستجابة فورية** (كان `video.currentTime` seek غير متزامن فيُظهر "بطء غير طبيعي").
- **ترجمة المؤشر:** كل عرض الشاشة مجال دوران — `x < vw/2` → left-sprite، `x > vw/2` → right-sprite، **بلا deadZone** (كانت المنطقة الوسطى لا تستجيب وتُشعر بالبطء). حركة تقدمية `clamp01` → إطار `round(clamp01 × (FRAMES-1))`. العكس يعمل تلقائيًا: رجوع المؤشر للوسط يعيد الإطار الأمامي.
- **فجوة فارغة آخر الشريط:** الفيديوان فعليًا **59 إطارًا فقط (0..58)** — الخلية 59 في الشبكة فارغة (سوداء). لذلك `FRAMES = 59` وكل الـ clamp/البوب مقيدة به — عند آخر الفيديو تَقِف على آخر كادر حقيقي **بلا قلب للشاشة أسود**.
- **الترابط عند تبديل الجانبين:** اللوح الأيمن `transform: translateX(-5px)` لضبط فرق بسيط بين كادرات left/right فيُطابقان بعضهما — عند التبديل لا يقفز المحتوى.
- **الموبايل** (`pointer: coarse` أو < 1024px): تشغيل تلقائي متبادل left/right عبر `ended` (muted+playsInline إجباريان) — **بلا تلميح** (walid قرر: التفاعل يُكتشف تلقائيًا، لا تلميح ولا نفرة).
- **اكتشاف تلقائي:** يستمع `window pointermove` — أول حركة تفعّل الـ scrubbing بعد 300ms، ويظل `ع ─ y / لليسار` rAF مستمر. **البوب التلقائي GSAP** بعد ~2.2s خمول: `frame 0 → FRAMES-1 → 0` تناوبًا بين الجانبين (`power1.inOut`، تحديث مستمر عبر onUpdate) — **أي حركة مؤشر تلغيه فورًا** وتُعيد الرسم اليدوي. gsap في `dependencies` (استيراد إنتاجي).
- **خروج ناعم:** scroll fade من 25% إلى 90% من ارتفاع الشاشة — `opacity` + `visibility:hidden` نهائيًا فوق 90%.
- **الموبايل:** فيديو الموبايل الذي يبدأ بـ اطارد مرئي — بالتناوب automatic. `prefers-reduced-motion`: حالة ثابتة بلا rAF بلا gsap — فقط الإطار الأمامي.
- **هيكل المكوّن** (`src/components/motion/hero-video-scrub.tsx`): `"use client"` — refs للوحين/الفيديوهين + `raf` دايم + عدادات `lastMoveRef` للـ idle. الصور تُحمَّل وتُفك ترميزها (`img.decode()`) قبل الكشف بـ `ready` state (fade-in 0.8s حتى لا يومش إطار الخلفية). اللوحان `aria-hidden` + `pointer-events-none` دائرةً في المشهد الأصفر 26: عود السكرايب (bottom→top): 0 sprite لوحان · 5 تدرج أسود · 8 ParticleField · 20 نصوص · 30 الهيدر · 90 CursorGlow.
- **الطبقات (bottom→top):** 0 حاوية الفيديو `fixed inset-0` (aria-hidden) · 5 تدرّج أسود للتباين بلا mix-blend · 8 `ParticleField` مخفّفة (count=10 + blend **screen** + opacityScale 0.3) · 20 النصوص/الأزرار · 30 الهيدر · 90 `CursorGlow`.
- **لا mix-blend:** النصوص فوق الفيديو والهيدر تُنقَى عبر ظل بطبقتين `drop-shadow(0 1px 2px rgb(0 0 0/0.6)) drop-shadow(0 4px 24px rgb(0 0 0/0.45))` — **ممنوع `mix-blend-mode: exclusion`** لأنه يقلب الأحمر (oklch(0.6 0.22 22)) إلى سماوي فينكسر الهوية.
- **`PageTransition` أصبح opacity-only** (لا y/transform/filter/will-change إلا opacity) — لأي transform على عنصر أب يُنشئ containing block يجعل `position:fixed` داخله يتكامل مع التمرير بدل الثبات. هو إصلاح عام يمس كل الصفحات — entropy low.
- **الـ hero-video-scrub تسلسلي:** يستمع للماوس بعد ~1000ms (دخول العنوان) لتفادي تنافس `blur(14px)` للعنوان مع seek كل frame على الـ GPU. يتوقف تمامًا عند scrollY > viewport (visibility hidden) وعند `document.hidden`، ويعود بعدهما. `prefers-reduced-motion`: إطار ثابت بلا أي RAF.
- **الموبايل** (`pointer: coarse` أو < 1024px): تشغيل تلقائي متبادل left/right عبر `ended` (muted+playsInline إجباريان) + تلميح "دوران تلقائي" بلا توهم التحكم.
- **الهيدر:** شفاف فوق الـ hero بفئة `header-over-hero` يضيفها `HeaderScroll` (الصفحة الرئيسية فقط وأول 80% من الشاشة) — بلا border/blur، ونصوص بيضاء + drop-shadow. بعد التمرير أو على أي صفحة أخرى يواصل خلفيته الضبابية كالمعتاد.
- **`CursorGlow`:** يخفت إلى 0.25 داخل الـ hero عبر `--cursor-glow-opacity` (ربطه `HeaderScroll` على `<html>`) حتى لا يتزاحم توهجان على نفس المؤشر.
- **`proxy.ts`**: أُضيف `mp4|webm|gif` إلى regex الاستاتيك — قبلها `/left.mp4` كان يُعيد 307 إلى `/ar/left.mp4`.
- **`gsap` نُقل إلى dependencies** (كان devDependencies) — أي استيراد له في الإنتاج سيفشل على Vercel لأن الـ devDeps لا تُثبَّت.
- **مفاتيح القاموس:** `dict.hero.autoRotate` (دوران تلقائي) + `dict.hero.dragToRotate` (حرّك الماوس).
- **الموجة النهائية (الـ hero المكتمل):**
  - **عكس الدوران:** يعمل طبيعيًا عبر `background-position` — رجوع المؤشر نحو الوسط = إطار أمامي (لا مكتبة منفصلة).
  - **خروج ناعم:** `fade visibility` عند 25%→90% من الشاشة أثناء التمرير.
  - **بوب تلقائي (GSAP):** بعد ~2.2s خمول يدور الإطار إلى آخر المقطع ثم **يعكس** للإطار الأمامي (تناوب بين الجانبين) — أي حركة مؤشر تلغيه فورًا وترسم يدويًا. gsap في `dependencies` (استيراد إنتاجي).
  - **لا pointer hint ولا تلميح** — التفاعل يُكتشف تلقائيًا من أول حركة ماوس (قرار walid النهائي).

### 18b. النشرة البريدية داخل الفوتر (قرار نهائي)

- **داخل كتلة الفوتر فوق كل الأعمدة** (فوق Instagram/TikTok إلخ) — `footer.tsx` يحوي border-b + title/subtitle + `NewsletterForm` قبل grid الأعمدة الأربعة. **حُذف `layout/newsletter-section.tsx`** و`[lang]/layout.tsx` لم يعد يستورده. (كانت سكشن مستقل فوق الفوتر — قرار walid: جوه الكتلة.)

### 18c2. كاروسيل المجموعات (product-carousel)

- `features/catalog/components/product-carousel.tsx` — مدفوع من `page.tsx` بمنتج واحد عن كل مجموعة (يفضّل `image`) ويُجبر `.image` محلية من `/slider/{rush,noir,gold}.png` (منتج المؤلف fallback).
- أدوار center/left/right (لا back مع 3 عناصر) · **CSS transitions** (استثناء مقصود من قاعدة Framer Motion لأداء الأدوار — موثّق) · 650ms · blur للأدوار الجانبية · swipe باللمس (يتجاهل السحب الرأسي) · كيبورد RTL-aware · IntersectionObserver يوقف الأنيميشن خارج الشاشة.
- **صيغة الصور:** 1024×1536 PNG شفافة — `public/slider/rush.png` · `noir.png` · `gold.png` (أُعيدت تسميتها من `1 (N).png`).
- مفاتيح القاموس: `dict.home.carousel*` (title/subtitle/explore/prev/next/item/of).

### 18d. توليد شرائح الـ sprite (filmstrip) — أدوات وإعادة التوليد

- **الأدوات:** `ffmpeg-static` (devDependency) — الـ exe في `node_modules/ffmpeg-static/ffmpeg.exe`. لا حاجة لأي تثبيت نظام.
- **الشرائط المولّدة:** `public/sprites/left.jpg` (0.38MB) و `right.jpg` (0.41MB) — 6400×2160، 10 أعمدة × 6 صفوف، كل خلية 640×360.
- **الفيديوهان المصدر:** `public/left.mp4` / `right.mp4` — 1280×720 · 24fps · **59 إطارًا فعليًا (0..58)** — لا تسقط إلى خلية 59 (فارغة) أبدًا.
- **أمر التوليد المرجعي (من الفيديو إلى الشبكة):**
  `ffmpeg -i right.mp4 -vf "fps=24,scale=640:360,tile=10x6" sprites/right.jpg`
  (عند إعادة توليد الفيديوهات أعد هذا الأمر للجانبين.)

### 19. إشعارات الإيميل (Resend) — لكل تحديث

- `src/lib/email.ts`: wrapper `sendEmail` (Resend) ← يعمل **بدون مفاتيح** (يسجّل فقط، لا يعطّل العملية). القوالب inline-styled: `orderConfirmationEmail` (لعميل) + `adminNewOrderEmail` (للأدمن `ADMIN_EMAIL`/`siteConfig.adminEmail`) + `orderStatusEmail` (تغيير الحالة) + `orderCancelledEmail` + `shippingInfoEmail`.
- **نقاط الدمج:** `createOrder` (بعد نجاح المعاملة — بريد تأكيد للعميل + بريد جديد للأدمن) · `updateOrderStatus` (إشعار العميل بتغيير الحالة) · `updateShipment` (بيانات التتبع) · `cancelOrder` (إشعار الإلغاء للعميل).
- **القاعدة:** الإرسال عبر `Promise.allSettled` — فشل البريد **لا يُفشل أبدًا** إنشاء/تحديث الطلب.
- `.env` المطلوبة: `RESEND_API_KEY` (محتاج walid؛ بدونه تسجّل فقط ولا تُرسل) + اختياري `EMAIL_FROM`/`ADMIN_EMAIL`.

### 20. تسجيل الدخول بحساب Google (OAuth)

- `google` provider أُضيف في `src/lib/auth.ts` (بجانب Credentials) مع `allowDangerousEmailAccountLinking: true` (ضمان ربط حساب Google ببريد موجود في DB إن تطابق الإيميل). PrismaAdapter يخزّن الحساب/الجلسة.
- UI: زر «متابعة بحساب Google» في `auth-form.tsx` تحت فاصل «أو» — `signIn("google", { callbackUrl })`. مفاتيح: `dict.account.continueWithGoogle/or/googleError` + أيقونة SVG رسمها يدويًا (لا مكتبة).
- `.env`: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — **محتاج من walid** (Google Cloud Console → OAuth Client). بدونها الزر يظهر لكن الدخول يرفض.

### 21. طلب يدوي من الأدمن + تنبيه المخزون المنخفض

- **`createManualOrder`** في `src/features/admin/actions.ts`: للطلبات الهاتفية/الواتساب (COD) — الأسعار من الـ DB حصرًا (عزل createOrder) · خصم مخزون ذرّي داخل معاملة · شحن مجاني فوق الحد مثل الستورفرنت · **بلا Account للضيف**: `Address.userId` إجباري في Prisma فلا يُنشأ عنوان — يُخزَّن اسم/هاتف/محافظة/العنوان في `Order.notes` (تُعرض في تفاصيل الطلب admin+account) · إشعار أدمن بقالب الطلب الجديد.
- صفحة `/[lang]/admin/orders/new` + فورم client `manual-order-form.tsx` (منتجات+variant+سعر+مخزون، بنود ديناميكية، إجمالي حي، توجيه للتفاصيل) + زر «طلب يدوي جديد» في رأس الطلبات.
- **`notifyLowStock(variantIds, threshold=5)`** في `src/lib/email.ts` — dynamic import لـ prisma؛ يفحص أي variant وصل `stock<=5` ويرسل بريدًا للأدمن `lowStockEmail`. يُستدعى بعد `createOrder` وبعد `createManualOrder` ضمن `Promise.allSettled`.
- مفاتيح القاموس: `dict.admin.newOrder/createOrder/selectProduct/selectSize/addLine/orderLines/orderCreated/orderCreateError/emptyLines/orderTotal` AR/EN.

---

## هيكل المشروع (Feature-Based)

```
src/
├─ app/                      # التوجيه فقط — لا business logic
│  ├─ [lang]/                # dynamic segment للترجمة (/ar ، /en)
│  │  ├─ layout.tsx          # الجذر الفعلي: fonts · ThemeProvider · dir/lang · meta
│  │  ├─ page.tsx            # الرئيسية (Hero + أقسام)
│  │  ├─ catalog/            # الكتالوج + فلترة
│  │  ├─ product/[slug]/     # صفحة المنتج
│  │  ├─ checkout/           # إتمام الطلب
│  │  ├─ login/ · register/  # Auth واجهات
│  │  ├─ account/            # داشبورد العميل: تبويبات (طلبات/عناوين/مفضلة) + account/orders/[id] (تفاصيل + تتبع)
│  │  └─ admin/              # لوحة التحكم (layout محمي + dashboard + products/products/new/products/[id] + orders/orders/[id] + reviews + collections + coupons + users + settings)
│  ├─ api/auth/[...nextauth]/ # route handler الخاص بـ Auth.js
│  └─ globals.css
│
├─ features/                 # ← معظم الكود يعيش هنا
│  ├─ catalog/               # products (data: mock المرجع + db: getProducts/getProductBySlug/getCollections) · product-card · product-art · add-to-cart
│  ├─ cart/                  # cart-button · cart-drawer (يقرأ إعدادات الشحن من /api/shipping-config)
│  ├─ checkout/              # checkout-form (كوبون + ملخص ديناميكي) · actions (createOrder + validateCoupon)
│  ├─ account/               # actions (toggleWishlist/removeWishlistItem + createAddress/updateAddress/deleteAddress + cancelOrder) · data (getWishlistIds) · components (account-tabs · address-manager · address-form · cancel-order-button)
│  ├─ auth/                  # actions (register) · components (auth-form)
│  ├─ reviews/               # actions (createReview/moderateReview/deleteReview + recomputeProductStats) · components (star-input+StarDisplay · review-form)
│  ├─ newsletter/            # actions (subscribeNewsletter public + toggle/delete محمية)
│  └─ admin/                 # actions (CRUD/حالات/أدوار/مستخدمون/شحن/كوبونات/إعدادات) · collections-actions (createCollection/deleteCollection) · status · mappers
│
├─ components/
│  ├─ ui/                    # shadcn primitives
│  ├─ motion/                # animated-title · aurora-background · particle-field · heartbeat-line · fade-in · reveal (Reveal/Stagger) · marquee · fly-to-cart · page-transition (opacity-only!) · cursor-glow · count-up · stats-band · hero-video-scrub
│  ├─ theme/                 # ThemeProvider · ThemeToggle
│  ├─ layout/                # header (+ header-scroll لحالة الـ hero الشفاف) · footer (مجموعات من DB + روابط Insta/TikTok فقط) · newsletter-section (فوق الفوتر) · newsletter-form · section-heading · language-switcher
│  ├─ wishlist-button.tsx    # زر المفضلة (client) — بطاقات المنتجات + صفحة المنتج
│  └─ admin/                 # product-form · product-actions · order-status-select · user-role-select · admin-nav · add-user-form · delete-user-button · shipment-form · coupon-form · coupon-actions · shipping-settings-form · review-actions · collection-form · collection-delete · newsletter-actions
│
├─ lib/                      # prisma · auth · i18n · utils
├─ stores/                   # cart-store (Zustand + persist)
└─ config/                   # site.ts
```

**القواعد:**

- `app/` للتوجيه فقط. لا منطق أعمال داخل ملفات الصفحات.
- الـ features لا تستورد من `repositories` الخاصة بـ features أخرى — التواصل عبر `services`.
- **Server Components افتراضيًا.** `"use client"` عند الحاجة الفعلية فقط (state · event · browser API).
- كل مكوّن متحرك (motion) هو Client Component يُستدعى من Server Components.
- لا `any`. لا كود مُكرَّر. مكونات صغيرة. أسماء واضحة.

---

## خارطة الطريق الحالية (جلسة 2026-08-07 — قرارات walid)

### الأولوية العاجلة (قبل أي شغل آخر)

1. **رفع المشروع على GitHub** (قرار walid: «قبلها عايز أرفع البروجكت على GitHub»).
   - حاليًا: repo محلي فقط، commit وحيد `0d3c554 Initial commit from Create Next App` — كل الكود الحقيقي غير committed (`src/` · `prisma/` · `public/` · `components.json` · `.husky/` · إلخ).
   - يجب إنشاء repo جديد على GitHub ثم push (انتبه: `.env` مُستبعد بـ `.gitignore` — لا يُرفع أبدًا).
2. **إكمال لوحة الأدمن بالكامل** (قرار walid: «الداشبورد الخاصة بالأدمن لازم تكون كاملة وشغّالة»):
   - إضافة **صور حقيقية** للمنتجات من لوحة الأدمن (رفع/استبدال لكل منتج — حاليًا `ProductArt` مولّد والـ slider صور ثابتة `/slider/*.png`).
   - إضافة **وصف** مُحرَّر كامل للمنتجات (حاليًا الحقول ar/en موجودة في النموذج — يُراجع ويُحسَّن العرض).
   - **تعديل السلايدر** من لوحة الأدمن (حاليًا `page.tsx` يفرض `/slider/{rush,noir,gold}.png` ثابتة — يجب أن تصبح قابلة للإدارة).
   - تحسين شامل لقابلية استخدام اللوحة (تجربة المستخدم).

### ما زال معلّقًا من walid (بيانات خارجية)

- `RESEND_API_KEY` (Resend — resend.com → API Keys → `re_...`) — البريد يعمل بلا مفاتيح (تسجيل فقط) حتى يُضاف.
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID → **Web application** → redirect URI: `http://localhost:3100/api/auth/callback/google`).
- Cloudinary (الـ 3) **أُلغي** — غير مهمة حسب walid. الصور ستُدار من لوحة الأدمن نفسها.

- [x] حل تعارضات البريف وتثبيت الستاك (npm بدل pnpm — مصدر npmmirror)
- [x] كتابة `CLAUDE.md`
- [x] الإعداد (Setup): Next.js 16 · Tailwind v4 · shadcn/ui (Base UI) · ESLint flat config / Prettier / Husky + lint-staged · هيكل `src/` feature-based
- [x] Database Schema (Prisma) — models جاهزة و client اتولّد (`prisma/schema.prisma`)
- [x] الهوية البصرية: **ADDICTIONX** — أسود + نيون أحمر + فضي معدني + Heartbeat line
- [x] i18n: `[lang]` segment + قواميس AR/EN + LanguageSwitcher + `proxy.ts` (مُختبَر: `/`→307→`/ar`، `/en` يعمل بـ `dir=ltr`)
- [x] الثيم: `ThemeProvider` + `ThemeToggle` (دارك افتراضي + light palette)
- [x] الصفحة الرئيسية: Hero سينمائي (Aurora + Particles + AnimatedTitle + Heartbeat) + الأكثر طلبًا + المجموعات + التجربة + CTA
- [x] الكتالوج: فلترة (مجموعة/نوع) + ترتيب (بأسعار/تقييم) عبر `searchParams`
- [x] صفحة المنتج: صورة + سعر + مكونات (مقدمة/قلب/قاعدة) + كمية + إضافة للسلة
- [x] السلة: Zustand `cart-store` (مع persist) + CartDrawer منزلق + عداد في الـ Header
- [x] Checkout: نموذج RHF + Zod (شحن/دفع) + ملخص الطلب + رسالة نجاح
- [x] **Auth.js v5 الفعلي:** Credentials + PrismaAdapter + جلسات JWT · `bcryptjs` · `registerAction` (Server Action) · `signIn("credentials")` مع `callbackUrl` · sign-out button
- [x] **حساب المستخدم حقيقي:** حماية (redirect + callbackUrl) · بيانات العميل وطلباته من DB · رابط اللوحة للأدمن
- [x] **ربط الـ DB بالكامل:** PostgreSQL محلي (`luxury_perfume`) · `DATABASE_URL` حقيقي · migrations (`init` + حقول الستورفرنت) · الستورفرنت يقرأ عبر `products-db.ts` (صفحات `force-dynamic`)
- [x] **البذور:** `prisma/seed.ts` + `npm run db:seed` (tsx) → أدمن + 8 منتجات + 3 مجموعات + variant 100ml
- [x] **لوحة التحكم:** layout محمي · dashboard (إحصائيات/أحدث الطلبات/مخزون منخفض) · CRUD منتجات (نموذج موحّد create/edit) · طلبات (فلاتر/تفاصيل/تغيير حالة) · مستخدمون (تغيير دور) · كل الـ Server Actions محمية بـ `requireAdmin()`
- [x] التحقق: `next build` + `lint` (0 مشاكل) + `type-check` نظيف + اختبار حي (تسجيل/دخول/أدوار/صفحات 200) — dev على المنفذ 3100
- [x] **ربط الـ checkout بالطلبات:** السلة تحمل snapshot كامل (اسم/سعر/حجم/art) — الـ drawer والملخص يقرءان منها لا من mock · `createOrder` (سعر من DB لا من العميل · Address + Order + items في معاملة واحدة · خصم مخزون ذرّي مع فشل كامل عند نقصه · رقم طلب `ADDX-...`) · يتطلب تسجيل دخول (redirect مع callbackUrl) · شاشة نجاح برقم الطلب
- [x] التحقق الحي للطلبات: طلب تجريبي اتعمل وظهر في admin/account، المخزون اتخصم، ومسار STOCK يعمل — وبعده تنظيف كامل للبيانات التجريبية
- [x] **داشبورد المستخدم (العميل):** صفحة حساب بتبويبات (نظرة عامة/طلباتي/عناويني/مفضلتي) + تفاصيل طلب (عناصر + عنوان + تتبع الشحنة) + مفضلة فعلية (WishlistItem + toggle + زر في البطاقات وصفحة المنتج)
- [x] **توسيع صلاحيات الأدمن:** إضافة مستخدم (createUser) + حذف مستخدم (deleteUser مع فصل الطلبات) + متابعة الشحن (Shipment ينشأ تلقائيًا عند SHIPPED + `shipment-form` لـ carrier/tracking في تفاصيل الطلب)
- [x] **إعدادات الشحن من DB:** `StoreSetting` + `getShippingConfig` (ذاكرة 5ث + fallback) + `GET /api/shipping-config` + نموذج `admin/settings` (`updateShippingSettings`) — الـ checkout و cart-drawer يقرءان الإعدادات الفعلية (الشحن مجاني فوق الحد، carrier ظاهر في التتبع)
- [x] **كوبونات الخصم:** `Coupon` model + إدارة أدمن (`admin/coupons` — إنشاء PERCENT/FIXED، تفعيل/إيقاف، حذف) + `validateCoupon` (تحقق فوري) + `createOrder` يطبّق الخصم (نسبة بسقف `maxDiscount` أو مبلغ ثابت ≤ السلة، بشرط `minOrderAmount`/`maxUses`/`expiresAt`) ويُسجّله في الطلب ويُحدّث `usedCount` في المعاملة
- [x] **إدارة الـ Sale:** `discountPercent` في نموذج المنتج (0–90) يحسب `compareAtPrice` تلقائيًا + فلتر "على العرض" في قائمة المنتجات + شارة sale في بطاقات الستورفرنت
- [x] التحقق: `type-check` + `lint` + `build` نظيف · اختبار حي 3100 (الـ API يعكس إعدادات DB بعد التعديل · صفحة الكوبونات تعرض الكوبونات المزروعة · فلتر sale يعرض المنتجات المخفّضة فقط · شارة الخصم تظهر في الكتالوج)
- [x] **الإبهار البصري — الموجة الأولى (wave 1):** نظام scroll-reveal موحّد (`Reveal/Stagger`) في الرئيسية/الكالوج/صفحة المنتج · شريط marquee بعد الـ hero · **طيران المنتج للسلة** (fly-to-cart + نبضة أيقونة) · hover سينمائي لبطاقات المنتجات (توهج + ضوء ماسح) · عناوين الأقسام metallic-shine + heartbeat · CTA نابض — تحقق: type-check + lint + build + صفحات 200 حي
- [x] **الإبهار البصري — الموجة الثانية (wave 2):** `PageTransition` في اللayout (دخول ناعم عند كل تنقّل) · `CursorGlow` (توهج يتبع المؤشر — Desktop فقط) · `CountUp` + `StatsBand` (عدّادات أرقام حقيقية من DB في الرئيسية) · نبضة wishlist (انفجار قلب) — تحقق: type-check + lint + build + صفحات 200 حي
- [x] **الفوتر/السوشيال:** `siteConfig.social` = روابط حقيقية **Instagram (addictionn_x) + TikTok (addiction_x8)** فقط — **حُذف facebook نهائيًا**؛ الفوتر يعرض الرابطين (والـ footer نفسه مجموعاته من DB).
- [x] **تقييمات المنتجات (Reviews):** `model Review` كان موجودًا بالـ schema — أُضيفت الطبقة الكاملة: `features/reviews/actions.ts` (createReview upsert على `productId_userId` + moderateReview + deleteReview + recomputeProductStats) · `admin/reviews` (قائمة كل التقييمات + موافقة/رفض/حذف) · صفحة المنتج (قائمة المعتمدة + نموذج عميل مع تعديل تقييمه أو رابط تسجيل دخول) · `dict.reviews.*` + مفاتيح admin — تحقق حي: تقييم → موافقة → recompute (4.9/214 → 5.0/1 من الحقيقي) → ظهور في الستورفرنت.
- [x] **إدارة المجموعات (Collections):** `Collection` model جديد (migration `collections` — **لا FK مع Product**، الـ slug نصي) · بذرة الـ collections حُوّلت من `prisma.category` إلى `prisma.collection` · `getCollections()` fallback للثابتة + مستخدم في footer/home/catalog/نموذج المنتج (select `slug — name`) · `admin/collections` (إضافة مجموعة + حذف محمي من المنتجات + **عرض عطور كل مجموعة بعددها**) — تحقق حي: 3 مجموعات مع عدد كل عطورها.
- [x] **هرم المكوّنات:** قسم الـ notes في صفحة المنتج أصبح على شكل هرم (قاعدة/قلب/مقدمة) بدل أعمدة متساوية + اسم المجموعة يُقرأ ديناميكيًا.
- [x] **التحقق الشامل (هذه الجولة):** `type-check` نظيف · `eslint` نظيف على كل الملفات المتغيرة · `next build` ناجح بكل المسارات الجديدة (reviews/collections) · اختبار حي 3100: الرئيسية/الكالوج/صفحة منتج 200 + admin (reviews/collections) 200 بالجلسة الأدمن + anonymous→307 + القاموس AR reviews تمّ.
- [x] **عناوين العميل — CRUD كامل:** add/edit/delete + افتراضي من حساب العميل (`address-manager` + `address-form`) — تحقق حي: إنشاء → عرض → حذف.
- [x] **إلغاء الطلب من العميل:** `cancelOrder` (PENDING فقط + ملكية + إعادة المخزون) + زر في تفاصيل الطلب + **admin كمان صار يردّ المخزون عند CANCELLED/REFUNDED** — تحقق حي: إلغاء طلب تجريبي ورجع المخزون 8→10.
- [x] **النشرة البريدية:** اشتراك من الفوتر (بلا تسجيل دخول، upsert) + `admin/newsletter` (قائمة/تفعيل/إيقاف/حذف) — تحقق حي: إضافة مشترك → ظهور في الأدمن → تنظيف. **ثم قرار نهائي:** النشرة داخل كتلة الفوتر فوق الأعمدة و`newsletter-section.tsx` حُذف.
- [x] **الـ hero المكتمل (الموجة النهائية):** عكس الدوران (scrub مزدوج) + خروج ناعم fade عند التمرير + **بوب تلقائي GSAP** بعد 3.5s خمول (لف+عكس، تلغيه أي حركة مؤشر) + تلميح مؤشر — تحقق: tsc + eslint + build + حي 200 بلا أخطاء كونسول.
- [x] **الـ hero — sprite filmstrip (الموجة الأخيرة النهائية):** استبدال `video.currentTime` seek (كان بطيئًا غير طبيعي) بـ `background-position` فوق شرائط `public/sprites/{left,right}.jpg` (10×6) — حركة فورية + اكتشاف تلقائي (بلا تلميح) + no deadZone + `FRAMES=59` (لا فراغ أسود بآخر الشريط) + اللوح الأيمن `translateX(-5px)` للمطابقة بين الجانبين + فيديو الموبايل المتناوب بلا تلميح. تحقق: tsc نظيف + eslint نظيف + build ناجح + حي 200.
- [x] **كاروسيل المجموعات:** `product-carousel` (أدوار center/left/right بـ CSS transitions 650ms + swipe + كيبورد RTL + IntersectionObserver) بصور `/slider/{rush,noir,gold}.png` — تحقق: tsc + eslint + build + حي 200.
- [x] **إشعارات الإيميل (Resend):** `src/lib/email.ts` (يعمل بلا مفاتيح) + تكامل في createOrder (عميل/أدمن) + updateOrderStatus + updateShipment + cancelOrder — تحقق: tsc + eslint + build نظيف.
- [x] **تسجيل الدخول بحساب Google:** provider + زر في auth-form + مفاتيح قاموس — تحقق: tsc + eslint + build نظيف. **معلّق:** مفاتيح `AUTH_GOOGLE_ID/SECRET` من walid.
- [x] **طلب يدوي من الأدمن + إشعار مخزون منخفض:** `createManualOrder` (تفاصيل الضيف في `Order.notes`) + صفحة/فورم `orders/new` + زر في رأس الطلبات + `notifyLowStock` (إيميل أدمن إن وصل مخزون ≤5) يُستدعى بعد أي طلب — تحقق: tsc + eslint + build + حي 200.
- [ ] إعداد `RESEND_API_KEY` في `.env` — **محتاج من walid**
- [ ] مفاتيح Google OAuth (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`) — **محتاج من walid**
- [ ] ربط صور Cloudinary بدل `ProductArt` — **محتاج بيانات الحساب من walid** (cloud name + API key/secret) + رفع الصور على Cloudinary (سير عمل CLAUDE.md #4)

**قرارات مُثبَّتة:**

- الهوية: **ADDICTIONX** — «Feel the Rush». الجمهور شباب → إبهار بصري أولوية قصوى.
- الألوان: أسود عميق `oklch(0.12 …)` + نيون أحمر `oklch(0.6 0.22 22)` + فضي معدني متدرج للعناوين.
- الخطوط: Cairo (عربي+لاتيني، body) · Playfair Display (لاتيني، display). `--font-cairo` و `--font-playfair`.
- shadcn `base-nova` style + `@base-ui/react` (بدل Radix). `components.json` عند الجذر، `rtl: true`.
- الترجمة: `[lang]` segment (`/ar`، `/en`)، الافتراضي `ar`، قواميس `src/lib/i18n/dictionary.ts`.
- الثيم: دارك افتراضي، تفضيل في `localStorage`، ألوان كـ CSS variables، light في `:root[data-theme="light"]`.
- Framer Motion (framer-motion v13) — بدل motion package (حسب طلب walid).
- **Base UI Button يستخدم `render={<Link/>}` للـ polymorphism — لا `asChild`.**
- الأسعار `Int` بالقروش (قرار #3) — `formatPrice()` في `products.ts` للتحويل للعرض، و`egpToQirsh` (×100) عند إدخال الأدمن.
- الأخطاء عند البناء: أي مشكلة `createMotionComponent` على الـ server = مكوّن Server يستورد `motion` مباشرة. الحل: `"use client"` أو CSS hover بدله.
- **لا تُمرَّر دوال/أيقونات من Server لـ Client Component** — تُعرَّف داخل الـ client وتُمرَّر نصوص فقط (خطأ `Functions cannot be passed directly to Client Components` وقع في `admin/layout.tsx` مع icons).
- **سعر الطلب يُحسب في الـ server من الـ DB حصرًا** — snapshot السلة (اسم/سعر/حجم) للعرض فقط ولا يُوثق به في الحساب.
- **الـ checkout يتطلب تسجيل دخول** — `Order.userId` إجباري؛ غير المسجّل يُحال للـ login مع `callbackUrl`.
- **فصل واضح بين داشبوردين:** داشبورد العميل (نطاقه: طلباته + عناوينه + مفضلته) وداشبورد الأدمن (صلاحيات كاملة: CRUD منتجات · إدارة مستخدمين بإضافة/حذف · متابعة شحن · متابعة شاملة). `/admin` للأدمن حصرًا.
- **الشحن:** `Shipment` model مرتبط الآن — يُنشأ تلقائيًا عند تحويل الطلب إلى `SHIPPED` (carrier افتراضي `Bosta`)، يُغلق عند `DELIVERED`، ويُحذف عند `CANCELLED/REFUNDED`. التتبع يظهر للعميل في تفاصيل طلبه وللأدمن في لوحة الطلبات.
- **إعدادات الشحن = مصدر الحقيقة في DB** (`StoreSetting`): الـ checkout و cart-drawer يجلبانها من `GET /api/shipping-config` — ثوابت `src/lib/checkout-config.ts` fallback فقط للعرض قبل التحميل.
- **الكوبونات:** `discountValue` — PERCENT كنسبة صحيحة (%)، FIXED بالقروش (الإدخال بالجنيه يُضرب في 100). الخصم يُحتسب في السيرفر دائمًا. `minOrderAmount` في schema `Int?` → أي استخدام يحتاج `?? 0`.
- **الـ Sale = `compareAtPrice` موجود** (لا حقل مستقل) — `discountPercent` في نموذج الأدمن يولّده تلقائيًا؛ فلتر الأدمن `NOT: { compareAtPrice: null }`.
- **تحقق الكوبون في `createOrder` هو الحكم النهائي** — `validateCoupon` في الواجهة للمعاينة فقط (السعر النهائي يُحسب في السيرفر داخل المعاملة مع خصم المخزون).
- **`toLocaleDateString` لا يقبل `timeStyle` في Node** (الباوزر يتسامح، Node يرمي خطأ) — للتاريخ+الوقت استخدم `toLocaleString`.
- **حذف مستخدم:** لا يسمح بحذف نفسه؛ طلباته تُنقل لـ `userId=null` (تاريخ الطلب يبقى مجهولًا) ثم يُحذف المستخدم في معاملة واحدة.
- أدمن البذور: `admin@addictionx.com` (كلمة المرور في `prisma/seed.ts`) — **غيّرها فورًا قبل النشر**.
- `@prisma/client` يستورد خارج المشروع (سكربتات temp) يفشل — ضع السكربت داخل المشروع، وscript بالـ async pattern (لا top-level await مع tsx).
- **التقييمات (قرار ثابت):** تقييم واحد لكل منتج/مستخدم — upsert على `productId_userId`؛ التعديل يعيد التقييم pending؛ النشر يعتمد موافقة الأدمن؛ `rating`/`reviewsCount` في DB يُعادان من **التقييمات الفعلية المعتمدة فقط** (بذور الأرقام التسويقية تنهار عند أول موافقة — مقصود).
- **المجموعات (قرار ثابت):** بلا FK — `Product.collection` slug نصي يبقى كما هو؛ `Collection` model يُدار من الداشبورد (add/delete — الحذف يرفض ما دام بها منتجات).
- **السوشيال (قرار ثابت):** Instagram + TikTok فقط — **لا فيسبوك** (حسب طلب walid).

**البيئة:** Node v24 · npm 11 (مصدر npmmirror + PRISMA_ENGINES_MIRROR للتثبيت) · git v2.34 · PostgreSQL محلي (منفذ 5432) · dev server يعمل على المنفذ 3100
