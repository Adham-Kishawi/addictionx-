import Link from "next/link";
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
      {/* Title */}
      <Reveal>
        <header className="mb-12 flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold">
            {dict.collectionsPage.title}
          </h1>
          <p className="text-muted-foreground">
            {dict.collectionsPage.subtitle}
          </p>
        </header>
      </Reveal>

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
              {/* Collection cover + intro */}
              <Reveal y={isRtl ? 30 : 30}>
                <Link
                  href={`/${locale}/collections/${collection.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border transition-shadow duration-500 hover:border-primary/40 hover:shadow-[0_0_45px_-14px_oklch(0.6_0.22_22/0.6)]"
                >
                  {cover ? (
                    <ProductArt
                      product={cover}
                      showName={false}
                      className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-card" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-center">
                    <h2 className="font-display text-2xl font-bold text-white">
                      {isRtl ? collection.nameAr : collection.nameEn}
                    </h2>
                    <span className="flex items-center gap-1 text-sm text-white/85 transition-colors group-hover:text-primary">
                      {collectionProducts.length}{" "}
                      {collectionProducts.length === 1
                        ? dict.collectionsPage.products
                        : dict.collectionsPage.products}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </Link>
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
                      <ProductCard
                        product={product}
                        locale={locale}
                        wishlisted={wishlist?.includes(product.id) ?? null}
                      />
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
