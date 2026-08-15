import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParticleField } from "@/components/motion/particle-field";
import { HeroVideo } from "@/components/motion/hero-video";
import { HeroParallax } from "@/components/motion/hero-parallax";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { FadeIn } from "@/components/motion/fade-in";
import { TypewriterLine } from "@/components/motion/typewriter-line";
import { CollectionPicker } from "@/components/motion/collection-picker";
import { WordReveal } from "@/components/motion/word-reveal";
import { RevealStagger, RevealItem, Reveal } from "@/components/motion/reveal";
import { siteUrl } from "@/lib/site-url";
import { Marquee } from "@/components/motion/marquee";
import { Magnetic } from "@/components/motion/magnetic";
import { MouseDrift } from "@/components/motion/mouse-drift";
import { HeroMelt } from "@/components/motion/hero-melt";
import { StatsBand } from "@/components/motion/stats-band";
import { SectionGlow } from "@/components/motion/section-glow";
import { RotatingShowcase } from "@/components/motion/rotating-showcase";
import { LazyMount } from "@/components/motion/lazy-mount";
import { CollectionShelf } from "@/components/motion/collection-shelf";
import { CtaScene } from "@/components/motion/cta-scene";
import { SignatureScene } from "@/components/motion/signature-scene";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductCarousel } from "@/features/catalog/components/product-carousel";
import { BestSellerCard } from "@/features/catalog/components/best-seller-card";
import { type Product } from "@/features/catalog/data/products";
import {
  getProducts,
  getCollections,
  getHomeSlides,
} from "@/features/catalog/data/products-db";
import {
  collectionBackdrop,
  shelfBottle,
  shelfTint,
} from "@/features/catalog/data/collection-assets";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { getHomeSectionsConfig } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const [allProducts, collections, wishlist, homeSections, homeSlides] =
    await Promise.all([
      getProducts(),
      getCollections({ homeOnly: true }),
      getWishlistIds(),
      getHomeSectionsConfig(),
      getHomeSlides(),
    ]);
  // Best sellers: admin-controlled order (bestsellerOrder), top 4 shown.
  // Equal orders keep getProducts() order (bestsellerOrder asc, createdAt desc).
  const bestsellers = allProducts
    .filter((p) => p.isBestseller)
    .sort((a, b) => (a.bestsellerOrder ?? 0) - (b.bestsellerOrder ?? 0))
    .slice(0, 4);
  const heroProduct = allProducts[0] ?? null;

  // Carousel: dashboard-controlled (admin → Slider). Each slide points at a
  // product and may override its image + caption. When no slides are configured
  // we fall back to one slide per collection (the collection's own image wins,
  // then the old fixed /slider/* icons, then the product image), with captions
  // from the collection's descriptionAr/En.
  const carouselImages: Record<string, string> = {
    rush: "/slider/rush.png",
    noir: "/slider/noir.png",
    gold: "/slider/gold.png",
  };
  const slideMeta = Object.fromEntries(
    collections.map((c) => [
      c.slug,
      {
        image: c.image ?? undefined,
        descriptionAr: c.descriptionAr ?? undefined,
        descriptionEn: c.descriptionEn ?? undefined,
      },
    ]),
  );

  let carouselProducts: Product[] = [];
  // Per-product caption overrides (keyed by product id) from the slider slides.
  const slideCaptionsByProductId: Record<string, { ar?: string; en?: string }> =
    {};
  if (homeSlides.length > 0) {
    const productById = new Map(allProducts.map((p) => [p.id, p]));
    carouselProducts = homeSlides
      .map((s) => {
        const product = productById.get(s.productId);
        if (!product) return null;
        if (s.captionAr || s.captionEn) {
          slideCaptionsByProductId[s.productId] = {
            ar: s.captionAr ?? undefined,
            en: s.captionEn ?? undefined,
          };
        }
        // Custom slide images carry the admin's framing adjustment.
        return s.image
          ? {
              ...product,
              image: s.image,
              imageAdjust: s.imageAdjust ?? undefined,
            }
          : product;
      })
      .filter((p): p is Product => p !== null);
  }

  if (carouselProducts.length === 0) {
    carouselProducts = collections
      .map((c) => {
        const inCollection = allProducts.filter((p) => p.collection === c.slug);
        if (inCollection.length === 0) return null;
        const first = inCollection.find((p) => p.image) ?? inCollection[0];
        const slider = c.image ?? carouselImages[c.slug];
        return slider
          ? {
              ...first,
              image: slider,
              imageAdjust: c.imageAdjust ?? undefined,
            }
          : first;
      })
      .filter((p): p is Product => p !== null);
  }
  // Collection identity for the carousel backdrop + showcase strip (wave 8)
  const collectionNames = Object.fromEntries(
    collections.map((c) => [c.slug, { nameAr: c.nameAr, nameEn: c.nameEn }]),
  );
  const totalReviews = allProducts.reduce((s, p) => s + p.reviewsCount, 0);
  const topRating = allProducts.reduce(
    (top, p) => (p.rating > top ? p.rating : top),
    0,
  );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["Organization", "WebSite"],
            name: "ADDICTIONX",
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/${locale}/catalog?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      {/* ====== HERO — cinematic scene: the video stays dark in BOTH themes (black product footage
            cannot go light), but the veil/bg follow the theme via --hero-* vars so the hero melts
            into the page below. HeroParallax slides three layers at different scroll speeds
            (backdrop slow + zoom, veil mid, content fast fade) — the depth that makes the
            next sections feel like they're rolling OVER the hero ======
            (wave 33: #hero-stage wraps the scene — the prmpt-style custom cursor ring takes
            over there (system cursor hidden `[cursor:none]`), and the content enters with the
            staggered rhythm 0 / 0.15 / 0.3 / 0.45 for a calmer first impression) ====== */}
      <div id="hero-stage" className="relative [cursor:none]">
        <HeroParallax
          backdrop={<HeroVideo />}
          mid={
            <>
              {/* Theme-aware contrast veil — solves readability without mix-blend */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[5]"
                style={{
                  background:
                    "linear-gradient(to bottom, var(--hero-veil-1) 0%, var(--hero-veil-2) 40%, var(--hero-veil-3) 78%, var(--hero-veil-4) 100%)",
                }}
              />
              {/* Light neon dust over the video — screen blend (red stays red) */}
              <ParticleField count={10} blend="screen" opacityScale={0.3} />
            </>
          }
          content={
            <MouseDrift
              strength={8}
              className="flex w-full flex-col items-center"
            >
              <div className="flex flex-col items-center gap-6 px-6 pt-20 text-center">
                {/* Wave 33 — prmpt staggered entrance: 0 / 0.15 / 0.3 / 0.45 / 0.6,
                  each fading up with a soft settle (eye-comfort rhythm) */}
                <FadeIn delay={0}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs tracking-[0.25em] text-red-400 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_4px_24px_rgba(0,0,0,0.45)]">
                    <Sparkles className="size-3.5" />
                    {dict.hero.badge}
                  </span>
                </FadeIn>

                <AnimatedTitle text={dict.hero.title} />

                <FadeIn delay={0.3}>
                  <HeartbeatLine className="h-10 w-56 text-red-500 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.6))_drop-shadow(0_4px_24px_rgba(0,0,0,0.45))]" />
                </FadeIn>

                <TypewriterLine
                  text={dict.hero.subtitle}
                  speed={46}
                  startDelay={450}
                  className="max-w-xl text-base leading-relaxed text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_4px_24px_rgba(0,0,0,0.45)] sm:text-lg"
                />

                <FadeIn delay={0.6}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Magnetic>
                      <Button
                        render={<Link href={`/${locale}/catalog`} />}
                        size="lg"
                        className="h-12 rounded-full px-8 text-base shadow-[0_0_30px_-8px_theme(colors.red.600)]"
                      >
                        {dict.hero.ctaPrimary}
                      </Button>
                    </Magnetic>
                    <Magnetic>
                      <Button
                        render={<Link href={`/${locale}/catalog`} />}
                        size="lg"
                        variant="outline"
                        className="h-12 rounded-full border-white/30 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                      >
                        {dict.hero.ctaSecondary}
                      </Button>
                    </Magnetic>
                  </div>
                </FadeIn>

                <FadeIn delay={0.8}>
                  <CollectionPicker
                    locale={locale}
                    collections={collections}
                    labels={{
                      prompt: dict.hero.pickPrompt,
                      hint: dict.hero.pickHint,
                      all: dict.hero.pickAll,
                      empty: dict.hero.pickEmpty,
                      ready: dict.hero.pickReady,
                      go: dict.hero.pickGo,
                    }}
                  />
                </FadeIn>
              </div>
            </MouseDrift>
          }
        />
        {/* Wave 34b — the hero exits as a cinematic focus-pull: progressive
              blur + theme-bg melt (see hero-melt.tsx) ====== */}
        <HeroMelt />
      </div>

      {/* ====== Hero separator — animated marquee strip between hero and showcase ====== */}
      <Marquee
        items={dict.home.ticker}
        speed={60}
        className="border-y border-primary/30 bg-gradient-to-r from-background via-primary/5 to-background py-3 backdrop-blur-sm"
      />

      {/* ====== ROTATING SHOWCASE — 95vh stage: the hero product assembles with the
            wheel (full-bleed frame scrub + crossfade), animation COMPLETES when the
            section is fully in view, SHOP NOW (→ general catalog) ======
            (wave 9: LazyMount keeps the 95vh scene + its scroll listeners out of
            the DOM until the user actually reaches it — the hero stays fast) ====== */}
      {heroProduct ? (
        <LazyMount fallbackHeight="95vh">
          <RotatingShowcase
            product={heroProduct}
            locale={locale}
            collectionNames={collectionNames}
          />
        </LazyMount>
      ) : null}

      {/* ====== Moving words strip — pinned under the header while the next sections
            slide beneath it (bombon-style sticky layer) ====== */}
      <div className="relative">
        <Marquee
          items={dict.home.ticker}
          className="sticky top-16 z-20 border-y border-border bg-card/40 py-4 backdrop-blur-md"
        />

        {/* Decorative accent line under the sticky marquee */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Spacer between marquees for visual breathing room */}
      <div className="h-6 bg-gradient-to-b from-background/60 to-transparent" />

      {/* Second strip — reversed direction + slower (coparadiso-style twin marquees),
            this one scrolls WITH the page under the pinned one ====== */}
      <Marquee
        items={[...dict.home.ticker].reverse()}
        reverse
        speed={48}
        className="border-y border-border/40 bg-background/40 py-3 opacity-60 backdrop-blur-sm"
      />

      {/* Bottom spacer with fade effect */}
      <div className="h-8 bg-gradient-to-b from-transparent to-background/20" />

      {/* ====== Brand numbers (live counters) — glow drifts slower than the content ====== */}
      <section className="relative overflow-hidden py-16">
        <SectionGlow />
        <StatsBand
          stats={[
            { label: dict.home.statsProducts, value: allProducts.length },
            { label: dict.home.statsReviews, value: totalReviews },
            { label: dict.home.statsRating, value: topRating, suffix: "/5" },
          ]}
        />
      </section>

      {/* ====== Roles carousel — collection icons ====== */}
      <ProductCarousel
        products={carouselProducts}
        locale={locale}
        wishlistIds={wishlist}
        dict={dict}
        collectionNames={collectionNames}
        slideMeta={slideMeta}
        slideCaptionsByProductId={slideCaptionsByProductId}
      />

      {/* ====== Most wanted — wave 34d + wave 35: the scents section becomes a
            storytelling entrance — heading reveals first, then each
            bestseller RUSHES in ONE BY ONE with a springy rise (scale + blur
            + y, staggered 0.13) over a drifting glow; the cards themselves
            idle-float and wake on hover (see best-seller-card.tsx) ====== */}
      <section className="relative overflow-hidden py-20 [content-visibility:auto] [contain-intrinsic-size:auto_640px]">
        <SectionGlow />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal y={24}>
            <div className="mb-10 flex items-end justify-between gap-4">
              <SectionHeading
                eyebrow={dict.home.featuredEyebrow}
                title={dict.home.featuredTitle}
                subtitle={dict.home.featuredSubtitle}
              />
              <Link
                href={`/${locale}/catalog`}
                className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary sm:flex"
              >
                {dict.home.viewAll}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          {/* Each card: visible → rushes in its turn (springy scale + blur + rise) */}
          <RevealStagger
            stagger={0.13}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
          >
            {bestsellers.map((product: Product, index: number) => (
              <RevealItem key={product.id} y={64} scale={0.9} blur={10}>
                <BestSellerCard
                  product={product}
                  locale={locale}
                  rank={index + 1}
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ====== Signature moment — the flagship bottle floats over a drifting
            glow while the brand promise word-reveals beside it; a perfume
            atmosphere scene, not trust badges (wave 34e, replaces the old
            perk-card strip and moves up to follow the scents) ====== */}
      <SignatureScene
        image={heroProduct?.image}
        glow={heroProduct?.art.glow ?? "#ef4444"}
        eyebrow={dict.home.signatureEyebrow}
        title={dict.home.experienceTitle}
        text={dict.home.experienceText}
        ctaLabel={dict.home.signatureCta}
        ctaHref={`/${locale}/catalog`}
      />

      {/* ====== THREE MOODS, THE SHELF (wave 41) — an interactive display
            case: each collection is a bottle in a glass card standing on a
            lit shelf; spotlight cone + floor reflection + mouse tilt on the
            active card, arrows/tabs/drag to switch (see collection-shelf.tsx).
            The bottle renders are walid's fresh generations (public/shelf/*)
            — until they land, the mood backdrops carry the cards. The section
            is dashboard-controllable (show/hide + copy, see settings) ====== */}
      {homeSections.showCollections && collections.length > 0 ? (
        <section className="relative">
          <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <SectionHeading
                eyebrow={
                  homeSections.collectionsEyebrow[locale] || "Feel the Rush"
                }
                title={
                  homeSections.collectionsTitle[locale] ||
                  dict.home.collectionsTitle
                }
                subtitle={
                  homeSections.collectionsSubtitle[locale] ||
                  dict.home.collectionsSubtitle
                }
              />
            </div>
          </div>

          <CollectionShelf
            rtl={locale === "ar"}
            cards={collections.map((collection) => {
              const collectionProducts = allProducts.filter(
                (p) => p.collection === collection.slug,
              );
              const cover = collectionProducts[0] ?? {
                image: undefined,
                art: { from: "#1e1b4b", to: "#020617", glow: "#6366f1" },
              };
              const tagline =
                locale === "ar"
                  ? (collection.descriptionAr ?? cover?.descriptionAr ?? "")
                  : (collection.descriptionEn ?? cover?.descriptionEn ?? "");
              return {
                key: collection.slug,
                name: locale === "ar" ? collection.nameAr : collection.nameEn,
                nameEn: collection.nameEn,
                nameAr: collection.nameAr,
                tagline,
                href: `/${locale}/collections/${collection.slug}`,
                bottle: shelfBottle(collection.slug),
                image:
                  collection.image ??
                  collectionBackdrop(collection.slug) ??
                  null,
                imageAdjust: collection.imageAdjust ?? null,
                tint:
                  shelfTint(collection.slug) ?? cover.art?.glow ?? "#ef4444",
                hrefLabel: dict.home.signatureCta,
              };
            })}
          />
        </section>
      ) : null}

      {/* ====== Closing CTA — layered depth scene: watermark parallax (z-0) →
            glow (z-1) → drifting orbs (z-2) → sparks (z-5) → glass card
            (z-10) → bottom fade (z-20). "Join thousands who chose to
            live the moment." lives on the glass layer ====== */}
      <CtaScene glow={heroProduct?.art.glow ?? "#ef4444"}>
        <FadeIn y={20}>
          <WordReveal
            as="h2"
            text={dict.home.ctaTitle}
            delay={0.1}
            className="font-display text-3xl font-bold text-balance sm:text-5xl"
          />
        </FadeIn>
        <FadeIn delay={0.3} y={20}>
          <p className="mx-auto max-w-xl leading-relaxed text-muted-foreground">
            {dict.home.ctaText}
          </p>
        </FadeIn>
        <FadeIn delay={0.5} y={20}>
          <Magnetic strength={0.25}>
            <span className="btn-conic-ring inline-flex">
              <Button
                render={<Link href={`/${locale}/catalog`} />}
                size="lg"
                className="h-12 rounded-full px-10 text-base"
              >
                {dict.home.ctaButton}
              </Button>
            </span>
          </Magnetic>
        </FadeIn>
      </CtaScene>
    </main>
  );
}
