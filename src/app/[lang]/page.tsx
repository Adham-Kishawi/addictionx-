import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedTitle } from "@/components/motion/animated-title";
import { ParticleField } from "@/components/motion/particle-field";
import { HeroVideoScrub } from "@/components/motion/hero-video-scrub";
import { HeroParallax } from "@/components/motion/hero-parallax";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { FadeIn } from "@/components/motion/fade-in";
import { WordReveal } from "@/components/motion/word-reveal";
import { RevealStagger, RevealItem } from "@/components/motion/reveal";
import { Marquee } from "@/components/motion/marquee";
import { StatsBand } from "@/components/motion/stats-band";
import { SectionGlow } from "@/components/motion/section-glow";
import { CtaScene } from "@/components/motion/cta-scene";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ProductArt } from "@/features/catalog/components/product-art";
import { ProductCarousel } from "@/features/catalog/components/product-carousel";
import { type Product } from "@/features/catalog/data/products";
import {
  getProducts,
  getCollections,
} from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const allProducts = await getProducts();
  const collections = await getCollections();
  const wishlist = await getWishlistIds();
  const bestsellers = allProducts.filter((p) => p.isBestseller).slice(0, 4);
  const heroProduct = allProducts[0] ?? null;

  // Carousel: one product from each collection — we prefer the product that has an image.
  // The slider images are fixed per collection (the three bottle icons) and are shown
  // first; if the collection is missing from the map we fall back to the product image then ProductArt.
  const carouselImages: Record<string, string> = {
    rush: "/slider/rush.png",
    noir: "/slider/noir.png",
    gold: "/slider/gold.png",
  };
  const carouselProducts = collections
    .map((c) => {
      const inCollection = allProducts.filter((p) => p.collection === c.slug);
      if (inCollection.length === 0) return null;
      const first = inCollection.find((p) => p.image) ?? inCollection[0];
      const slider = carouselImages[c.slug];
      return slider ? { ...first, image: slider } : first;
    })
    .filter((p): p is Product => p !== null);
  const totalReviews = allProducts.reduce((s, p) => s + p.reviewsCount, 0);
  const topRating = allProducts.reduce(
    (top, p) => (p.rating > top ? p.rating : top),
    0,
  );

  return (
    <main>
      {/* ====== HERO — cinematic scene: the video stays dark in BOTH themes (black product footage
            cannot go light), but the veil/bg follow the theme via --hero-* vars so the hero melts
            into the page below. HeroParallax slides three layers at different scroll speeds
            (backdrop slow + zoom, veil mid, content fast fade) — the depth that makes the
            next sections feel like they're rolling OVER the hero ====== */}
      <HeroParallax
        backdrop={<HeroVideoScrub />}
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
          <div className="flex flex-col items-center gap-6 px-6 pt-20 text-center">
            <FadeIn delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-1.5 text-xs tracking-[0.25em] text-red-400 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_4px_24px_rgba(0,0,0,0.45)]">
                <Sparkles className="size-3.5" />
                {dict.hero.badge}
              </span>
            </FadeIn>

            <AnimatedTitle text={dict.hero.title} />

            <FadeIn delay={0.5}>
              <HeartbeatLine className="h-10 w-56 text-red-500 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.6))_drop-shadow(0_4px_24px_rgba(0,0,0,0.45))]" />
            </FadeIn>

            <FadeIn delay={0.6}>
              <p className="max-w-xl text-base leading-relaxed text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_4px_24px_rgba(0,0,0,0.45)] sm:text-lg">
                {dict.hero.subtitle}
              </p>
            </FadeIn>

            <FadeIn delay={0.75}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  render={<Link href={`/${locale}/catalog`} />}
                  size="lg"
                  className="h-12 rounded-full px-8 text-base shadow-[0_0_30px_-8px_theme(colors.red.600)]"
                >
                  {dict.hero.ctaPrimary}
                </Button>
                <Button
                  render={<Link href={`/${locale}/catalog`} />}
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/30 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
                >
                  {dict.hero.ctaSecondary}
                </Button>
              </div>
            </FadeIn>
          </div>
        }
        indicator={
          <FadeIn
            delay={1.2}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <span className="flex flex-col items-center gap-1 text-xs text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
              {dict.hero.scroll}
              <span className="block size-4 animate-bounce border-b-2 border-r-2 border-primary rotate-45" />
            </span>
          </FadeIn>
        }
      />

      {/* ====== Moving words strip — pinned under the header while the next sections
            slide beneath it (bombon-style sticky layer) ====== */}
      <Marquee
        items={dict.home.ticker}
        className="sticky top-16 z-20 border-y border-border bg-card/40 py-4 backdrop-blur-md"
      />

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
      />

      {/* ====== Most wanted ====== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <SectionHeading
            eyebrow="ADDICTIONX"
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

        <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {bestsellers.map((product: Product) => (
            <RevealItem key={product.id}>
              <ProductCard
                product={product}
                locale={locale}
                wishlisted={wishlist?.includes(product.id) ?? null}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </section>

      {/* ====== Collections ====== */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10">
          <SectionHeading
            eyebrow="Feel the Rush"
            title={dict.home.collectionsTitle}
            subtitle={dict.home.collectionsSubtitle}
          />
        </div>

        <RevealStagger className="grid gap-4 sm:grid-cols-3 lg:gap-6">
          {collections.map((collection) => {
            const collectionProducts = allProducts.filter(
              (p) => p.collection === collection.slug,
            );
            const cover =
              collectionProducts[0] ??
              ({
                id: `c-${collection.slug}`,
                slug: collection.slug,
                nameAr: collection.nameAr,
                nameEn: collection.nameEn,
                descriptionAr: "",
                descriptionEn: "",
                price: 0,
                gender: "unisex",
                collection: collection.slug,
                notes: { top: [], heart: [], base: [] },
                rating: 0,
                reviewsCount: 0,
                isNew: false,
                isBestseller: false,
                art: { from: "#1e1b4b", to: "#020617", glow: "#6366f1" },
              } satisfies Product);
            return (
              <RevealItem key={collection.slug}>
                <Link
                  href={`/${locale}/collections/${collection.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border shadow-[0_15px_50px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_0_50px_-14px_oklch(0.6_0.22_22/0.6)]"
                >
                  <ProductArt
                    product={cover}
                    showName={false}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-6 text-center">
                    <h3 className="font-display text-xl font-bold text-white">
                      {locale === "ar" ? collection.nameAr : collection.nameEn}
                    </h3>
                    <span className="flex items-center gap-1 text-sm text-white/80 transition-colors group-hover:text-primary">
                      {dict.home.viewAll}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </section>

      {/* ====== Experience strip — glow drifts on its own scroll layer ====== */}
      <section className="relative overflow-hidden border-y border-border bg-card/40 py-20">
        <SectionGlow background="radial-gradient(60% 80% at 50% 0%, oklch(0.6 0.22 22 / 0.12), transparent 70%)" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <WordReveal
            as="h2"
            text={dict.home.experienceTitle}
            className="font-display text-3xl font-bold sm:text-4xl"
          />
          <FadeIn delay={0.15}>
            <p className="max-w-2xl leading-relaxed text-muted-foreground">
              {dict.home.experienceText}
            </p>
          </FadeIn>

          {/* Perks */}
          <RevealStagger className="mt-4 grid w-full gap-4 sm:grid-cols-3">
            {[
              { icon: Truck, text: dict.cart.shippingNotice },
              { icon: ShieldCheck, text: dict.product.from },
              { icon: Sparkles, text: dict.product.notes },
            ].map(({ icon: Icon, text }, idx) => (
              <RevealItem key={idx}>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_0_30px_-12px_oklch(0.6_0.22_22/0.5)]">
                  <Icon className="size-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ====== Closing CTA — layered depth scene: watermark parallax (z-0) →
            glow (z-1) → drifting orbs (z-2) → sparks (z-5) → glass card
            (z-10) → bottom fade (z-20). "Join thousands who chose to
            live the moment." lives on the glass layer ====== */}
      <CtaScene glow={heroProduct?.art.glow ?? "#ef4444"}>
        <FadeIn>
          <WordReveal
            as="h2"
            text={dict.home.ctaTitle}
            className="font-display text-3xl font-bold sm:text-5xl"
          />
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mx-auto max-w-xl text-muted-foreground">
            {dict.home.ctaText}
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <span className="btn-conic-ring inline-flex">
            <Button
              render={<Link href={`/${locale}/catalog`} />}
              size="lg"
              className="h-12 rounded-full px-10 text-base"
            >
              {dict.home.ctaButton}
            </Button>
          </span>
        </FadeIn>
      </CtaScene>
    </main>
  );
}
