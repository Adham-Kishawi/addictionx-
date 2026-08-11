# ADDICTIONX — UI+ DEPTH BRIEF (اتفضّل أرسله لمودل الـ AI)

> **Purpose:** هذا الملف هو الـ Brief الكامل لمودل الـ AI اللي شغّال على المشروع.
> **Before you code ANYTHING:** اقرأ `CLAUDE.md` في جذر المشروع أولًا (ذاكرة المشروع الكاملة)، ثم اقرأ الـ ui skill (`C:\Users\walid\.agents\skills\ui\` — SKILL.md = conductor يوجّه لـ references/effects.md + layouts.md + animations.md + snippets/ + prompt-library/ بقسم الـ 77 prompt).
> **If a wave needs images you don't have → STOP and request them from walid (list in §6).** Don't fake money shots with placeholder boxes.

---

## 1) الهوية (لا تخرج عنها)

- **ADDICTIONX — «Feel the Rush»**: متجر عطور عربي RTL-first لجمهور Gen Z. البهرجة البصرية = أولوية قصوى.
- الهوية المرئية: **Neon Dark Tech / Cinematic Dark Glass** — أسود عميق `oklch(0.12 …)` · أحمر نيون واحد `oklch(0.6 0.22 22)` · نص معدني فضي `text-metallic-shine` · كروت زجاجية بحدود gradient فقط (تقنية `mask-composite: exclude`) · حبيبات فيلم.
- الخطوط: Cairo (body عربي+لاتيني) · Playfair Display (display). `dir=rtl` في /ar. كل الألوان CSS vars في `globals.css` (`--depth-*`, `--hero-*` = "غرفة التحكم" في الخلفيات).

## 2) Stack وقواعد صارمة لا تُكسر

- Next.js 16 (Turbopack) App Router · Tailwind v4 · **framer-motion ^13** · lucide-react · shadcn base-nova + @base-ui/react · Prisma (Postgres محلي للديف، Neon للإنتاج — **`prisma db push` فقط، وحرام `migrate dev` = مسح البيانات**).
- **الإنيميشن: framer-motion فقط. ممنوع GSAP / Lenis / ScrollTrigger / أي مكتبة runtime جديدة.** الـ pinned sections تُنفَّذ بـ CSS sticky أصلي + `useScroll/useTransform` (نفس شغل BottleRush/CtaScene القائم).
- **z-ladder صريح لكل طبقة** · easings/durations مسماة · `prefers-reduced-motion` يوقف كل سيناريوهات السكرول واللووبات.
- **عنصر الزجاج نفسه لا يُحرّك أبدًا** (`animation-fill-mode` يكسر backdrop-filter) — حرّك أولاده فقط.
- ممنوع تمرير دوال/أيقونات من Server إلى Client (الحدود: `"use client"` مع تمرير نصوص فقط).
- التحقق قبل أي رفع: `npx tsc --noEmit` + `npm run lint` + `npm run build` → تحديث CLAUDE.md → commit → `vercel deploy --prod --yes` → فحص 200 على `/ar` و`/en` و`/ar/catalog` و`/en/collections`.

## 3) المرجع البصري الحاكم

- **voyeurverite.com (الأهم):** في الـ HOME PAGE مع كل سكرول بيحصل أنيميشن — **سكشن مثبّت (pinned) بملء الشاشة والتفاصيل بتعدي من خلاله + أقنعة clip-path هندسية** + animation متسلسل مربوط بالسكرول. هذا هو المعيار النهائي اللي نطارده.
- bombon.rs: كشف النصوص المؤجّل كلمة/حرف بسرعات مختلفة.
- coparadiso.com: grain ثابت + marquees بسرعات متعددة.
- (مطبَّقة سابقًا بـ framer-motion — الهدف نقل نفس الإحساس بدون مكتباتهم.)
- الموقع الحي: `https://addictionx.vercel.app`.

## 4) الموجود فعلًا — لا تعيد بناءه (اتعمل في موجات 3-5)

تسلسل الهوم الحالي: Hero (HeroParallax 3 طبقات + HeroVideoScrub + ParticleField + veil) → Marquee sticky → StatsBand (عدّادات حية + SectionGlow) → ProductCarousel (3 مجموعات) → **BottleRush** (ستيج مثبّت 220vh: الزجاجة الحقيقية scale 0.5→1.15 + rotate -12→10 + تنفّض blur والكلمة المعدنية ADDICTION تنشطر + شرر) → Bestsellers (شبكة ProductCard) → Collections (3 كروت ProductArt) → Experience (WordReveal + مزايا) → CtaScene (6 طبقات: واترمارك parallax · توهج · كرات · شرر · glass card + Spotlight يتبع الكرسر · fade للفوتر + زر بـ btn-conic-ring) → فوتر.
عام: DepthBackdrop (fixed z-[-10] أورورا + كرتين) · NoiseOverlay (grain ثابت z-45) · cursor-glow · WordReveal · Magnetic (أزرار الهيرو + زر CTA) · Spotlight · SectionGlow (parallax لكل سكشن) · count-up · fly-to-cart · heartbeat-line · page-transition · marquee · reveal/stagger.
كلها في `src/components/motion/*` (client) — **أعد استخدامها، لا تنسخ الفلسفة**.

## 5) الموجة المستهدفة — 7 أنظمة عمق (مع ملاحظات الجدوى)

1. **Exploded Product Layers** (Bestsellers): استبدل الكارد المسطح بطبقات 5 في `perspective: 1200px`:
   z-120: نمط heartbeat-line متكرر أحمر blur(8px) opacity .15 · z-60: توهج دائري screen blend · z-0: الزجاجة PNG · z+60: chip زجاجي (الاسم+السعر) · z+120: زر «أضف للسلة» بظل نيون نابض.
   دخول السكرول: الطبقات تطير من أعماق مختلفة (translateZ + spring) · hover: تفكك ±20px + الزجاجة rotateY 15° · خروج السكرول: تتفكك.
2. **360° Pinned Rotating Showcase** — القطعة المركزية (سكشن جديد بعد الهيرو قبل الـ stats):
   منتج واحد مثبّت ~3 أضعاف الشاشة (sticky stage) والزجاجة **تدور 360° كاملة مربوطة بالسكرول** · 4 لوحات معلومات (Top/Heart/Base → السعر+CTA) تدخل وتخرج بأقنعة clip-path من الجوانب، لوحة لكل ربع دورة · خلفية hue تنجرف أحمر→ذهبي→فضي أثناء الدوران.
   ⚠️ **الدوران الحقيقي 360° يحتاج صور زوايا متعددة → §6 بند 2. بدونها: وضع fallback = وهم دوران للـ PNG الواحد (rotateY ثابت + لمعة sheen ماسحة + انعكاس ناعم) — واذكر بوضوح أي وضع اشتغلت فيه.** لا ترسم اتصال بخلفية Flat.
3. **Depth-Stacked Collections** (تحسين الـ collections الثلاث): سطح أوراق بتتكدّس — الأقرب ينزلق يمين + يصغر (translateX 40vw, scale .85, rotateY -15°) واللي بعده يصعد (z+100, scale .9→1) · ظل ديناميكي حسب العمق.
4. **Parallax Text Reveal with Mask** (Experience): عنوان ضخم خلف gradient mask يتحرك بالسكرول ويكشف النص كلمة-كلمة مع rotateX خفيف (طوّر WordReveal القائم — لا تبتكر نظامًا جديدًا) + طبقة 3 سرعات particles خلفه.
5. **Isometric Product Grid + Repulsion Hover** (صفحة catalog فقط): صفوف في perspective مع أعماق صفوف (0 / -80 / -160) وكروت تدخل طائرة من نقاط فضائية · **hover على كارد: جيرانه يُدفعون بعيدًا (framer springs + حساب تقارب المؤشر) والكارد نفسه يطلع قدام z+100**.
6. **Floating CTA with Orbital Ring** (ترقية CtaScene): كرة زجاجية لامعة + **حلقة نيون حمراء عملاقة تدور** (عمّم `.btn-conic-ring` على نطاق أكبر عبر `@property --border-angle`) · hover يسرّع الحلقة فقط · حافظ على الـ z-ladder كاملًا.
7. **Depth Fog on Scroll** (عام): طبقتا ضباب gradient (الأعلى نحو خلفية السمة، والأسفل نحو الأسود) بأوباسيتي مربوط بالسكرول — الأقسام البعيدة تحس عشانها "atmospheric distance" (تركّب مع DepthBackdrop).

## 6) صور مطلوبة — اطلبها من walid قبل الشغل على البنود دي

1. **PNG شفاف للزجاجة الرئيسية (Rush)** بدقة عالية، الزجاجة متوسّطة، بدون خلفية (أو أسود خالص مقبول للطبقات screen blend فقط).
2. **طقم 360°**: 8 عرض × 45° لنفس الزجاجة بإضاءة موحدة — أو ملف GLB/glTF — أو فيديو 360° looping (لبند 2). لو مش متوفرة → نفّذ الـ fallback وقلّي صراحة.
3. **تفكيك حقيقي (اختياري لبند 1):** PNG منفصلة شفافة للغطاء + الجسم + السائل — تسمح بمنظر منفجر حقيقي بدل طبقات CSS بديلة.
4. **هوية خلفية لكل مجموعة** (rush/noir/gold): صورة/نيكستير مميزة لكل مجموعة (للكاروسيل + الكومة المكدّسة) — أو اشتق من `art.glow` الموجود في الـ DB (مقبول).
5. (مستحسن) 4-6 لقطات أسلوب حياة لقسم proof بنمط voyeur + OG image لكل مجموعة.

## 7) بعد العمق — خارطة الطريق الجاية (من ثغرات CLAUDE.md)

- الكاروسيل: أكبر + خلفية هوية لكل مجموعة من `art.glow` + تدوير صور `product.images[]` الحقيقية في الـ showcase + شريط تفاصيل (طلب walid الأصلي لا يزال مفتوحًا).
- من walid: `RESEND_API_KEY` · `AUTH_GOOGLE_ID/SECRET` · بيانات Cloudinary لاستبدال ProductArt بصور حقيقية.
- تقوية: OG/social meta صور · sitemap + robots · مواءمة `siteConfig.url` (addictionx.com) مع الحي (addictionx.vercel.app) · LCP: preload sprite الفيديو + lazy-mount سيناريوهات بوتلRush/Rotating بـ IntersectionObserver · تقليل الـ particles على الموبايل · مراجعة الـ admin dashboards على الموبايل.
- أفكار أعمال (walid يقرر): رسائل هدايا في الـ checkout · كويز عطور · برنامج ولاء "Rush" · تتبع شحنة واتساب للسوق المصري.

## 8) Definition of Done لكل موجة

`tsc --noEmit` + `npm run lint` + `npm run build` نظيفين → CLAUDE.md حُدّث → commit برسالة `feat:/refactor:` → push → `vercel deploy --prod --yes` → 200 على /ar, /en, /ar/catalog, /en/collections.
