# CLAUDE.md — Shared Context Reference

> This file is read automatically at the start of every session. Any new decision must be recorded here immediately,
> otherwise the next session will work with stale context.

---

## Project

A luxury perfume store named **ADDICTIONX** — «Feel the Rush» — for the Egyptian market, Front + Back in one project.
Target audience: **young people** — therefore visual wow is the top priority, not quiet minimalism.

Goal: a **cinematic, breathtaking experience** that makes the user feel they are dealing with a premium youth perfume brand, not a marketplace.
Required level: **production-ready startup**, not a demo or temporary solution.

- Path: `D:\E-Commrece`
- Market: Egypt · Currency: EGP
- Identity: deep black + neon red + metallic silver + Heartbeat line as the visual signature
- Design: Cinematic · Neon · Premium · animation-rich

---

## Working style with walid

- Explain in **simple formal Arabic**, keeping technical terms in English.
- **Step by step. One file at a time.** Wait for his confirmation before moving to the next file.
- **Never give the solution directly unless asked.** Explain the reason for each line.
- When there is more than one way: start with the easiest, then mention the alternatives.
- When there is an error: locate it → explain its cause → write the fix explaining the difference.
- Treat him as a trainee who wants to understand programming deeply, not copy solutions.
- **Push after every update:** we work on the codebase and push to `origin/main` after each completed update — we do NOT work/test locally (no local dev server workflow). The deployed site is the reference for checking results: **https://addictionx.vercel.app/** (Vercel auto-deploys on push).

**Reason:** he wants to understand the project deeply enough to restructure it himself, not just run it.

---

## Installed Stack

| Layer           | Tool                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| Framework       | Next.js 16 App Router (Turbopack default)                                    |
| Language        | TypeScript (strict)                                                          |
| Styling         | Tailwind CSS v4 + shadcn/ui (Base UI)                                        |
| Animation       | Framer Motion (framer-motion) + GSAP (dynamic import only)                   |
| 3D / WebGL      | ~~three.js + R3F~~ **removed (wave 12b)** — replaced by real turntable video |
| Icons           | Lucide React                                                                 |
| Forms           | React Hook Form + Zod                                                        |
| Auth            | Auth.js v5 (beta) — Credentials + PrismaAdapter + JWT sessions               |
| DB              | PostgreSQL (local `luxury_perfume`) + Prisma                                 |
| Password        | bcryptjs (CJS)                                                               |
| State           | Zustand                                                                      |
| Images          | Cloudinary                                                                   |
| Email           | Resend                                                                       |
| Package Manager | npm (registry: npmmirror)                                                    |
| Quality         | ESLint (flat config) · Prettier · Husky                                      |
| Deploy          | Vercel                                                                       |

---

## Architectural decisions and their reasons

### 1. Next.js fullstack with explicit layers — no separate Express

The old plan was a separate Express API. **Canceled**, and the reason is technical, not a preference:

- Server Actions would become a mere **proxy** calling HTTP — a redundant layer with no benefit.
- Server Components would lose their strongest feature: reading from the DB directly without a round-trip.
- Auth.js is designed to live inside Next — with a separate API you manage the session in two places or write a manual JWT handoff.
- Vercel alone is not enough — you need a second host for the API: more cost, more ops, and an extra point of failure.

**The original educational goal of Express** (understanding layer separation by hand) is achieved with the explicit layers inside Next:

```
Server Action  →  Service  →  Repository  →  Prisma
```

**Governing rule:** the Server Action **never touches Prisma**. It calls a service,
the service calls a repository, and only the repository knows Prisma.

> Future exception: when background jobs or payment webhooks are needed, a separate service will be discussed at that time.

### 2. Framer Motion as the base · GSAP only via dynamic import

The brief asked for Motion as the base and GSAP "only if needed", but the hero and gallery scenes are scroll-driven and need ScrollTrigger. Loading both libraries in the initial bundle **kills the 90+ Lighthouse goal**.

- Framer Motion (`framer-motion` package) → everything: page transitions · hover · stagger · layout.
  Motion components are always Client Components (`"use client"`) called from Server Component pages.
- GSAP ScrollTrigger → only inside the cinematic scroll scenes, via `dynamic()` with `ssr: false`.
- **Always respect `prefers-reduced-motion`.** Performance first.

### 3. Money stored as integers (piasters/qirsh)

Never `Float` or `Double` for prices — floating point produces rounding errors in financial calculations.
All amounts are `Int` in **piasters** (100 piasters = 1 EGP), and conversion for display happens only in the UI layer.

### 4. Image workflow

There is no image generation tool in this session. Division of labor: **I write the prompts and process the images, and walid generates them in GPT**, then they are uploaded to Cloudinary.

### 5. Originality rule

References (`21st.dev` · `motionsites.ai` · any design reference) are **inspiration only**:
study the interaction patterns, the language of motion, and the user experience. **No copying** of design, code, or branding.

### 6. i18n — AR/EN via `[lang]` segment

- Paths look like `/ar/...` and `/en/...` (dynamic segment `[lang]`) — SEO friendly.
- `proxy.ts` (middleware replacement in Next 16) redirects `/` → the default language (`ar`).
- Dictionaries live in `src/lib/i18n/dictionary.ts` (`Dictionary` type derived from `as const`).
- `dir` and `lang` are determined from the segment in the layout — `ar` = rtl, `en` = ltr.
- Default language: Arabic.

### 7. Theme — dark by default with toggle

- Dark is the default (class `dark` on `<html>`), with a light/dark toggle button.
- `ThemeProvider` in `src/components/theme/theme-provider.tsx` stores the preference in `localStorage`.
- All colors are CSS variables (`--background`, `--primary`, ...) — dark in `:root,.dark` and light in `:root[data-theme="light"]`.

### 8. Visual wow — top priority (Hero)

The audience is young, so the opening scenes are animation-rich, with components in `src/components/motion/`:

- `AnimatedTitle` — letters enter one after another with `blur + rotateX + y`, and a `text-metallic-shine` title that shimmers.
- `AuroraBackground` — animated aurora (red glow + purple/red drifting orbs + bottom mist).
- `ParticleField` — glowing particles flying upward with a pulse.
- `HeartbeatLine` — the heartbeat line as a repeating visual signature.
- Always `prefers-reduced-motion` is respected and everything is high performance (transform/opacity only).

### 9. Real Auth.js v5 with DB

- `next-auth@^5.0.0-beta.29` + `@auth/prisma-adapter` + Credentials provider + **JWT sessions** (no database sessions).
- Setup: `src/lib/auth.ts` (authOptions) · route handler `/api/auth/[...nextauth]/route.ts` · `src/types/next-auth.d.ts` (enriches `Session.user.id` and `role`).
- Password: **`bcryptjs`** (works CJS successfully with `next build` — unlike the original `bcrypt` which broke the build).
- Registration via **Server Action** (`registerAction` in `src/features/auth/actions.ts`) — no REST endpoint. The login/register forms call `signIn("credentials")` passing `callbackUrl`.
- `AUTH_SECRET` + `AUTH_TRUST_HOST=true` in `.env` (required for local dev).

### 10. Roles and protection

- `User.role`: `CUSTOMER` | `ADMIN`. Access chain:
  - Not logged in → `redirect` to `/{lang}/login?callbackUrl=...`
  - Customer → `redirect` to `/{lang}/account` (cannot see admin)
  - Admin → full dashboard.
- **Double protection:** `<admin>/layout.tsx` (redirect before any render) + `requireAdmin()` inside every Server Action (UI alone is never trusted).

### 11. Admin dashboard

- Routes: `/{lang}/admin` (overview: stats + latest orders + low stock) · `products` + `products/new` + `products/[id]` (CRUD) · `orders` + `orders/[id]` (status filters + details + status change + shipment management) · `users` (add/delete user + change role) · `coupons` (create/activate/delete coupons) · `settings` (shipping settings).
- All admin logic lives in `src/features/admin/` (actions · status · mappers) and `src/components/admin/` (product-form · product-actions · order-status-select · user-role-select · admin-nav · add-user-form · delete-user-button · shipment-form · coupon-form · coupon-actions · shipping-settings-form).
- Product form (create/edit) is a single unified form with bilingual (ar/en) fields + notes + art colors + dynamic variants + **discount percentage** (`discountPercent` 0–90) from which `compareAtPrice` is computed automatically (`round(base / (1 - pct/100))` where base = cheapest variant price). **Sale** = presence of `compareAtPrice` — "on sale" filter in the product list + badge on storefront cards + product page.
- `user-role-select` prevents a user from changing their own role.
- Add user: `createUser` (name/email/password/role — email lowercased via zod). Delete user: `deleteUser` (cannot delete self · their orders are detached `userId→null` in a transaction with the deletion).
- Shipping: `updateOrderStatus` on SHIPPED creates/updates `Shipment` (default carrier Bosta + shippedAt), on DELIVERED updates deliveredAt, on CANCELLED/REFUNDED deletes the shipment. `updateShipment` for manual carrier/tracking edits. The `shipment-form` is in the order details.
- **Coupons:** `Coupon` model (`code` unique · `discountType` PERCENT|FIXED · `discountValue` — percentage stored as-is and fixed amount in piasters ×100 · `minOrderAmount`/`maxDiscount` in piasters (nullable with `@default(0)`) · `maxUses`/`expiresAt`/`startsAt` nullable · `usedCount`). `createCoupon` (rejects duplicate code) · `toggleCoupon` · `deleteCoupon`. Actual validation in `createOrder` (server is source of truth) + `validateCoupon` for instant UI validation. **TypeScript pitfall:** `minOrderAmount` in the schema is `Int?` — any comparison needs `?? 0`.
- **Shipping settings:** `StoreSetting` model (key/value — `shipping_fee_qirsh` · `free_shipping_threshold_qirsh` · `default_carrier`). `updateShippingSettings` (upsert + `clearConfigCache` + revalidate). `getShippingConfig()` in `src/lib/store-config.ts` (reads DB with 5-second cache + fallback to defaults 5000/150000/Bosta) + public route `GET /api/shipping-config` (no-store) read by the checkout-form and cart-drawer. Free shipping when `subtotal - discount >= threshold`. The constants in `src/lib/checkout-config.ts` are now fallback only — do not edit them.

### 11b. Customer dashboard (account)

- Page `/{lang}/account` with tabs: **Overview / My Orders / My Addresses / My Wishlist** (client component `account-tabs` receiving serializable data).
- Customer order details: `/{lang}/account/orders/[id]` read-only — order items + delivery address + **shipment tracking** (carrier/tracking/status from `Shipment`).
- Wishlist: `WishlistItem` model (real) + `toggleWishlist` (server action, upsert/delete by state) + `WishlistButton` on product cards and the product page + `getWishlistIds` (React cache) to fetch ids for the storefront. Unregistered users don't see the buttons.
- **Node not Browser error:** `toLocaleDateString` doesn't accept `timeStyle` (browsers tolerate it, Node throws `Invalid option: timeStyle`) — use `toLocaleString` for date+time.

### 8b. Visual wow — second wave (animation milestone)

walid's request: **the customer must be visually amazed** — every storefront screen has a motion signature. **Implemented (wave 1):**

- `src/components/motion/reveal.tsx` — scroll-reveal system: `Reveal` (single element) + `RevealStagger`/`RevealItem` (staggered grids), `whileInView` once + respects `prefers-reduced-motion`. Used on the home page (bestsellers/collections/perks), catalog (cards/filter), and product page.
- `src/components/motion/marquee.tsx` — scrolling word strip (3 copies + `@keyframes marquee-x` translateX(–33.33%), pauses on hover) mounted right after the hero on the home page (words from `dict.home.ticker`).
- `src/components/motion/fly-to-cart.tsx` — **product flying to the cart:** `flyToCart(rect)` dispatches `CustomEvent("addictionx:fly-to-cart")`, and `<CartFlyProvider/>` (mounted in `[lang]/layout.tsx`) flies a light streak from the button to `[data-cart-target]` (cart icon in `cart-button`) and emits `addictionx:cart-bump` for the icon pulse. `AddToCartButton` triggers it from `getBoundingClientRect` + `whileTap` + success pulse.
- Product card: cinematic hover — neon glow (`mix-blend-screen`) + scanning light bar (`skew + translateX` 700ms) + glowing ring (`shadow red`) — all transform/opacity on CSS.
- `SectionHeading` is now `Reveal` + `text-metallic-shine` title + heartbeat line under it (brand signature).
- Main buttons: closing CTA pulses `heartbeat-pulse`; hero primary button has neon shadow.
- **Done (wave 2):** `PageTransition` (wraps `{children}` in the layout — smooth entry on every navigation using pathname as key) · `CursorGlow` (neon glow with spring memory following the cursor — Desktop + `pointer:fine` only, activated from the first mouse move to avoid synchronous setState in an effect) · `CountUp` + `StatsBand` (real DB number counters — product count/total reviews/highest rating — counting on appear) · wishlist pulse (heart explosion + rotation on activation).

**Governing rule (fixed):** Framer Motion only (client components) · transform/opacity only for performance · `prefers-reduced-motion` mandatory · every animation ≤ ~800ms · no animation without purpose (each one tells "luxury/excitement/push"). Don't touch admin interfaces except where useful.

- **Motion note:** `dict.*` is of type `as const` — any component accepting an array from the dictionary should type the prop as `readonly string[]`.

### 12. Next 16 rules / Server↔Client limits (real errors that occurred)

- `params` and `searchParams` are **async** (must `await params`).
- `proxy.ts` replaces middleware (Next 16).
- A Server component importing `motion` breaks SSR — solution `"use client"` or CSS hover instead.
- **`Functions cannot be passed directly to Client Components`** — you cannot pass functions/classes (such as lucide icons) from a Server Component to a Client Component. It actually happened in `admin/layout.tsx` (nav array containing icons). **Solution:** define the icons/structure inside the client component itself, pass only serializable data (text/paths).
- Base UI Button for polymorphism uses `render={<Link/>}` — not `asChild`.

### 13. Reading from DB and seeding

- Storefront reads from DB via `src/features/catalog/data/products-db.ts` (same interface as the `Product` mock — the mock stays only as a shape reference). Reading pages are `force-dynamic`.
- Seeds: `prisma/seed.ts` + `npm run db:seed` (via `tsx` devDep) → admin + 8 products + 3 collections + 100ml variant per product.
- Prices in DB are `Int` in piasters — conversion from EGP: `egpToQirsh` (×100) in `admin/actions.ts`, display via `formatPrice()` in `products.ts`.
- `gender` in DB: `MALE/FEMALE/UNISEX` — storefront lowercases it.

### 14. Product reviews (Customer Reviews)

- **Policy:** one review per product/user — `Review` upsert on the composite key `productId_userId`. The review is published (isApproved) only after admin approval, and a customer editing an approved review returns it to pending.
- **Logic:** `src/features/reviews/actions.ts` — `createReview` (upsert + zod; title optional ≤80, content 3–1000) · `moderateReview` (approve/reject) · `deleteReview`. Every approved change calls `recomputeProductStats` (recomputes `rating` = round(avg×10)/10 and `reviewsCount` from the **actual** approved reviews — the seed numbers were fake marketing numbers and collapse at the first approval, which is intentional).
- **UIs:** `star-input.tsx` (interactive StarInput + StarDisplay for display) · `review-form.tsx` (customer form — write/edit + success/error state) · `review-actions.tsx` (admin buttons: approve/reject/delete).
- **Integration:** product page `product/[slug]` — list of approved (with user.name) + `rating.toFixed(1)` + customer form if logged in (with `existing` to edit their review) or login link with callbackUrl · `admin/reviews` board (all reviews with product/user/pending badge + ReviewActions).
- **Dictionary keys:** `dict.reviews.*` (title/summary/noReviews/loginPrompt/writeTitle/editTitle/titlePlaceholder/contentPlaceholder/submit/update/success/reviewError/by/pendingBadge/reviewOn) + `dict.admin.reviews/approve/reject`.

### 15. Collections management from the dashboard

- **Model:** new `Collection` model (migration `collections`): `slug` unique + `nameAr/nameEn` + `sortOrder` + `isActive`. **No FK between it and Product** — `Product.collection` stays a text slug (deliberate decision so nothing that reads the slug breaks).
- **Seed fix:** it used `prisma.category` for collections — **switched to `prisma.collection`**.
- **Reading:** `getCollections()` in `products-db.ts` (DB, falls back to the static `collections` array in `products.ts` if the DB is empty — must `map` because the constant is `readonly`). Consumers: footer · home · catalog (filters) · product form (select shows `slug — name`).
- **Management:** `src/features/admin/collections-actions.ts` — `createCollection` (rejects duplicate slug via zod regex) · `deleteCollection` (blocks deletion if it has products — `NOT_EMPTY`). The `admin/collections` page shows every collection with **its perfumes' count and names** (aggregated by slug via Map). Form `collection-form.tsx` (slug derived automatically from the English name) + button `collection-delete.tsx`.
- **Dictionary keys:** `dict.admin.collections/addCollection/collectionNameAr/collectionNameEn/collectionSlug/collectionCreated/collectionCreateError/collectionDeleteError/collectionEmpty/collectionProducts/noCollections`.

### 15b. Social — real links (no Facebook)

- `siteConfig.social` in `src/config/site.ts`: **Instagram `https://www.instagram.com/addictionn_x`** and **TikTok `https://www.tiktok.com/@addiction_x8`** — **facebook removed permanently**. The footer shows Instagram + TikTok only.

### 16. Notes pyramid on the product page

- The notes section in `product/[slug]` became **a pyramid shape**: base (widest) at the bottom, then heart, then top notes (narrowest) at the top — a light pyramid instead of equal columns. The collection name is read from `getCollections()` dynamically (no hardcoded rush/noir/gold).

### 17. Addresses — full CRUD from the customer account

- `Address` model already existed; added `createAddress`/`updateAddress`/`deleteAddress` in `features/account/actions.ts` (zod + ownership via `userId` — `updateMany/deleteMany` with a `userId` condition so others' addresses can't be modified, and `isDefault` is stripped from the rest in the same transaction).
- UI: `account/components/address-manager.tsx` (list + add/edit/delete/default badge) + `address-form.tsx` (same fields as checkout + optional district/building/apartment/landmark, empty→`null`). Starts from the "My Addresses" tab in `account-tabs`.
- `dict.account.*` keys (addAddress/addressSave/addressEdit/addressDelete/noAddresses/defaultAddress/setAsDefault/addressSaved/addressError/field*). Live check: create → view → delete.

### 17b. Order cancellation (customer)

- `cancelOrder` in `features/account/actions.ts`: **only for the order owner and only while PENDING** — otherwise `NOT_CANCELLABLE`. A transaction that mirrors `createOrder`: status→CANCELLED + delete shipment + `stock: increment(quantity)` for every `OrderItem.variantId`.
- **Admin touch:** `updateOrderStatus` on CANCELLED/REFUNDED **now restores stock** (it was missing — an admin canceling an order lost the stock).
- Button `cancel-order-button.tsx` appears in order details (account/orders/[id]) only when PENDING. Keys: cancelOrder/cancelConfirm/orderCancelled/cancelError/cancelUnavailable. Live check: PENDING order → cancel → CANCELLED + stock returned (8→10).

### 17c. Newsletter

- `NewsletterEntry` model exists; added `features/newsletter/actions.ts`: `subscribeNewsletter` (zod email + lowercase upsert — reactivates if disabled, no login required) + `toggleNewsletterEntry`/`deleteNewsletterEntry` (protected by requireAdmin).
- Storefront: **standalone section above the footer** (`layout/newsletter-section.tsx` — not inside the footer, so it doesn't break the footer columns) — title + inline form in `layout/newsletter-form.tsx` — `dict.newsletter.*` AR/EN.
- Admin: `admin/newsletter` (email/date/status table + activate/deactivate/delete) + nav entry. Keys: `dict.admin.newsletter/newsletterEmpty/newsletterActive/newsletterInactive`.

### 18. Cinematic hero — interactive video scrubbed by the mouse

- **Fixed decision:** the hero stays **black permanently** (`bg-[#0a0a0a]`) independent of the theme — a void video cannot adapt to a light background, and the shift to black afterwards is intentional and dramatic. The rest of the page follows the theme.
- **Assets:** `public/left.mp4` (front→left) and `public/right.mp4` (front→right) — **they start from literally the same front frame, no synchronization at all**.
- **Principle:** the video is not played on desktop — **sprite filmstrip technique** (like luxury perfume sites): we extract all video frames once into a grid image `public/sprites/left.jpg` and `right.jpg` (6400×2160 = 10 columns × 6 rows = 60 cells × 640×360), and motion becomes just `background-position` on two plates (`background-size: 1000% 600%`) inside `raf` — **zero seek and instant response** (`video.currentTime` seek was asynchronous and showed "unnatural slowness").
- **Cursor mapping:** the whole screen width is a rotation zone — `x < vw/2` → left-sprite, `x > vw/2` → right-sprite, **no deadZone** (the central region used to not respond and felt slow). Progressive movement `clamp01` → frame `round(clamp01 × (FRAMES-1))`. Reverse works automatically: moving the cursor back toward the center returns to the front frame.
- **Empty gap at the end of the strip:** the videos actually have **only 59 frames (0..58)** — cell 59 in the grid is empty (black). Therefore `FRAMES = 59` and all clamp/bob is bounded by it — at the end of the video it stops on the last real frame **without flipping the screen to black**.
- **Alignment when switching sides:** the right plate `transform: translateX(-5px)` adjusts a small difference between left/right frames so they match — no content jump when switching.
- **Mobile** (`pointer: coarse` or < 1024px): alternating auto-play left/right via `ended` (muted+playsInline required) — **no hint** (walid decided: interaction is detected automatically, no hint and no nudges).
- **Auto-detection:** listens to `window pointermove` — the first move activates scrubbing after 300ms, and the rAF keeps running. **Automatic GSAP bob** after ~2.2s idle: `frame 0 → FRAMES-1 → 0` alternating between sides (`power1.inOut`, continuous updates via onUpdate) — **any cursor movement cancels it immediately** and returns to manual drawing. gsap in `dependencies` (production import).
- **Smooth exit:** scroll fade from 25% to 90% of the viewport height — `opacity` + `visibility:hidden` permanently above 90%.
- **Mobile video:** the mobile video starts with a visible frame — alternating automatically. `prefers-reduced-motion`: static state, no rAF, no gsap — just the front frame.
- **Component structure** (`src/components/motion/hero-video-scrub.tsx`): `"use client"` — refs for both plates/videos + always-on `raf` + `lastMoveRef` counters for idle. Images are loaded and decoded (`img.decode()`) before reveal via `ready` state (0.8s fade-in so the background frame doesn't flash). The plates are `aria-hidden` + `pointer-events-none`.
- **Layers (bottom→top):** 0 video container `fixed inset-0` (aria-hidden) · 5 black gradient for contrast without mix-blend · 8 `ParticleField` reduced (count=10 + blend **screen** + opacityScale 0.3) · 20 text/buttons · 30 header · 90 `CursorGlow`.
- **No mix-blend:** the text above the video and the header are kept readable with a two-layer shadow `drop-shadow(0 1px 2px rgb(0 0 0/0.6)) drop-shadow(0 4px 24px rgb(0 0 0/0.45))` — **`mix-blend-mode: exclusion` is forbidden** because it flips red (oklch(0.6 0.22 22)) to cyan and breaks the identity.
- **`PageTransition` became opacity-only** (no y/transform/filter/will-change except opacity) — any transform on a parent element creates a containing block that makes `position:fixed` inside it scroll with the page instead of staying fixed. It's a general fix affecting all pages — low entropy.
- **Header:** transparent over the hero with class `header-over-hero` added by `HeaderScroll` (home page only and the first 80% of the screen) — no border/blur, white text + drop-shadow. After scrolling or on any other page it resumes its normal blurred background.
- **`CursorGlow`:** dims to 0.25 inside the hero via `--cursor-glow-opacity` (bound by `HeaderScroll` on `<html>`) so two glows don't compete on the same cursor.
- **`proxy.ts`**: added `mp4|webm|gif` to the static regex — before that `/left.mp4` was returning 307 to `/ar/left.mp4`.
- **`gsap` moved to dependencies** (was devDependencies) — any production import of it would fail on Vercel because devDeps are not installed.
- **Dictionary keys:** `dict.hero.autoRotate` (auto rotate) + `dict.hero.dragToRotate` (move the mouse).
- **Final wave (completed hero):**
  - **Reverse rotation:** works naturally via `background-position` — moving the cursor back toward the center = front frame (no separate library).
  - **Smooth exit:** `fade visibility` from 25%→90% of the screen while scrolling.
  - **Automatic bob (GSAP):** after ~2.2s idle it rotates the frame to the end of the clip then **reverses** to the front frame (alternating sides) — any cursor move cancels it immediately and draws manually. gsap in `dependencies` (production import).
  - **No pointer hint and no nudges** — interaction is detected automatically from the first mouse move (walid's final decision).

### 18b. Newsletter inside the footer (final decision)

- **Inside the footer block above all columns** (above Instagram/TikTok etc.) — `footer.tsx` contains border-b + title/subtitle + `NewsletterForm` before the four-column grid. **`layout/newsletter-section.tsx` deleted** and `[lang]/layout.tsx` no longer imports it. (It used to be a standalone section above the footer — walid's decision: inside the block.)

### 18c2. Collections carousel (product-carousel)

- `features/catalog/components/product-carousel.tsx` — driven from `page.tsx` with one product per collection (prefers `image`) and forces local `.image` from `/slider/{rush,noir,gold}.png` (author product fallback).
- center/left/right roles (no back with 3 items) · **CSS transitions** (intentional exception to the Framer Motion rule for role performance — documented) · 650ms · blur on side roles · touch swipe (ignores vertical drag) · RTL-aware keyboard · IntersectionObserver pauses the animation off-screen.
- **Image format:** 1024×1536 transparent PNG — `public/slider/rush.png` · `noir.png` · `gold.png` (renamed from `1 (N).png`).
- **Product images:** every product renders the real transparent bottle PNG at `/uploads/prodact.png` (seeded into `ProductImage` — primary per product; `ProductArt` shows it on all product cards). The carousel keeps its own `/slider/*.png` visuals (walid's decision — slider left untouched).
- Dictionary keys: `dict.home.carousel*` (title/subtitle/explore/prev/next/item/of).

### 18d. Hero footage — WAVE 12 (final): direct video playback, no strips

- **Wave 12 (walid's decision):** the hero no longer scrubs a sprite filmstrip at all — it **plays the footage directly** as a cinematic video. `src/components/motion/hero-video.tsx` (`HeroVideo`, renamed from `hero-video-scrub.tsx`): `right.mp4` (forward turn) and `left.mp4` (reversed turn) **alternate on `ended`** so the bottle rotates right→left→right forever with no seam. The old canvas + `background-position` plates are deleted. All viewports use the same playback (no desktop/mobile split).
- **Why strips were abandoned (from the code comments):** `public/360/perfume-360.mp4` is NOT a perfectly closed 360° loop (first/last frames differ → the left↔right mirror `frame 59 ≈ frame 0` would visibly snap at the screen center), and its first frame is a bright flash (~luma 136 vs ~12) that would blink white on loops. Both `right.mp4`/`left.mp4` are generated from `perfume-360.mp4` **with the bright first frame trimmed**.
- **Source:** `public/360/perfume-360.mp4` (1280×720 · 24fps · ~10s, full turn) → derived `public/right.mp4` (forward) + `public/left.mp4` (reversed).
- **Regeneration (video → reversed/normal copies, trimming the first frame):**
  - forward: `ffmpeg -i perfume-360.mp4 -vf "trim=start_frame=1" right.mp4`
  - reversed: `ffmpeg -i perfume-360.mp4 -vf "trim=start_frame=1,reverse" left.mp4`

### 18d2. Hero footage — WAVE 13: new `public/hero` source + mouse-follow steering

- **Wave 13 (walid's direction):** new turntable footage `public/hero/hero.mp4` (1280×720 · 24fps · ~10s, full 360° turn, **natural direction = normal playback**) replaces the old pair — **old assets deleted entirely**: `right.mp4`, `left.mp4`, `public/360/perfume-360.mp4`, and `public/uploads/360/` (its only survivor, the reduced-motion poster, moved to `public/hero/frame-01.png`).
- **Assets:** `public/hero/hero.mp4` (normal/forward) + derived `public/hero/hero-left.mp4` (**the REVERSED copy**). Regenerate the reverse with `ffmpeg -i hero.mp4 -vf "trim=start_frame=1,reverse" hero-left.mp4`. `TurntableVideo` plays `/hero/hero.mp4` ↔ `/hero/hero-left.mp4`; the hero poster is `/hero/frame-01.png`.
- **Direction contract (walid's words):** auto = the video rotates its **normal way**; moving the mouse **RIGHT reverses the video** (plays `hero-left.mp4`), moving LEFT plays the normal copy. The `interactive` steered switch uses a **mirrored-time swap** (`duration − currentTime`) so the bottle holds its exact angle and just reverses — no snap.
- **WAVE 14 — direction correction (walid's report «يمين يتحرك يمين، شمال يتحرك شمال»):** the wave-13 contract had the mapping **inverted**. Measured with ffmpeg cross-correlation of consecutive frames (self-tested): `hero.mp4` (natural playback) drifts the bottle surface **RIGHTWARD** (+361px over the clip) and `hero-left.mp4` (reversed) drifts **LEFTWARD** (−357px, exact mirror). So **mouse RIGHT now plays `hero.mp4` (the NORMAL copy = rightward turn) and mouse LEFT plays `hero-left.mp4` (the REVERSED copy = leftward turn)** — the refs/names line up: right movement → `videoRightRef` (`hero.mp4`). Idle = unchanged: no hover → the two copies alternate on `ended` and the bottle keeps rotating 360° forever.
- **WAVE 15 — flexible rotation (walid's report «الدوران مش مرن»):** the direction was right but the turn only played at the video's fixed speed (constant 1×), so it never followed the hand. Now the rotation **SPEED tracks the cursor velocity** via `playbackRate` eased by an always-on rAF loop (`curRate → targetRate`): `rate = clamp(vel(px/ms) × RATE_PER_VEL, MIN 0.1, MAX 2.2)` — fast mouse = fast turn, slow = slow, stopped = the turn eases out and stops. Direction switch = mirrored-time (`duration − currentTime`), no snap. `activeRef` now tracks the shown video explicitly (replaces display-sniffing). Constants at the top of `turntable-video.tsx`: `MAX_RATE` · `MIN_RATE` · `RATE_PER_VEL` (≈1× at ~0.6px/ms) · `IDLE_STOP_MS`.
- **WAVE 16 — rotation stands while hovering (walid's report «الدوران ديما شغال 360 سواء hover أو لا»):** the auto-spin used to resume ~1.2s (`IDLE_AUTO_MS`) after the mouse stopped — even while the cursor was STILL over the hero — so the bottle never stood still for the hand. Now the **auto 360° runs ONLY when the cursor is outside the hero**: while hovering, the turn is bound to the hand (velocity-based `playbackRate`, direction switch), and ~250ms of stillness (`IDLE_STOP_MS`) eases the turn out so the bottle **STANDS at its exact angle** (no auto-rotation under the cursor). Re-entering/leaving keeps the angle continuous (the spin resumes from the standing point, no snap). Micro-jitter is absorbed by an accumulated-dx threshold (3px) so small trembles don't spin the bottle; the rAF ease is now asymmetric (fast stop 0.3 → the hand takes over, smooth start 0.18). `IDLE_AUTO_MS` and `autoTimerRef` deleted.
- **Idle = auto 360°:** while the cursor is outside the hero (or stopped ~1.2s) the two videos alternate on `ended` (normal ↔ reversed) — a continuous no-seam ping-pong, one full 360° turn each way, starting from the normal copy.
- **Robust reveal:** the container fades in on the video's `loadeddata`/`playing` (plus a 250ms fallback), and the hero ships a **`poster` (`/hero/frame-01.png`)** so it is never a blank black void — before load, on failure, or under `prefers-reduced-motion` (static front frame).
- The showcase stays non-interactive (auto ping-pong only). `proxy.ts` already serves any `.mp4` — no config change needed.

### 18e. Product 360° turntable — three.js / R3F (wave 11)

> **RETIRED (wave 12b):** walid's direction = NO 3D. The WebGL turntable below was removed (component + `three`/R3F deps + `strip.jpg`). The showcase now plays the real turntable video via the shared `TurntableVideo`. Kept as reference:

- **Stack:** `three` + `@react-three/fiber` + `@react-three/drei` added to dependencies (wave 11, walid's direction). The showcase bottle is no longer 12 crossfading `<img>`s — it is a **WebGL canvas**.
- **Asset:** `public/uploads/360/strip.jpg` — one 6×6 grid (36 cells of a full rotation, `fps=3.6` from the turntable video). Loaded **once** as a single GPU texture.
- **Component:** `src/components/motion/product-360.tsx` — a plane with a custom `ShaderMaterial`:
  - `NearestFilter`, no mipmaps → the shader samples the CURRENT cell and crossfades to the NEXT inside the fragment shader (fractional `uCell`) — buttery turn, zero DOM img swapping.
  - Drive: scroll story (`progressRef`, a plain ref mirrored from `scrollYProgress` every change — **no React re-render per frame**) walks the base angle 0→35, plus a **persistent pointer-drag offset** (`dragRef`, one full turn per container width, `touch-action:none`, grab/grabbing cursor) — the customer can spin the bottle by hand.
  - `mix-blend-screen` on the container makes the dark studio backdrop vanish (same visual language as the old img turn).
  - **`prefers-reduced-motion` or no WebGL → static poster image** (`frame-01.png`).
- **Wiring:** `rotating-showcase.tsx` imports it via **`dynamic(..., { ssr: false })`** so three.js stays **out of the initial home bundle** (loaded only when the LazyMount showcase mounts). The old `TurnView`/`TURN_360`/`turnPoints` machinery was deleted.
- **Shader transparency trick:** frames are dark-studio shots; the black bg is removed by screen-blending the canvas, not by alpha keying — red stays red (no cyan flip, consistent with the mix-blend rule).

### 19. Email notifications (Resend) — for every update

- `src/lib/email.ts`: `sendEmail` wrapper (Resend) ← works **without keys** (just logs, never breaks the flow). Inline-styled templates: `orderConfirmationEmail` (customer) + `adminNewOrderEmail` (admin `ADMIN_EMAIL`/`siteConfig.adminEmail`) + `orderStatusEmail` (status change) + `orderCancelledEmail` + `shippingInfoEmail`.
- **Integration points:** `createOrder` (after a successful transaction — confirmation email to customer + new-order email to admin) · `updateOrderStatus` (status-change notification to customer) · `updateShipment` (tracking data) · `cancelOrder` (cancellation notification to customer).
- **Rule:** sending via `Promise.allSettled` — email failure **never fails** order creation/update.
- `.env` needed: `RESEND_API_KEY` (needed from walid; without it it only logs and does not send) + optional `EMAIL_FROM`/`ADMIN_EMAIL`.

### 20. Google sign-in (OAuth)

- `google` provider added in `src/lib/auth.ts` (next to Credentials) with `allowDangerousEmailAccountLinking: true` (ensures a Google account links to an existing email in DB when they match). PrismaAdapter stores the account/session.
- UI: «Continue with Google» button in `auth-form.tsx` under the «or» divider — `signIn("google", { callbackUrl })`. Keys: `dict.account.continueWithGoogle/or/googleError` + hand-drawn SVG icon (no library).
- `.env`: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — **needed from walid** (Google Cloud Console → OAuth Client). Without them the button shows but login is rejected.

### 21. Manual order from admin + low-stock alert

- **`createManualOrder`** in `src/features/admin/actions.ts`: for phone/WhatsApp orders (COD) — prices strictly from the DB (mirror of createOrder) · atomic stock decrement inside a transaction · free shipping above the threshold like the storefront · **no Account for guests**: `Address.userId` is required in Prisma so no address is created — name/phone/governorate/address are stored in `Order.notes` (shown in order details for admin+account) · admin notification with the new-order template.
- Page `/[lang]/admin/orders/new` + client form `manual-order-form.tsx` (products+variant+price+stock, dynamic lines, live total, redirect to details) + «New manual order» button in the orders header.
- **`notifyLowStock(variantIds, threshold=5)`** in `src/lib/email.ts` — dynamic import for prisma; checks whether any variant reached `stock<=5` and sends an admin email `lowStockEmail`. Called after `createOrder` and after `createManualOrder` within `Promise.allSettled`.
- Dictionary keys: `dict.admin.newOrder/createOrder/selectProduct/selectSize/addLine/orderLines/orderCreated/orderCreateError/emptyLines/orderTotal` AR/EN.

---

## Project structure (Feature-Based)

```
src/
├─ app/                      # routing only — no business logic
│  ├─ [lang]/                # dynamic segment for translation (/ar , /en)
│  │  ├─ layout.tsx          # real root: fonts · ThemeProvider · dir/lang · meta
│  │  ├─ page.tsx            # home (Hero + sections)
│  │  ├─ catalog/            # catalog + filtering
│  │  ├─ product/[slug]/     # product page
│  │  ├─ checkout/           # checkout
│  │  ├─ login/ · register/  # Auth forms
│  │  ├─ account/            # customer dashboard: tabs (orders/addresses/wishlist) + account/orders/[id] (details + tracking)
│  │  └─ admin/              # control panel (protected layout + dashboard + products/products/new/products/[id] + orders/orders/[id] + reviews + collections + coupons + users + settings)
│  ├─ api/auth/[...nextauth]/ # Auth.js route handler
│  └─ globals.css
│
├─ features/                 # ← most of the code lives here
│  ├─ catalog/               # products (data: mock reference + db: getProducts/getProductBySlug/getCollections) · product-card · product-art · add-to-cart
│  ├─ cart/                  # cart-button · cart-drawer (reads shipping config from /api/shipping-config)
│  ├─ checkout/              # checkout-form (coupon + dynamic summary) · actions (createOrder + validateCoupon)
│  ├─ account/               # actions (toggleWishlist/removeWishlistItem + createAddress/updateAddress/deleteAddress + cancelOrder) · data (getWishlistIds) · components (account-tabs · address-manager · address-form · cancel-order-button)
│  ├─ auth/                  # actions (register) · components (auth-form)
│  ├─ reviews/               # actions (createReview/moderateReview/deleteReview + recomputeProductStats) · components (star-input+StarDisplay · review-form)
│  ├─ newsletter/            # actions (subscribeNewsletter public + toggle/delete protected)
│  └─ admin/                 # actions (CRUD/statuses/roles/users/shipping/coupons/settings) · collections-actions (createCollection/deleteCollection) · status · mappers
│
├─ components/
│  ├─ ui/                    # shadcn primitives
│  ├─ motion/                # animated-title · aurora-background · particle-field · heartbeat-line · fade-in · reveal (Reveal/Stagger) · marquee · fly-to-cart · page-transition (opacity-only!) · cursor-glow · count-up · stats-band · hero-video (wave 12 playback) · product-360 (wave 11 R3F)
│  ├─ theme/                 # ThemeProvider · ThemeToggle
│  ├─ layout/                # header (+ header-scroll for the transparent hero state) · footer (collections from DB + Insta/TikTok links only) · newsletter-section (above the footer) · newsletter-form · section-heading · language-switcher
│  ├─ wishlist-button.tsx    # wishlist button (client) — product cards + product page
│  └─ admin/                 # product-form · product-actions · order-status-select · user-role-select · admin-nav · add-user-form · delete-user-button · shipment-form · coupon-form · coupon-actions · shipping-settings-form · review-actions · collection-form · collection-delete · newsletter-actions
│
├─ lib/                      # prisma · auth · i18n · utils
├─ stores/                   # cart-store (Zustand + persist)
└─ config/                   # site.ts
```

**Rules:**

- `app/` is for routing only. No business logic inside page files.
- Features must not import from other features' `repositories` — communication goes through `services`.
- **Server Components by default.** `"use client"` only when actually needed (state · event · browser API).
- Every motion component is a Client Component called from Server Components.
- No `any`. No duplicated code. Small components. Clear names.

---

## Current roadmap (session 2026-08-07 — walid's decisions)

### Urgent priority (before any other work)

1. **Upload the project to GitHub** — **[x] done** (repo `Adham-Kishawi/addictionx-`, branch `main`).
   - `.env` is excluded by `.gitignore` — never uploaded.
2. **Complete the admin dashboard fully** (walid's decision: «the admin dashboard must be complete and working»):
   - **Real product images — partially done:** every product now renders the real upload `/uploads/prodact.png` (seeded in `ProductImage`). Still pending: uploading/replacing a **per-product** image from the admin dashboard (the shared image is temporary until each product has its own).
   - Add **fully editable product descriptions** (currently the ar/en fields exist in the form — review and improve the display).
   - **Edit the slider** from the admin dashboard (currently `page.tsx` forces static `/slider/{rush,noir,gold}.png` — must become manageable).
   - Overall usability improvement of the dashboard (user experience).

### Still pending from walid (external data)

- `RESEND_API_KEY` (Resend — resend.com → API Keys → `re_...`) — email works without keys (logging only) until added.
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` (console.cloud.google.com → APIs & Services → Credentials → OAuth client ID → **Web application** → redirect URI: `http://localhost:3100/api/auth/callback/google`).
- Cloudinary (the 3rd) **canceled** — not important per walid. Images will be managed from the admin dashboard itself.

- [x] Resolved brief conflicts and installed the stack (npm instead of pnpm — npmmirror source)
- [x] Wrote `CLAUDE.md`
- [x] Setup: Next.js 16 · Tailwind v4 · shadcn/ui (Base UI) · ESLint flat config / Prettier / Husky + lint-staged · `src/` feature-based structure
- [x] Database Schema (Prisma) — models ready and client generated (`prisma/schema.prisma`)
- [x] Visual identity: **ADDICTIONX** — black + neon red + metallic silver + Heartbeat line
- [x] i18n: `[lang]` segment + AR/EN dictionaries + LanguageSwitcher + `proxy.ts` (tested: `/`→307→`/ar`, `/en` works with `dir=ltr`)
- [x] Theme: `ThemeProvider` + `ThemeToggle` (dark default + light palette)
- [x] Home page: Cinematic Hero (Aurora + Particles + AnimatedTitle + Heartbeat) + bestsellers + collections + experience + CTA
- [x] Catalog: filtering (collection/type) + sorting (price/rating) via `searchParams`
- [x] Product page: image + price + notes (top/heart/base) + quantity + add to cart
- [x] Cart: Zustand `cart-store` (with persist) + sliding CartDrawer + header counter
- [x] Checkout: RHF + Zod form (shipping/payment) + order summary + success message
- [x] **Real Auth.js v5:** Credentials + PrismaAdapter + JWT sessions · `bcryptjs` · `registerAction` (Server Action) · `signIn("credentials")` with `callbackUrl` · sign-out button
- [x] **Real user account:** protection (redirect + callbackUrl) · user data and orders from DB · admin panel link for admins
- [x] **Full DB wiring:** local PostgreSQL (`luxury_perfume`) · real `DATABASE_URL` · migrations (`init` + storefront fields) · storefront reads via `products-db.ts` (`force-dynamic` pages)
- [x] **Seeds:** `prisma/seed.ts` + `npm run db:seed` (tsx) → admin + 8 products + 3 collections + 100ml variant
- [x] **Admin dashboard:** protected layout · dashboard (stats/latest orders/low stock) · product CRUD (unified create/edit form) · orders (filters/details/status change) · users (role change) · all Server Actions protected with `requireAdmin()`
- [x] Verification: `next build` + `lint` (0 issues) + clean `type-check` + live test (register/login/roles/pages 200) — dev on port 3100
- [x] **Checkout wired to orders:** the cart carries a full snapshot (name/price/size/art) — the drawer and summary read from it not from mock · `createOrder` (price from DB not from client · Address + Order + items in one transaction · atomic stock decrement with full failure on shortage · order number `ADDX-...`) · requires login (redirect with callbackUrl) · success screen with the order number
- [x] Live order verification: a test order was created and appeared in admin/account, stock was deducted, STOCK path works — then full cleanup of test data
- [x] **Customer dashboard:** account page with tabs (Overview/My Orders/My Addresses/My Wishlist) + order details (items + address + shipment tracking) + real wishlist (WishlistItem + toggle + button on cards and product page)
- [x] **Expanded admin permissions:** add user (createUser) + delete user (deleteUser with order detachment) + shipment tracking (Shipment auto-created on SHIPPED + `shipment-form` for carrier/tracking in order details)
- [x] **Shipping settings from DB:** `StoreSetting` + `getShippingConfig` (5s cache + fallback) + `GET /api/shipping-config` + `admin/settings` form (`updateShippingSettings`) — the checkout and cart-drawer read the real settings (free shipping above threshold, carrier visible in tracking)
- [x] **Discount coupons:** `Coupon` model + admin management (`admin/coupons` — create PERCENT/FIXED, activate/deactivate, delete) + `validateCoupon` (instant check) + `createOrder` applies the discount (percentage capped at `maxDiscount` or fixed ≤ cart, requiring `minOrderAmount`/`maxUses`/`expiresAt`) and records it on the order and updates `usedCount` in the transaction
- [x] **Sale management:** `discountPercent` in the product form (0–90) computes `compareAtPrice` automatically + "on sale" filter in the product list + sale badge on storefront cards
- [x] Verification: clean `type-check` + `lint` + `build` · live test 3100 (the API reflects DB settings after edit · the coupons page shows seeded coupons · the sale filter shows only discounted products · the discount badge appears in the catalog)
- [x] **Visual wow — wave 1:** unified scroll-reveal system (`Reveal/Stagger`) on home/catalog/product page · marquee strip after the hero · **product flying to cart** (fly-to-cart + icon pulse) · cinematic product-card hover (glow + scanning light) · section headings metallic-shine + heartbeat · pulsing CTA — verified: type-check + lint + build + live pages 200
- [x] **Visual wow — wave 2:** `PageTransition` in the layout (smooth entry on every navigation) · `CursorGlow` (glow following the cursor — Desktop only) · `CountUp` + `StatsBand` (real DB number counters on home) · wishlist pulse (heart explosion) — verified: type-check + lint + build + live pages 200
- [x] **Footer/social:** `siteConfig.social` = real links **Instagram (addictionn_x) + TikTok (addiction_x8)** only — **facebook removed permanently**; the footer shows both links (and its collections come from DB).
- [x] **Product reviews:** `model Review` existed in the schema — the full layer was added: `features/reviews/actions.ts` (createReview upsert on `productId_userId` + moderateReview + deleteReview + recomputeProductStats) · `admin/reviews` (all reviews + approve/reject/delete) · product page (approved list + customer form to edit their review or login link) · `dict.reviews.*` + admin keys — live check: review → approve → recompute (4.9/214 → 5.0/1 real) → appears on the storefront.
- [x] **Collections management:** new `Collection` model (migration `collections` — **no FK with Product**, the slug is textual) · the collections seed switched from `prisma.category` to `prisma.collection` · `getCollections()` falls back to the constant + used in footer/home/catalog/product form (select `slug — name`) · `admin/collections` (add collection + deletion protected from products + **shows each collection's perfumes with count**) — live check: 3 collections with their perfume counts.
- [x] **Notes pyramid:** the notes section on the product page became a pyramid (base/heart/top) instead of equal columns + the collection name is read dynamically.
- [x] **Comprehensive verification (this round):** clean `type-check` · clean `eslint` on all changed files · successful `next build` with all new routes (reviews/collections) · live test 3100: home/catalog/product 200 + admin (reviews/collections) 200 with admin session + anonymous→307 + AR dictionary reviews done.
- [x] **Customer addresses — full CRUD:** add/edit/delete + default from the customer account (`address-manager` + `address-form`) — live check: create → view → delete.
- [x] **Order cancellation from customer:** `cancelOrder` (PENDING only + ownership + stock restore) + button in order details + **admin also now restores stock on CANCELLED/REFUNDED** — live check: canceled a test order and stock returned 8→10.
- [x] **Newsletter:** subscribe from the footer (no login, upsert) + `admin/newsletter` (list/activate/deactivate/delete) — live check: added a subscriber → appears in admin → cleanup. **Then final decision:** newsletter inside the footer block above the columns and `newsletter-section.tsx` deleted.
- [x] **Completed hero (final wave):** reverse rotation (double scrub) + smooth fade-out on scroll + **automatic GSAP bob** after 3.5s idle (rotate+reverse, canceled by any cursor move) + cursor hint — verified: tsc + eslint + build + live 200 with no console errors.
- [x] **Hero — sprite filmstrip (final final wave):** replaced `video.currentTime` seek (was unnaturally slow) with `background-position` over `public/sprites/{left,right}.jpg` strips (10×6) — instant motion + automatic detection (no hint) + no deadZone + `FRAMES=59` (no black gap at the end of the strip) + right plate `translateX(-5px)` to match the two sides + alternating mobile video without hint. Verified: clean tsc + clean eslint + successful build + live 200.
- [x] **Collections carousel:** `product-carousel` (center/left/right roles with 650ms CSS transitions + swipe + RTL keyboard + IntersectionObserver) with `/slider/{rush,noir,gold}.png` images — verified: tsc + eslint + build + live 200.
- [x] **Email notifications (Resend):** `src/lib/email.ts` (works without keys) + integration in createOrder (customer/admin) + updateOrderStatus + updateShipment + cancelOrder — verified: clean tsc + eslint + build.
- [x] **Google sign-in:** provider + button in auth-form + dictionary keys — verified: clean tsc + eslint + build. **Pending:** `AUTH_GOOGLE_ID/SECRET` keys from walid.
- [x] **Manual order from admin + low-stock notification:** `createManualOrder` (guest details in `Order.notes`) + `orders/new` page/form + button in orders header + `notifyLowStock` (admin email when stock ≤5) called after any order — verified: tsc + eslint + build + live 200.
- [x] **Real product images:** all 8 products use the real transparent bottle PNG (`/uploads/prodact.png`) — seeded into `ProductImage` (primary per product) + added to the static `products.ts` data; the upload route stores files in `public/uploads/`. Slider visuals kept original (`/slider/*.png`). Verified: 8/8 products have the image in the DB + clean tsc + eslint + build.
- [x] **Complete comment translation:** every Arabic code comment converted to English (`src/` + `prisma/schema.prisma` + `prisma/seed.ts`) — scan confirms zero Arabic comments remain in code (docs `README.md`/`REPORT` left as-is).
- [x] **Branded loading screen:** `src/app/[lang]/loading.tsx` — covers every page under `/[lang]` (home/catalog/product/account/admin). Next.js shows it automatically while server components fetch DB data (slow query or network drop). Skeleton grid mirrors the real product cards + Heartbeat logo. No `error.tsx`/`not-found.tsx` yet — roadmap.
- [x] **Hero → canvas (memory + aspect + frames fix):** `hero-video-scrub.tsx` rewritten from `background-position` plates (`backgroundSize: 1000% 600%` forced the browser to rasterize ~500MB/plate — ~1GB both — on desktop AND mobile) to a single `<canvas>` that decodes each sprite ONCE at native 6400×2160 and crops one frame per draw with manual cover-fit ✓ no distortion on 16:10/3:2/21:9 (fix review 0.1 + 0.2). Canvas is `hidden lg:block` — mobile never pays the desktop cost. `FRAMES = { left: 60, right: 59 }` (measured via ffprobe: right.mp4 has 59 frames) — fixes the black frame at the right edge (review 0.3). Idle bob now tweens a single `bobTargetRef` object and `cancelBob` actually kills it (`gsap.killTweensOf(bobTargetRef.current)`) — fixes the two-writers jitter (review 2.1). `sizeCanvas` caps DPR at 2.
- [x] **Neon (Postgres cloud) wired:** `DATABASE_URL` now points to the Neon pooler URL — schema pushed + seeded on the cloud DB (admin + 8 products + 3 collections + 8 variants). `package.json` added `postinstall: prisma generate` (required for the Vercel build).
- [x] **Vercel live (200 OK):** project `addictionx` (org `adham-kishawis-projects`). Env vars added to prod: `DATABASE_URL` (Neon pooler) · `AUTH_SECRET` · `AUTH_TRUST_HOST=true` · `ADMIN_EMAIL=addictionxshop@gmail.com`. `vercel redeploy` on the latest deployment fixes the previous 500. Site: `https://addictionx.vercel.app` (title «ADDICTIONX | Feel the Rush»).
- [x] **Shop ≠ Collections + search + pagination:** `Collection`→ its own hub `/{lang}/collections` (6 collection cards with cover) + per-collection `/{lang}/collections/[slug]` (only that collection's products, `PER_PAGE=10`) · `Shop`→`/{lang}/catalog` (all products, same pagination + **real search** via `q` filter on nameAr/nameEn through `search-box.tsx` — empty state when nothing matches, search title + clear in the header). `pagination.tsx` preserves the full query string and only swaps `page` (RTL-aware arrows). Nav: `header.tsx` links Shop→catalog and Collection→collections. Verified live: `q=oud`→2 results, `coll/noir`→its products, hub→6 links.
- [x] **Mobile navigation drawer:** `src/components/layout/mobile-nav.tsx` (client — hamburger toggles a slide-in drawer with the full nav + body scroll lock; `lg:hidden`). Desktop header nav unchanged. `SearchBox` visible in header on all breakpoints.
- [x] **deleteProduct is order-safe:** `src/features/admin/actions.ts` — `deleteProduct` counts `OrderItem` references and refuses deletion with `{ error: "HAS_ORDERS" }` when the product has any order lines (soft-manage it via hide/active instead). `product-actions.tsx` surfaces the message (`dict.admin.productHasOrders` AR/EN) instead of a silent refresh.
- [x] **Error pages:** `src/app/[lang]/not-found.tsx` (branded 404 + HeartbeatLine + back-home) · `src/app/[lang]/error.tsx` (client, route-level boundary — logs + retry button) · `src/app/global-error.tsx` (root boundary with raw `<html>`/`<body>`, brand-styled 500). Complete the loading+error trio.
- [x] **prefers-reduced-motion in CSS:** `src/app/globals.css` global `@media (prefers-reduced-motion: reduce)` block (animation/transition durations ~0ms + `scroll-behavior:auto`) — catches keyframes that JS checks miss.
- [x] **Theme initial fallback → prefers-color-scheme:** the inline `#theme-init` script in `[lang]/layout.tsx` now resolves the theme as `localStorage` value → else `(prefers-color-scheme: light)` → else dark, and also writes `data-theme` (matches `ThemeProvider.toggleTheme`). No flash on a fresh light-OS visitor.
- [x] **Admin uploads stored in DB (production fix):** the old upload wrote files to `public/uploads` — that filesystem is read-only/ephemeral on Vercel, so uploading a per-product image from the live dashboard always failed. New model `UploadedImage` (`id`/`data` Bytes/`mimeType`) in the schema (pushed with `prisma db push` — **not** `migrate dev`, which would have forced a full reset since Neon was built via push). `POST /api/admin/upload-image` now stores the bytes in the DB and returns `/api/uploads/<id>`; `GET /api/uploads/[id]` streams them back with `Cache-Control: public, immutable` (both `runtime=nodejs`, `force-dynamic`). Product create/update/delete accept `/api/uploads/` URLs and clean up orphaned stored images via `storedImageId()` when replaced/deleted. Static `/uploads/prodact.png` and `/slider/*.png` assets unchanged.
- [x] **Admin product list shows the real image:** `admin/products` now `include: { images: true }` and `toStorefrontProduct` maps `image: images[0].url` — the dashboard thumbnails show the actual product photo (static or DB-backed) instead of the gradient placeholder. Verified DB round-trip for `UploadedImage` (create→read→delete) on the live Neon DB with a temp script (deleted after).
- [x] **All collection links → dedicated pages:** home collection cards + footer collection list now point to `/{lang}/collections/{slug}` (the dedicated per-collection pages with pagination) instead of the old `catalog?collection=...` filtered URL — consistent with the Shop≠Collections decision. `catalog?collection=` still works as a filter.
- [x] **Hero day/night mode (theme-aware veil):** the video itself stays dark in both themes (the product footage is black-on-black and cannot go light — documented decision), but the hero now follows the theme: new CSS vars `--hero-bg` + `--hero-veil-{1..4}` in `globals.css` (dark: black slab, `rgba(0,0,0,0.6→0.75)` veil; light: `#0d0d0f` slab, softer `0.45→0.22` veil, and the bottom stop is `var(--background)` so the video melts into the light page instead of floating on a black box). `page.tsx` hero section uses `backgroundColor: var(--hero-bg)` + the veil gradient reads the vars.
- [x] **Mobile header fit + search in drawer:** the search input (w-36/144px) made the header overflow on 360px phones. Now `SearchBox` in the top bar is `hidden sm:block`, and a `fullWidth` variant of `SearchBox` renders inside the `MobileNav` drawer (new `search` slot) — phones get search from the hamburger menu, tablets/desktop keep it inline.
- [x] **Multi-image product gallery:** `User.permissions String[]` was only for RBAC — the storefront model got `images?: string[]` (full gallery) alongside `image` (primary). `ProductForm` uploads multiple files → `images` array (first = primary; "make primary" reorders), the form posts `images` (was `image`); create/update/delete sync `ProductImage` rows (position + isPrimary) and clean orphaned `UploadedImage` rows. Storefront: new client `ProductGallery` (thumbnails + click switches the main `ProductArt` visual; no thumbnails if no real photos — falls back to the gradient art). `mappers.ts` + `products-db.ts` both map `images`.
- [x] **Admin RBAC (granular permissions):** `User.permissions String[]` — **empty = super admin (full access)**, non-empty = limited to those scopes. `src/lib/admin-permissions-core.ts` (client-safe constants + `hasPermission`), server guards in `src/lib/admin-permissions.ts` (`requirePermission`, `requireAnyPermission`, `requireAdmin`). Every admin section is gated at **action level + page level** (server redirect): products, orders, collections, reviews, coupons, users, newsletter, settings. `admins` permission = create users/admins + change roles + edit permissions; `users` = manage customer accounts (deleting an admin/customer requires `admins`/`users` respectively — checked against the target's CURRENT role in the DB, not the session). The layout reads permissions fresh from the DB (not the JWT — session only carries role) and filters the nav by scope; users page hides the AddUserForm role select and the permission editor from limited admins; self-guards: nobody can delete/de-demote/edit their own account.
- [x] **Depth — multi-layer scroll system (wave 3):** walid asked for "more animations overall, especially on-scroll + depth with multiple animation layers". Studied 3 awarded reference sites first (bombon.rs = GSAP ScrollTrigger + SplitText + Lenis · voyeurverite.com = GSAP pinned sections + clip-path masks · coparadiso.com = Lenis + film-grain + CSS-var marquees) and extracted the patterns — then implemented them **with framer-motion only** (no GSAP):
  - `HeroParallax` (`src/components/motion/hero-parallax.tsx`) — the home hero now slides **three layers at different scroll speeds**: backdrop video 18% + slow zoom (scale 1→1.08), veil/particles 36%, content 80% with cinematic fade + shrink (0.94). The sections below roll OVER the hero. `useScroll`/`useTransform`, fully disabled under `prefers-reduced-motion`. The old `page.tsx` hero section is now a set of `backdrop/mid/content/indicator` props.
  - `WordReveal` (`src/components/motion/word-reveal.tsx`) — masked split-text reveal (bombon style): each word rises from behind an `overflow-hidden` mask with `y 115%→0` + `rotateX -45→0`, soft-out ease `[0.22,1,0.36,1]`, staggered 70ms, `perspective:700`. **Arabic-safe** (splits on spaces, `pb-[0.18em]` on the mask so Cairo descenders are never clipped) and works inside `text-metallic-shine` gradient titles. Wired into `SectionHeading` (title), the Experience strip `h2` and the closing CTA `h2` — everything else keeps `Reveal`.
  - `NoiseOverlay` (`src/components/motion/noise-overlay.tsx` + `.noise-overlay` in globals.css) — fixed full-bleed film grain (tiled SVG feTurbulence 200px, `mix-blend-mode: overlay`, opacity 0.055, `z-45` = above content, below drawers) mounted once in `[lang]/layout.tsx` — the coparadiso "depth from texture" trick.
  - **Sticky marquee band** — the ticker strip after the hero is now `sticky top-16 z-20 backdrop-blur-md`: it pins under the header (h-16) while the stats/carousel sections slide beneath it (bombon-style sticky layer).
  - **Closing CTA depth** — giant rotated `-6°` ADDICTIONX watermark (15vw, new `.text-watermark` class + `text-metallic-shine` sweep) behind a glass card (`bg-card/70 backdrop-blur-xl` + heavy shadow) stacked `-mt-20 sm:-mt-28` over the experience strip — the stacked-card overlap look.
  - **Mobile Arabic nav bar fix (walid's report):** the header measured ~406px vs a 360px viewport. Fix: account icon now `hidden sm:inline-flex` (the drawer already links to account), language-switcher label `hidden sm:inline` (icon-only on phones), logo `text-base` + heartbeat `h-4 w-8` on mobile, header `px-3 gap-3` and icon row `gap-1.5` on mobile — desktop unchanged.
  - Verified: clean `tsc --noEmit` + clean eslint on all touched files + successful `next build`. **Still pending (next wave):** carousel bigger + per-collection identity background + rotating the real `images[]` gallery in the showcase + details strip (walid's original 5-point ask).
- [x] **Site-wide depth (wave 4):** walid's directive after the hero: «مش الفيديو بس — الموقع كله لازم يكون فيه depth». Implemented global ambient depth + per-section parallax décor:
  - `DepthBackdrop` (`src/components/motion/depth-backdrop.tsx` + `.depth-backdrop`/`.depth-orb-*` in globals.css) — a **fixed layer behind ALL routes**: red aurora glow on top + two huge blurred orbs drifting on 55s/70s CSS loops. Mounted in `[lang]/layout.tsx` inside a new `<div className="relative isolate">` wrapper — `isolate` creates a stacking context so the fixed `z-[-10]` layer paints below content but above the body background. **The `--depth-*` CSS vars are the "edit on background" control room** (one place, theme-aware dark/light variants).
  - `SectionGlow` (`src/components/motion/section-glow.tsx`) — a drop-in replacement for the static radial-gradient décor divs: self-referenced `useScroll` makes the glow drift ±12% while the section scrolls (parallax per section). Wired into: home stats band, home experience strip, catalog page, product page, collections hub, collection detail. Combined with the previous `WordReveal`/watermark this gives every storefront section its own moving layer.
  - Depth on cards: `ProductCard` + home collection cards now carry resting elevation shadows + deeper accent glow + `-translate-y-1.5` on hover (layered-shadow look, not flat borders).
- [x] **Closing CTA — layered depth scene (wave 4b):** walid flagged the "Join thousands who chose to live the moment." section (the closing CTA, `dict.home.ctaText`) as still flat and asked for multi-layer z-index animation; reviewed the user's `ui` skill (`C:\Users\walid\.agents\skills\ui\` — its routing: `effects.md` + `layouts.md` + snippets; quality gate applied). Built `CtaScene` (`src/components/motion/cta-scene.tsx`) with an explicit z-ladder per the skill (`layouts.md` § Z-index ladder):
  - `z-0` ADDICTIONX watermark — metallic shine + **scroll-linked parallax** (`useScroll` y 14%→-14%)
  - `z-1` radial glow — parallax drifting opposite (10%→-10%)
  - `z-2` two blurred orbs (`cta-orb-*`, 26s/34s CSS loops)
  - `z-5` rising neon sparks (`ParticleField` screen blend)
  - `z-10` glass card — new `.glass-card` (frost `backdrop-blur(18px)` + **gradient-only border via `mask-composite: exclude`** — the corpus "expensive feel" layer; never animate the card element itself, `animation-fill-mode` breaks its backdrop-filter)
  - `z-20` bottom gradient fade (`.section-bottom-fade` — melts into the footer, corpus #70)
  - CTA button wrapped in `.btn-conic-ring` — rotating conic-gradient accent border driven by `@property --border-angle` (corpus #21 pattern, 3.5s linear). Replaced the old `heartbeat-pulse` on the button.
  - Rules honored: explicit z per layer, named easing/durations, prefers-reduced-motion kills scroll motion (JS) and loops (CSS global block), single accent (red), theme-aware.
  - **ui skill note:** `ui/SKILL.md` is a conductor — references (`effects.md`/`layouts.md`/`animations.md`/`directions.md`/`typography.md`/`components.md`/`assets.md`) + `snippets/` + `prompt-library/` (77 prompts, INDEX.md). Profile locked for ADDICTIONX = **Cinematic Dark Glass** (black bg, liquid-glass chrome, white-opacity ladder, single red accent, metallic shine). Only read what the task needs (routing map). Project CLAUDE.md outranks the skill on conflicts. It is NOT in opencode's skills list — read the files directly with Read.
  - Verified: clean `tsc --noEmit` + `npm run lint` + `next build` + live 200.
- [x] **The 7-depth wave (wave 6) — "كمل شغل"**: walid pasted the full plan from his other AI chat (7 depth systems: exploded layers, 360 pinned rotation, depth-stacked collections, parallax text reveal, depth fog, repulsion hover, orbital CTA) and said DO IT — no files, no discussion, and gave full control (install what's needed). Built all 7 with framer-motion only (NO GSAP — plan text mentioned ScrollTrigger, project rule forbids it; sticky+useScroll covers pinning):
  - **`ExplodedProduct`** (`src/components/motion/exploded-product.tsx`) — bestsellers cards replaced with 5-layer perspective-1200px floats: z-120 heartbeat-pattern (3× HeartbeatLine, blur 6, opacity .2) · z-60 radial glow (screen blend, `art.glow`) · z-0 bottle (real image or ProductArt) · z+60 glass chip (name+price+rating) · z+120 CTA pill (`addToCart` label, neon shadow). Hover: layers split to z×1.35 + bottle rotateY 18°, spring 220/26. Grid stays `grid-cols-2 lg:grid-cols-4`, aspect-[3/4].
  - **`RotatingShowcase`** (`src/components/motion/rotating-showcase.tsx`) — new 300vh pinned section right after the hero: bottle turns -36°→36° rotateY (transformPerspective 1400) bound to scroll, sheen sweeps (-180%→180%), floor shadow breathes, watermark ADDICTIONX dims, backdrop hue crossfades red→gold→silver (3 radial layers), 3 note panels (top/heart/base via `dict.product.topNotes/heartNotes/baseNotes`) slide in/out per quarter via `NotePanel` sub-component (hooks-safe), last quarter hands price+rating+CTA. True 360° needs an 8-angle photo set (requested from walid — this is the honest single-image "presentation turn").
  - **`DepthStack`** (`src/components/motion/depth-stack.tsx`) — home collections replaced with a scroll-driven deck: section h-[260vh], sticky top-24 stage (h-72vh, perspective 1200), each card lives at depth slot (x=i*26, scale .86, rotateY i*9, z 18-i*6) and rises to front (z 40) at its turn, then exits right (x 34, scale .82, rotateY -18, opacity .3). Cards = cover image or art-gradient + name overlay.
  - **`ScrollWordReveal`** (`src/components/motion/scroll-word-reveal.tsx`) — the Experience heading now "writes itself": each word opacity .12→1 + rotateX -42°→0 + y 18→0 at its own scroll slice (offset `["start 0.92","start 0.45"]`); `Word` sub-component (hooks-safe). Used in home experience strip.
  - **`DepthFog`** (`src/components/motion/depth-fog.tsx` + `.depth-fog-*` in globals) — mounted in layout next to DepthBackdrop: two fixed washes (top 38vh / bottom 42vh) built from `color-mix` with `--background` (theme-aware), opacity scroll-driven 0→.45/.5 → atmospheric distance. z-3 (below header/marquee z-20).
  - **`RepulsionGrid`** (`src/components/motion/repulsion-grid.tsx`) — catalog results grid wrapped: each card registers a `RepulsionItemHandle` (setPointer/reset via useImperativeHandle, own x/y springs 160/20); container pointermove pushes cards away within radius 240px, strength 16, decaying to 0 at the edge. forwardRef + ref-callback array; no hooks in loops.
  - **Orbital ring CTA** (`.cta-orbit-ring` in globals + mounted in CtaScene L3b) — giant rotating conic ring around the glass card reusing `@property --border-angle` (16s loop; `.group:hover .cta-orbit-ring` → 5s). CtaScene wrapper now `group relative z-10`.
  - Verified: clean tsc + lint + build + live 200. **Note:** `AI_UI_BRIEF.md` at repo root was requested by walid earlier as a file to send to his other AI; it duplicates this wave's summary — keep in sync or delete if walid says.
- [x] **BOTTLE RUSH — the awe scene (wave 5):** walid's single-word brief «اابهرني» ("blow me away") after waves 3–4b. Built a scroll-scrubbed cinematic stage on the home page (`src/components/motion/bottle-rush.tsx`), mounted between the carousel and "Most wanted", using the **real uploaded product photo** (`heroProduct.image`, fallback `/uploads/prodact.png`):
  - Section is `h-[220vh]` with a **sticky fullscreen stage** (native CSS sticky — no JS pinning). `useScroll` (self target, `["start start","end end"]`) scrubs: bottle `scale 0.5→1.15` · `rotate -12°→10°` · `blur 18→0px` (un-blurs as you scroll) · `opacity 0→1` by 15% · red aura ramps `0→0.85` · giant metallic **ADDICTION** (`text-watermark`+`text-metallic-shine`, 19vw) splits sideways `x 16vw→-16vw` · heading layer (`.rush*` dict keys, new `home.rushTitle`/`rushSubtitle` AR+EN) fades out at 92–100%.
  - Layer ladder: z-0 split watermark / z-1 aura / z-2 bottle / z-5 sparks (`ParticleField` 16, screen) / z-5 heading. `prefers-reduced-motion` → static full-size bottle, no transforms.
  - `Magnetic` (`src/components/motion/magnetic.tsx`) — spring-loaded cursor pull (stiffness 150/damping 15/mass .1, strength .35) wrapped around the two hero CTAs + the closing CTA button (strength .25). "Expensive feel" micro-interaction, snaps back on leave, disabled by reduced motion.
  - `Spotlight` (`src/components/motion/spotlight.tsx`) — cursor-tracking radial light inside a card: writes `--sp-x/--sp-y` CSS vars on pointermove, overlay radial-gradient (26rem×18rem, accent tint `oklch(0.6 0.22 22/0.16)`) fades in via `group-hover/spot:`. Now the inner layer of the `.glass-card` in `CtaScene` (L10) — the glass itself still never animates (CLAUDE.md rule).
  - Verified: clean `tsc --noEmit` + `npm run lint` + `next build` + live 200.
- [x] **Multi-angle product views + home fix + collections/shop depth (wave 7):**
  - **Multi-angle:** walid added `/uploads/back.png` + `/uploads/side.png`. `ProductGallery` now auto-appends them (deduped, cap 3) to EVERY product with a photo — customers see front/back/side thumbnails; real DB uploads (`product.images`) come first. `RotatingShowcase` upgraded from a fake turn to a **real spin**: 4 crossfaded `TurnView` layers (front→side→back→front, hand-off points 0.02/0.24/0.26/0.49/0.51/0.74/0.76) bound to scroll — the bottle visibly changes angle.
  - **Home Oops fix:** root cause = heavy sequential DB calls (`getProducts` → `getCollections` → `getWishlistIds`) + Neon cold-start timeouts → 500 → dead-end default error screen. Fixed: `Promise.all` on the three calls + null-guards (`product.notes?.top ?? []` in showcase, `product.art?.glow ?? "#ef4444"` in ExplodedProduct) + new `[lang]/error.tsx` client boundary with «إعادة المحاولة»/Try again + Home link (bilingual via useParams). SSR verified clean (200, full HTML).
  - **Collections page depth:** title → `ScrollWordReveal`; cover cards wrapped in `TiltCard` (3D cursor tilt + glare) + a floating `orb-drift` glow orb (14s CSS loop) using the collection's own `art.glow`; product cards → `TiltCard`.
  - **Catalog (shop) depth:** title → `ScrollWordReveal` (justify-start); product cards → `TiltCard` inside the existing `RepulsionGrid`.
  - **Home extra awe:** hero content wrapped in `MouseDrift` (slow cursor parallax ±8) + **twin marquee** below the pinned one (`reverse` prop on Marquee, speed 48, opacity-70 — coparadiso multi-speed pattern).
  - New components: `tilt-card.tsx` (rotateX/Y springs 180/18, perspective 900, `--glare-x/y` highlight, group-hover) + `mouse-drift.tsx` (stiffness 55 drift) + `marquee reverse` prop.
  - **Gallery fallback completed:** DB products carry NO images (production Neon differs from local dev seed — `my-icon-eau-de-parfum` does NOT exist on Neon, it 404s silently with HTTP 200 + `NEXT_HTTP_ERROR_FALLBACK;404`; real slugs = red-rush, oud-mystique, midnight-noir, golden-hour, mystic-pearl, velvet-rose, citrus-dream, smoke-signals). ProductGallery now builds `views = dedupe([...product.images, product.image ?? prodact.png, back.png, side.png]).slice(0,3)` so EVERY product shows front/back/side. Verified live on /en/product/red-rush (4 imgs).
  - Verified: clean tsc + lint + build + live 200.
- [x] **Carousel wave (wave 8) — the open 4-point ask, done:** bigger + per-collection identity background + real `images[]` rotation + details strip:
  - **Bigger carousel:** stage `max-w-sm` → `max-w-xl` (`aspect-[0.72/1]`), side roles spread wider (left 15 / right 85, scale 0.62, height 64) and card width 62%→56% so the center reads as the hero; `SlideImage` sizes bumped (560/500/320).
  - **Per-collection identity background:** each carousel product gets its own full-bleed identity layer (z-[1], CSS opacity crossfade 650ms): radial glow in the collection's `art.glow` + giant collection name wordmark (19vw→13vw, `WebkitTextStroke` in the glow color, RTL-aware). The old single fixed glow div is gone. Plus a collection identity chip (glow dot + localized name) above the active product name. `collectionNames` map built in page.tsx from `getCollections()` (DB names) and passed as a new prop.
  - **Real images[] in the showcase:** `RotatingShowcase` builds its photo sequence dynamically — `[frontView, ...real product.images (≤4, deduped vs back/side), side?, back?, frontView]` capped at 6 views, always ENDING on the front view; segments evenly distributed across the 300vh scrub with 0.015/0.09 crossfade windows (N=4 fallback = the classic front→side→back→front). DB products without photos keep the previous behavior exactly.
  - **Details strip replaces the side panels:** `NotePanel` (3 floating side panels, md-only) is deleted. New persistent glass bar at `bottom-[4vh]` z-[6] with 3 zones: A = collection chip (glow dot) + product name (truncate, always on) · B = quarterly slot handing over top → heart → base → price+rating (children crossfade via CSS opacity/translateY 650ms; `useMotionValueEvent` → `quarter` state, thresholds 0.31/0.56/0.81) · C = add-to-cart slides in for the last quarter (existing ctaOpacity/ctaY scroll transforms). Reduced motion pins quarter 3 (price + CTA, notes hidden — matches the old reduce behavior). The glass element itself never animates (children only).
  - Verified: clean tsc + lint + build + live 200.
- [x] **Smoothness + weight (wave 9) — walid: «الموقع بقي تقيل والأنيميشن مش مريح للعين، ومتخففش»:** smoothness WITHOUT nerfing + real weight reduction on the home page:
  - **Smoothness (ranges kept, profiles changed):**
    - All scroll scrubs got mid-point easing (ease-out arcs: fast start, silk settle) — BottleRush (scale/rotate/blur/glow now 3-4 point `useTransform` arrays, original ranges untouched), RotatingShowcase scale/floorScale, CTA opacity.
    - **RotatingShowcase photo swap rewired:** the old long fade-ins left the bottle ~50% transparent for the first 24% of the section (the shimmer was the source of the eye-strain). Now every view is FULLY opaque for most of its segment: 6% quick ramp-in → long hold → 6% crossfade hand-off. `TurnView` imgs get `decoding="async"` + `fetchPriority` (high only for the front) + `will-change-opacity`.
    - Carousel: `ANIM_MS 650→700` + ease-out `cubic-bezier(0.22,0.61,0.36,1)` (roles + identity crossfade); showcase strip slots 700ms same ease.
    - Springs: damping up everywhere (less wobble, same drama) — TiltCard 150/24, ExplodedProduct 170/30 + entrance 80/22, RepulsionGrid 130/26, MouseDrift 45/26. Ranges/strengths all unchanged.
  - **Weight (the actual «تقيل» fix):**
    - `LazyMount` (`src/components/motion/lazy-mount.tsx`) — IntersectionObserver gate (rootMargin 300px) that keeps the 300vh RotatingShowcase + 220vh BottleRush OUT of the DOM until the user approaches (fallbackHeight reserves their space, so no scroll-jump). Their scroll listeners, layout and image memory no longer tax the initial load.
    - `ParticleField` halves particle count on mobile (`useSyncExternalStore` on `max-width:768px` — SSR/hydration safe).
    - `content-visibility:auto` + `contain-intrinsic-size` on the two safe below-fold sections (Most wanted grid, Experience strip — no sticky children, so nothing breaks).
  - Verified: clean tsc + lint + build + live 200.
- [x] **Home update — walid's new assets (waves 10–12):** walid dropped new footage + backdrops into `public/` and said «استخدم كل اللي بعتو — من folder hero»:
  - **Hero — direct video playback (wave 12, FINAL):** the sprite-scrub hero was **abandoned entirely**. `perfume-360.mp4` is not a closed loop (first/last frames differ + a bright first frame), so the strip mirror would snap. Instead the shared **`TurntableVideo`** (`turntable-video.tsx`) **plays `right.mp4` (forward) ↔ `left.mp4` (reversed) alternating on `ended`** — seamless continuous rotation, all viewports, no strips/canvas. `HeroVideo` (`hero-video.tsx`) wraps it with `fadeOnScroll` (hero melts away) + `bg-[#0a0a0a]`. `page.tsx` imports `HeroVideo`, dropped the scroll indicator.
  - **Product showcase — 360° turntable VIDEO (wave 12b, NO 3D):** walid's direction = «**NO 3D** — remove the 3D-oriented direction, use high-quality/360° product videos». The wave 11 WebGL turntable (`product-360.tsx` + `three`/`@react-three/fiber`/`@react-three/drei` + `/uploads/360/strip.jpg`) was **removed entirely** — `RotatingShowcase` now renders the same shared `TurntableVideo` (`fit="contain"` + parent `mix-blend-screen` so the dark studio bg vanishes) inside the 300vh pinned stage; the scroll story (scale arc, sheen sweep, red→gold→silver hue drift, details-strip quarter hand-off top/heart/base→price+CTA) is unchanged. Video is **not scroll-scrubbed by seek** (the old hero lesson: `video.currentTime` seeks feel unnatural — the bottle just rotates continuously while scroll drives the story around it). Reduced motion → static poster `/uploads/360/frame-01.png` (the only file kept from the strip folder). Deleted: `product-360.tsx`, strip.jpg, frames 02–12, and the three/R3F deps from package.json.
  - **Collection backdrops (wave 10):** `public/collections/{rush,noir,gold}.jpg` wired via `src/features/catalog/data/collection-assets.ts` (`collectionBackdrop(slug)`) — used by the carousel identity layer, the DepthStack covers (`page.tsx` fallback `cover.image ?? collectionBackdrop(...)`) and the collections hub.
  - **Hero — wave 13: walid's new `public/hero` footage + mouse-follow steering:** replaced `right.mp4`/`left.mp4` (deleted) with `public/hero/hero.mp4` (normal) + derived `hero-left.mp4` (reversed); the reduced-motion poster moved to `public/hero/frame-01.png` and is now the hero's `poster` too. Robust reveal via `loadeddata`/`playing` (not a blind timer). Old assets removed entirely (`public/360/`, `public/uploads/360/`).
  - **Hero — wave 14: mouse direction fix (يمين→يمين / شمال→شمال):** the wave-13 mapping was **inverted** — it played `hero-left.mp4` (reversed = LEFTWARD turn, verified via ffmpeg frame cross-correlation, self-tested) when the mouse moved RIGHT, and `hero.mp4` (normal = RIGHTWARD turn) when it moved LEFT. Now `applyDirection`/`playNext` map mouse **RIGHT → `hero.mp4` (rightward)** and mouse **LEFT → `hero-left.mp4` (leftward)** — the refs now line up with the movement (`videoRightRef` = `hero.mp4`). Idle unchanged: no hover → the two copies alternate on `ended` and the 360° rotation keeps running continuously. Mirrored-time reverse (same angle, no snap) + ~1.2s idle back-to-auto still in place. Verified: clean tsc + lint.
  - **Hero — wave 15: flexible mouse rotation (الدوران مش مرن):** the turn now follows the **cursor velocity** — `playbackRate` = `clamp(vel × 1.6, 0.1, 2.2)` eased by an always-on rAF loop (fast mouse = fast turn, slow = slow, stopped = eases out and stops). `activeRef` tracks the shown video (replaces display-sniffing); `switchTo` (mirrored-time, no snap) replaces the old `applyDirection`. Tunables: `MAX_RATE`/`MIN_RATE`/`RATE_PER_VEL`/`IDLE_STOP_MS` at the top of `turntable-video.tsx`. Verified: clean tsc + lint.
  - **Hero — wave 16: rotation stands while hovering (الدوران ديما شغال 360 سواء hover أو لا):** the auto-spin no longer resumes while the cursor is over the hero — `IDLE_AUTO_MS`/`autoTimerRef` deleted. Auto 360° runs only when the cursor LEAVES the hero; while hovering, ~250ms stillness → the turn eases out and the bottle STANDS at its exact angle, then follows the hand from that point on the next move (angle continuity everywhere, no snap). Micro-jitter ≤3px accumulated is absorbed (bottle stays put). rAF ease asymmetric: stop 0.3/frame, start 0.18. Verified: clean tsc + lint.
  - Verified: clean tsc + eslint (waves 10–16).
- [ ] **Assets needed from walid (wave 9 ask — the visual «execution» gap):** (1) real transparent PNG of the bottle (no background, no shadow, ~1200-2000px, <1MB) · (2) 360° set = 8 photos × 45° of the SAME bottle (or a GLB) for a true turn in the showcase — **done differently (wave 12b):** walid's turntable video → `public/360/perfume-360.mp4` plays directly in the showcase (the R3F 36-cell strip was removed) · (3) per-collection ambient backdrops for rush/noir/gold (2400×1350) for the carousel identity background + DepthStack — **done** (wave 10, `public/collections/*.jpg`) · (4) 4-6 voyeur-style lifestyle shots + OG images (1200×630) per collection · (5) 4K hero video loop (the current hero still scrubs a sprite filmstrip from the old 6400×2160 video) — **replaced** by direct video playback (wave 12, `right.mp4`↔`left.mp4`).
- [ ] Google OAuth keys (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`) — **needed from walid**
- [ ] Wire Cloudinary images instead of `ProductArt` — **needs walid's account data** (cloud name + API key/secret) + uploading the images to Cloudinary (CLAUDE.md workflow #4)

**Fixed decisions:**

- Identity: **ADDICTIONX** — «Feel the Rush». Young audience → visual wow top priority.
- Colors: deep black `oklch(0.12 …)` + neon red `oklch(0.6 0.22 22)` + metallic silver gradient for titles.
- Fonts: Cairo (Arabic+Latin, body) · Playfair Display (Latin, display). `--font-cairo` and `--font-playfair`.
- shadcn `base-nova` style + `@base-ui/react` (instead of Radix). `components.json` at root, `rtl: true`.
- Translation: `[lang]` segment (`/ar`, `/en`), default `ar`, dictionaries in `src/lib/i18n/dictionary.ts`.
- Theme: dark default, preference in `localStorage`, colors as CSS variables, light in `:root[data-theme="light"]`.
- Framer Motion (framer-motion v13) — instead of the motion package (per walid's request).
- **Base UI Button uses `render={<Link/>}` for polymorphism — not `asChild`.**
- Prices `Int` in piasters (decision #3) — `formatPrice()` in `products.ts` for display conversion, `egpToQirsh` (×100) on admin input.
- Build errors: any `createMotionComponent` issue on the server = a Server component importing `motion` directly. Solution: `"use client"` or CSS hover instead.
- **Never pass functions/icons from Server to Client Component** — define them inside the client and pass text only (the `Functions cannot be passed directly to Client Components` error happened in `admin/layout.tsx` with icons).
- **Order price is calculated server-side from the DB only** — the cart snapshot (name/price/size) is for display only and never trusted in the calculation.
- **Checkout requires login** — `Order.userId` is required; unregistered users are sent to login with `callbackUrl`.
- **Clear separation between the two dashboards:** customer dashboard (scope: their orders + addresses + wishlist) and admin dashboard (full permissions: product CRUD · user management with add/delete · shipment tracking · comprehensive tracking). `/admin` for admins only.
- **Shipping:** `Shipment` model is now linked — auto-created when the order becomes `SHIPPED` (default carrier `Bosta`), closed on `DELIVERED`, deleted on `CANCELLED/REFUNDED`. Tracking shows to the customer in their order details and to the admin in the orders panel.
- **Shipping settings = source of truth in DB** (`StoreSetting`): the checkout and cart-drawer fetch from `GET /api/shipping-config` — the constants in `src/lib/checkout-config.ts` are fallback only for display before load.
- **Coupons:** `discountValue` — PERCENT as an integer percentage (%), FIXED in piasters (input in EGP multiplied by 100). The discount is always computed server-side. `minOrderAmount` in schema `Int?` → any use needs `?? 0`.
- **Sale = `compareAtPrice` present** (no separate field) — `discountPercent` in the admin form generates it automatically; the admin filter is `NOT: { compareAtPrice: null }`.
- **Coupon validation in `createOrder` is the final judge** — `validateCoupon` in the UI is preview only (final price is computed server-side inside the transaction along with the stock decrement).
- **`toLocaleDateString` doesn't accept `timeStyle` in Node** (the browser tolerates it, Node throws) — for date+time use `toLocaleString`.
- **Delete user:** cannot delete self; their orders move to `userId=null` (order history stays anonymous) then the user is deleted in one transaction.
- Seed admin: `admin@addictionx.com` (password in `prisma/seed.ts`) — **change it immediately before production**.
- `@prisma/client` imported outside the project (temp scripts) fails — put the script inside the project, and use the async pattern script (no top-level await with tsx).
- **Reviews (fixed decision):** one review per product/user — upsert on `productId_userId`; editing returns the review to pending; publishing depends on admin approval; `rating`/`reviewsCount` in DB are recomputed from the **actual approved reviews only** (the fake marketing seed numbers collapse at the first approval — intentional).
- **Collections (fixed decision):** no FK — `Product.collection` stays a text slug; the `Collection` model is managed from the dashboard (add/delete — deletion is refused while products exist).
- **Social (fixed decision):** Instagram + TikTok only — **no Facebook** (per walid's request).

**Environment:** Node v24 · npm 11 (npmmirror source + PRISMA_ENGINES_MIRROR for install) · git v2.34 · DB on Neon (Postgres cloud) · **no local dev server** — we push and check on the live site **https://addictionx.vercel.app/** (Vercel auto-deploy).
