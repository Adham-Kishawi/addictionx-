# برومبتات صور المنتجات — ADDICTIONX

**ثمانية عطور.** كل عطر له برومبت مستقل بالإنجليزية، جاهز للنسخ في GPT.

---

## أولًا: المواصفات التقنية (ملزمة)

| البند   | القيمة                  | السبب                                                 |
| ------- | ----------------------- | ----------------------------------------------------- |
| النسبة  | **4:5 رأسي**            | `product-card` وصفحة المنتج كلاهما `aspect-[4/5]`     |
| المقاس  | **1600×2000**           | ضعف مقاس العرض الفعلي — يكفي شاشات Retina             |
| الصيغة  | **JPG** (وليس PNG شفاف) | العرض بـ `object-cover` — الصورة تملأ الإطار بخلفيتها |
| الخلفية | **مشهد كامل**           | عكس صور الكاروسيل الشفافة تمامًا — لا تخلط بينهما     |

⚠️ **فرق جوهري عن صور الكاروسيل:** صور `public/slider/*.png` شفافة بلا خلفية لأنها تطير في مسرح ثلاثي الأدوار. صور المنتجات هنا **بخلفية كاملة** لأن `object-cover` يقصّها ويملأ بها البطاقة. لا ترسل PNG شفافًا هنا — سيظهر بخلفية بيضاء أو سوداء عشوائية.

**التأطير الموحّد في كل الصور الثمانية:**

- الزجاجة في **الثلث العلوي الأوسط**، تشغل ~60% من ارتفاع الإطار.
- مسافة أمان في الأسفل (~15%) — لأن `object-cover` قد يقصّ الحواف على مقاسات مختلفة.
- زاوية الكاميرا **واحدة في كل الصور**: أمامية بميل بسيط جدًا (~10°) وعلى مستوى العين.
- الإضاءة الأساسية من **نفس الجهة** في كل الصور (يمين علوي خلفي).

**السبب:** الثماني صور تظهر في شبكة واحدة بجانب بعضها في صفحة الأكثر طلبًا والكتالوج. أي اختلاف في الزاوية أو الحجم أو مستوى الأفق يجعل الشبكة تبدو كصور مجمّعة من مصادر مختلفة — وهذا بالضبط ما يفرّق بين متجر علامة ومتجر marketplace.

---

## ثانيًا: اللوجو — اقرأ هذا قبل التوليد

اللوجو هو **`ADDICTIONX` + خط القلب (heartbeat line)**. خط القلب هو التوقيع البصري للعلامة وموجود فعلًا في الكود (`heartbeat-line.tsx`) بهذا المسار:

```
M0 20 L35 20 L45 8 L55 32 L65 20 L100 20 L110 12 L120 28 L130 20 L200 20
```

خط أفقي فيه **نبضتان**: نبضة كبيرة (هبوط ثم صعود حاد) ثم نبضة أصغر — تمامًا كشاشة مراقبة القلب.

### الحقيقة التقنية التي يجب أن تعرفها

**موديلات توليد الصور تفشل في كتابة النصوص بدقة.** كلمة `ADDICTIONX` (10 أحرف) ستخرج في الغالب `ADDICTIONX` أو `ADDICITONX` أو `ADDIGTIONX` — أو حروف صحيحة بتباعد خاطئ. هذه ليست مشكلة في البرومبت، هي حدود المعمار نفسه.

لذلك المسار الاحترافي مسارَان معًا:

**المسار أ — التوليد المباشر (جرّبه أولًا):**
أرفق صورة اللوجو المرجعية مع كل برومبت، وكل برومبت أدناه يحتوي مقطع اللوجو **صريحًا ومؤكَّدًا**. راجع كل صورة بعدسة مكبّرة على الحروف. لو خرجت صحيحة — ممتاز، وفّرت خطوة.

**المسار ب — التركيب اللاحق (الضمان):**
لو الحروف غلط بعد 3 محاولات، **لا تُكرِّر بلا نهاية**. ولّد الزجاجة بلوحة ملصق **فارغة نظيفة**، وأنا أركّب اللوجو الحقيقي فوقها بدقة البكسل. النتيجة أفضل: لوجو حاد بلا تشويه، متطابق حرفيًا في الصور الثمانية.

لتفعيل المسار ب، استبدل مقطع اللوجو في أي برومبت بهذا:

```
The bottle's front label area is a clean, completely blank rectangular
plate with a subtle raised edge — no text, no letters, no symbols,
no engraving whatsoever. Perfectly smooth and empty, evenly lit,
facing the camera straight on.
```

ثم ابعتلي الصور وأنا أركّب اللوجو.

### 🔴 مطلوب منك قبل ما أبدأ

قلت إنك هتبعت **ريفرنس اللوجو** — لسه ما وصلني. ابعته (PNG أو SVG أو حتى screenshot) وقتها:

- أضبط وصف اللوجو في البرومبتات الثمانية على شكله الفعلي (الخط، التباعد، وضع خط القلب بالنسبة للكلمة).
- أقدر أنفّذ المسار ب لو احتجناه.

البرومبتات أدناه تستخدم وصفًا مبنيًا على `heartbeat-line.tsx` والهوية في `CLAUDE.md`. **بعد ما تبعت الريفرنس هحدّثها.**

---

## ثالثًا: المقطع المشترك (يُلصق في كل برومبت)

هذا هو **مقطع اللوجو الموحّد**. هو نفسه حرفيًا في الثمانية — لا تغيّر فيه كلمة، لأن أي اختلاف في وصفه يُنتج لوجو مختلفًا في كل صورة.

```
LOGO — CRITICAL, MUST BE PRESENT AND CORRECT:
The front of the bottle carries the brand mark, clearly legible and
sharply in focus. Two elements, stacked vertically and centered:
(1) a thin horizontal heartbeat pulse line — a flat line that spikes
into one tall sharp peak followed by one smaller peak, like an ECG
monitor trace, drawn as a single continuous 1px-thin stroke;
(2) directly below it, the wordmark "ADDICTIONX" in clean bold
uppercase sans-serif letters, widely and evenly letter-spaced,
perfectly horizontal, all ten letters equal height, spelled exactly
A-D-D-I-C-T-I-O-N-X with no extra, missing, or repeated letters.
The logo is centered on the label, small and restrained — occupying
about 40% of the label width. Crisp, high contrast against the label,
no distortion, no warping, no reflection over the letters.
```

**والمقطع المانع (negative) — يُلصق في نهاية كل برومبت:**

```
STRICTLY AVOID: any other text, words, taglines, numbers, barcodes,
volume markings, or fake ingredient lists anywhere in the image.
No misspelled or garbled letters. No watermark, no signature, no
copyright mark. No human hands, fingers, or people. No flowers,
petals, fruit, coffee beans, or literal ingredient props scattered
around. No visible product packaging or cardboard box. No cluttered
background objects. No harsh direct flash. No plastic or cheap
glossy look. No cartoon, illustration, painting, or 3D-render look —
this must read as a real photograph.
```

**لماذا المانع مهم بهذا الطول:** موديلات التوليد تميل تلقائيًا لإضافة نصوص عشوائية على العبوات (تخيّلها "واقعية")، وترمي بتلات ورد وحبوب قهوة حول الزجاجة كـ"دليل" على النوتات. الأولى تُنتج لوجو زائفًا بجانب لوجوك الحقيقي، والثانية تُنتج مظهر صورة مخزون رخيصة. النفي الصريح هو الطريقة الوحيدة لكفّها.

---

## رابعًا: البرومبتات الثمانية

> **طريقة الاستخدام:** انسخ برومبت المنتج + الصق **المقطع المشترك للوجو** + الصق **المقطع المانع**. أرفق ريفرنس اللوجو. المقاس 1600×2000.

---

### 1️⃣ Red Rush — ريد راش

`slug: red-rush` · مجموعة الإحساس · unisex · 1,850 ج · 🔥 الأكثر طلبًا

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a heavy rectangular flacon of thick clear glass with
softly beveled vertical edges, filled with deep crimson-red liquid
that glows from within as if lit from behind. Wide flat shoulders,
short neck, and a solid matte black cap with a thin brushed-silver
metal ring at its base.

Lighting and scene: the bottle stands upper-center on a seamless
deep charcoal-black surface that fades to pure black at the top of
the frame. A single hard rim light from the upper right rear traces
the right edge of the glass in bright neon red, making the liquid
appear to burn. A soft cool silver fill from the left keeps the left
edge readable. Faint red light bleeds onto the black surface directly
under the bottle. Thin wisps of dark red atmospheric haze drift in
the deep background, far behind the bottle and well out of focus.

Palette: strictly deep black, crimson and neon red, and cool metallic
silver. No other hue anywhere.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: dangerous, electric, adrenaline. Like a fragrance ad in a
fashion magazine.
```

**لماذا:** الوصف "انفجار أدريالين" + `art.glow: #ef4444` → السائل نفسه هو مصدر الضوء. هذا هو منتج الواجهة، وصورته تحدد سقف باقي الصور.

---

### 2️⃣ Midnight Noir — منتصف الليل

`slug: midnight-noir` · مجموعة الليل · رجالي · 2,400 ج · 🔥 الأكثر طلبًا

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a tall rectangular flacon of smoked charcoal-grey glass,
almost opaque, with a deep indigo-blue undertone visible only where
light passes through the edges. Sharp square shoulders. A solid matte
black cap, taller than usual, with a single thin polished silver band.

Lighting and scene: the bottle stands upper-center on a black
reflective stone surface with an extremely subtle mirror reflection
beneath it. A narrow cold blue-white rim light from the upper right
rear defines the right edge of the glass as a thin bright line
against total darkness. A very faint deep indigo glow pools low
behind the bottle. Thin dark smoke drifts slowly in the far
background, deeply out of focus.

Palette: strictly near-black charcoal, deep indigo blue, and cold
metallic silver. Absolutely no warm tones, no red, no orange.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: heavy, imposing, nocturnal. Presence that arrives before you do.
```

**لماذا:** `art.glow: #6366f1` (بنفسجي-أزرق) + "عود دخاني" → الزجاجة نفسها مدخّنة، والضوء البارد وحده يفصلها عن السواد. **الأحمر ممنوع صراحة** هنا حتى لا يتصادم مع مجموعة الإحساس.

---

### 3️⃣ Golden Hour — الساعة الذهبية

`slug: golden-hour` · المجموعة الذهبية · نسائي · 1,700 ج · 🔥 الأكثر طلبًا

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a softly rounded rectangular flacon of clear glass filled
with warm liquid amber the colour of honey held up to sunlight. Gently
curved shoulders, no sharp corners. A polished champagne-gold metal
cap with a fine brushed texture.

Lighting and scene: the bottle stands upper-center on a dark bronze
surface. Warm golden late-afternoon light rakes in from the upper
right rear, passing through the amber liquid and casting a soft warm
caustic glow onto the surface beside the bottle. The background is a
deep dark brown-black gradient, warm rather than neutral. A faint
golden lens haze softens the upper right corner.

Palette: strictly deep warm black-brown, honey amber, and champagne
gold. No red, no blue, no green.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: warm, luminous, golden. Sunlight on skin at the end of the day.
```

**لماذا:** `art.glow: #f59e0b` + "دفء الشمس على الجلد" → الضوء الذهبي هو الموضوع، لا الزجاجة. لاحظ الخلفية **دافئة** (بني-أسود) لا رمادية — الأسود الحيادي يقتل الإحساس الذهبي.

---

### 4️⃣ Velvet Rose — روز مخملية

`slug: velvet-rose` · مجموعة الإحساس · نسائي · 1,950 ج · ✨ جديد

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: an elegant slim rectangular flacon of frosted glass with
a soft satin surface that scatters light like velvet, filled with a
muted dusty rose-pink liquid faintly visible through the frost. Softly
rounded shoulders, slender neck. A matte deep-burgundy cap with a
thin rose-gold ring.

Lighting and scene: the bottle stands upper-center on a black velvet
surface that absorbs light almost completely. Very soft diffused
lighting from the upper right rear wraps around the frosted glass
without any hard highlight — the whole bottle glows gently rather than
reflecting. A faint dusty rose glow pools behind it. Background is
deep black with a barely perceptible warm pink gradient at the base.

Palette: strictly deep black, dusty rose pink, muted burgundy, and
soft rose-gold. Nothing saturated, nothing neon.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: soft, intimate, tactile. Power expressed as gentleness.
```

**لماذا:** `art.glow: #fb7185` (وردي فاتح) + "ناعمة كالمخمل" → الزجاج **مصنفر** والإضاءة **ناشرة بلا لمعة حادة**. هذا الفرق التقني (satin vs. specular) هو ما يترجم كلمة "مخملي" بصريًا.

---

### 5️⃣ Oud Mystique — عود غامض

`slug: oud-mystique` · مجموعة الليل · رجالي · 2,600 ج · 🔥 الأكثر طلبًا · أغلى منتج

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a broad, heavy, architectural rectangular flacon of
smoke-grey glass, thick and substantial, with strong sharp edges and
deep bevels that catch light like cut stone. Wide flat shoulders. A
solid gunmetal cap with a matte finish and a fine machined silver
edge. The glass suggests great weight.

Lighting and scene: the bottle stands upper-center on a dark textured
slate surface. Two hard narrow silver-white rim lights, one from the
upper right rear and one grazing from the left, carve the bevels into
bright metallic lines against near-total darkness. No soft fill — the
contrast is deliberately extreme. Background is pure black with a
faint cold grey haze low behind the bottle.

Palette: strictly black, smoke grey, and cold metallic silver and
gunmetal. Absolutely no warm tones, no gold, no red.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: severe, expensive, uncompromising. Sculpted rather than
manufactured.
```

**لماذا:** `art.glow: #a1a1aa` (فضي رمادي) + أغلى سعر → الفخامة تُترجم **بالتباين الحاد والكتلة**، لا باللون. الإضاءة الحادة بلا fill هي ما يجعل الزجاج يبدو منحوتًا من حجر.

---

### 6️⃣ Citrus Dream — حلم حمضي

`slug: citrus-dream` · المجموعة الذهبية · unisex · 1,200 ج · ✨ جديد · أرخص منتج

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a clean cylindrical flacon of very clear bright glass
filled with pale liquid the colour of ice water with the faintest
green-cyan tint. Simple straight silhouette, minimal and modern. A
brushed silver cap with a clean flat top.

Lighting and scene: the bottle stands upper-center on a dark teal-black
surface. Crisp cool light from the upper right rear passes cleanly
through the transparent liquid, throwing a bright caustic light pattern
onto the surface beside the bottle. The background is a deep dark
teal-to-black gradient, noticeably cooler and slightly brighter than
the other bottles. A light cool mist hangs in the far background.

Palette: strictly deep teal-black, pale ice cyan, and bright cool
silver. No warm tones, no yellow, no red.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: clean, crisp, awake. Cold water on a hot morning.
```

**لماذا:** `art.glow: #22d3ee` (سماوي) + "مثالي للنهار" → هذا **العطر النهاري الوحيد** في التشكيلة. الخلفية أفتح قليلًا والحرارة اللونية أبرد — الفرق يجب أن يُقرأ فورًا في شبكة الكتالوج. لاحظ: أنقى شكل زجاجة (أسطوانة بسيطة) لأنه أرخص سعر — البساطة هنا صادقة لا فقيرة.

---

### 7️⃣ Smoke Signals — إشارات دخان

`slug: smoke-signals` · مجموعة الليل · رجالي · 1,550 ج

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a squat, wide rectangular flacon of tobacco-brown tinted
glass, semi-transparent, filled with dark caramel-amber liquid.
Slightly rounded corners, low and grounded proportions. A dark walnut-
brown cap with an aged brass ring, the metal slightly patinated rather
than polished.

Lighting and scene: the bottle stands upper-center on a dark aged
wood surface with visible fine grain. Warm low-angle light from the
upper right rear glows through the brown glass, giving it an ember-like
interior warmth. Real wisps of pale grey smoke curl slowly upward from
behind the bottle, softly lit and thoroughly out of focus. Background
is a deep warm brown-black gradient.

Palette: strictly deep brown-black, tobacco brown, dark amber, and
aged brass. No cool tones, no silver, no blue.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: smoky, secretive, lived-in. An unfinished story.
```

**لماذا:** `art.glow: #d97706` (برتقالي محروق) + "دخان معسول" → **الدخان الحقيقي الوحيد** في التشكيلة، ومقنّن (خلف الزجاجة، خارج التركيز) حتى لا يصير ضبابًا يخفي المنتج. النحاس **مؤكسد** لا ملمّع — الفرق بين "قديم بقيمة" و"قديم بإهمال".

---

### 8️⃣ Mystic Pearl — لؤلؤة الغموض

`slug: mystic-pearl` · المجموعة الذهبية · نسائي · 1,450 ج · ✨ جديد

```
Editorial product photograph of a luxury perfume bottle, shot on a
professional macro lens, 4:5 vertical framing.

The bottle: a graceful teardrop-shaped flacon of pearlescent opal
glass with an iridescent surface that shifts subtly between white,
pale violet and soft silver depending on the angle — like the inside
of a seashell. Smooth continuous curves, no edges. A polished silver
cap with a small pearl-white inlay on top.

Lighting and scene: the bottle stands upper-center on a black surface
with a very faint pearl sheen. Soft wrapping light from the upper
right rear plays across the iridescent glass, creating a gentle
shifting violet-to-white gradient over its surface. A faint soft
violet glow haloes the bottle. Background is deep black with a subtle
cool violet gradient rising from the base.

Palette: strictly deep black, pearl white, soft violet, and bright
silver. No warm tones, no gold, no red.

Composition: bottle occupies about 60% of frame height, positioned in
the upper-center third, with clear empty dark space in the lower 15%
of the frame. Camera at eye level, bottle turned about 10 degrees so
the front face still reads flat toward the lens. Shallow depth of
field: the label is razor sharp, the background dissolves.

Mood: luminous, delicate, quietly magnetic. Delicacy that holds
presence.
```

**لماذا:** `art.glow: #c084fc` (بنفسجي فاتح) + "لؤلؤة بيضاء مشعة" → الشكل **دمعة منحنية** بلا حواف، وهو الشكل الوحيد المنحني كليًا في التشكيلة. تنوّع الأشكال مقصود: يمنع الشبكة من أن تبدو كثمانية نسخ من زجاجة واحدة.

---

## خامسًا: فحص الصور بعد التوليد

راجع كل صورة على هذا الترتيب. **لا تنتقل للتالية قبل ما تجيب على الخمسة.**

**1. اللوجو — الأهم**
كبّر الصورة على منطقة الملصق واقرأ الحروف حرفًا حرفًا: `A-D-D-I-C-T-I-O-N-X`. أي حرف ناقص أو زائد أو مقلوب = مرفوضة. خط القلب: خط أفقي بنبضة كبيرة ثم أصغر — لا خط متعرج عشوائي. لو فشلت 3 محاولات، انتقل للمسار ب (لوحة فارغة + أركّبه أنا).

**2. النصوص الطفيلية**
ابحث عن أي كلمة أخرى: `EAU DE PARFUM` · `100ML` · `PARIS` · باركود · أسماء مكوّنات. الموديل يضيفها تلقائيًا وهي أول ما يفضح أن الصورة مولّدة.

**3. التأطير**
هل الزجاجة في الثلث العلوي؟ هل هناك فراغ في الأسفل؟ **ضع الصور الثمانية بجانب بعضها واسأل: هل مستوى الأفق واحد؟ هل الزجاجات بنفس الحجم تقريبًا؟** هذا الفحص المقارن هو الأهم بعد اللوجو، ولا يمكن عمله على صورة واحدة منفردة.

**4. اللون**
كل صورة على لوحتها المحددة فقط. تحديدًا: لا أحمر في Midnight Noir أو Oud Mystique · لا ذهبي في Mystic Pearl · لا دفء في Citrus Dream. تسرّب لوني واحد يخلط المجموعات الثلاث في نظر الزائر.

**5. الواقعية**
هل تبدو صورة فوتوغرافية أم رندر ثلاثي الأبعاد؟ العلامة الفاضحة: انعكاسات نظيفة جدًا ومتناظرة، وحواف حادة رياضيًا بلا أي عيب. لو بدت رندر، أضف `shot on Hasselblad, natural imperfections in the glass` وأعد التوليد.

---

## سادسًا: بعد الموافقة على الصور

1. **التسمية بالـ slug بالضبط** — أسهل ربط وأقل احتمال خطأ:

   ```
   red-rush.jpg · midnight-noir.jpg · golden-hour.jpg · velvet-rose.jpg
   oud-mystique.jpg · citrus-dream.jpg · smoke-signals.jpg · mystic-pearl.jpg
   ```

2. **الضغط قبل الرفع.** صور الكاروسيل الحالية 2MB لكل واحدة (`public/slider/*.png`) — ثقيلة جدًا وتضرب هدف 90+ Lighthouse. المستهدف لصور المنتجات: **150–250KB** لكل JPG عند جودة 82. أنا أضغطها لك.

3. **الرفع من لوحة الأدمن** — نموذج المنتج فيه رفع صورة جاهز (`api/admin/upload-image`).

   ⚠️ **تنبيه من تقرير المراجعة:** الرفع الحالي يكتب في `public/uploads` وهذا **لن يعمل على Vercel** (نظام ملفات للقراءة فقط). للتجريب المحلي تمام، لكن قبل النشر لازم Cloudinary — وهو معلّق على بيانات حسابك.

---

## المطلوب منك الآن

| #   | البند                                                                              |
| --- | ---------------------------------------------------------------------------------- |
| 1   | **ابعت ريفرنس اللوجو** — لأحدّث مقطع اللوجو في البرومبتات الثمانية على شكله الفعلي |
| 2   | ولّد صورة **Red Rush** وحدها أولًا واعرضها عليّ                                    |

**لماذا واحدة فقط أولًا:** Red Rush هو منتج الواجهة، وصورته تحدد لغة الإضاءة والتأطير للسبع الباقية. لو ولّدت الثمانية ثم قررنا تغيير الزاوية أو مستوى الأفق، تُعاد الثمانية كلها. صورة واحدة نتفق عليها = مرجع تُقاس عليه البقية.
