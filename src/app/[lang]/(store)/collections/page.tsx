import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ProductArt } from "@/features/catalog/components/product-art";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  getProducts,
  getCollections,
} from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { SectionGlow } from "@/components/motion/section-glow";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { collectionBackdrop } from "@/features/catalog/data/collection-assets";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";

  const [allProducts, collections, wishlist] = await Promise.all([
    getProducts(),
    getCollections(),
    getWishlistIds(),
  ]);

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <SectionGlow />
      {/* Title — writes itself word by word while you scroll */}
      <ScrollWordReveal
        as="h1"
        text={dict.collectionsPage.title}
        className="mb-2 font-display text-4xl font-bold"
      />
      <p className="mb-12 text-muted-foreground">
        {dict.collectionsPage.subtitle}
      </p>

      {/* Collection cards */}
      <div className="flex flex-col gap-12">
        {collections.map((collection) => {
          const collectionProducts = allProducts.filter(
            (p) => p.collection === collection.slug,
          );
          const cover =
            collectionProducts.find((p) => p.image) ?? collectionProducts[0];

          return (
            <section
              key={collection.slug}
              className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center"
            >
              {/* Collection cover + intro — 3D tilt + floating glow orb */}
              <Reveal y={30}>
                <TiltCard className="h-full">
                  <Link
                    href={`/${locale}/collections/${collection.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border transition-shadow duration-500 hover:border-primary/40 hover:shadow-[0_0_45px_-14px_oklch(0.6_0.22_22/0.6)]"
                  >
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={isRtl ? collection.nameAr : collection.nameEn}
                        fill
                        sizes="(min-width:1024px) 320px, (min-width:640px) 50vw, 90vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        draggable={false}
                      />
                    ) : cover ? (
                      <ProductArt
                        product={cover}
                        showName={false}
                        className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      (() => {
                        const bg = collectionBackdrop(collection.slug);
                        return bg ? (
                          <Image
                            src={bg}
                            alt=""
                            fill
                            sizes="(min-width:1024px) 320px, (min-width:640px) 50vw, 90vw"
                            className="object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="h-full w-full bg-card" />
                        );
                      })()
                    )}

                    {/* Floating glow orb from the collection's own accent */}
                    {cover ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -top-10 start-1/2 z-[1] h-44 w-44 rounded-full opacity-70 mix-blend-screen"
                        style={{
                          background: `radial-gradient(50% 50% at 50% 50%, ${cover.art.glow}80, transparent 70%)`,
                          animation: "orb-drift 14s ease-in-out infinite",
                        }}
                      />
                    ) : null}

                    <div className="absolute inset-0 z-[2] flex flex-col items-center justify-end gap-1 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-center">
                      <h2 className="font-display text-2xl font-bold text-white">
                        {isRtl ? collection.nameAr : collection.nameEn}
                      </h2>
                      {(() => {
                        const caption = isRtl
                          ? collection.descriptionAr
                          : collection.descriptionEn;
                        if (!caption) return null;
                        return (
                          <p className="line-clamp-2 text-sm text-white/80">
                            {caption}
                          </p>
                        );
                      })()}
                      <span className="flex items-center gap-1 text-sm text-white/85 transition-colors group-hover:text-primary">
                        {collectionProducts.length}{" "}
                        {dict.collectionsPage.products}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>

              {/* Collection products */}
              {collectionProducts.length > 0 ? (
                <RevealStagger
                  className={cn(
                    "grid grid-cols-2 gap-4 sm:grid-cols-3",
                    isRtl && "border-r-0",
                  )}
                >
                  {collectionProducts.slice(0, 3).map((product) => (
                    <RevealItem key={product.id}>
                      <TiltCard className="h-full">
                        <ProductCard
                          product={product}
                          locale={locale}
                          wishlisted={wishlist?.includes(product.id) ?? null}
                        />
                      </TiltCard>
                    </RevealItem>
                  ))}
                </RevealStagger>
              ) : (
                <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                  {dict.collectionsPage.empty}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
