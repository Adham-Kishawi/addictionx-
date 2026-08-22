import type { Metadata } from "next";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { ProductCard } from "@/features/catalog/components/product-card";
import { getProducts } from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { SectionGlow } from "@/components/motion/section-glow";
import { TiltCard } from "@/components/motion/tilt-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  return {
    title: dict.account.wishlist,
    description: dict.meta.description,
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const [allProducts, wishlistIds] = await Promise.all([
    getProducts(),
    getWishlistIds(),
  ]);

  const wishlistedProducts = (wishlistIds && wishlistIds.length > 0)
    ? allProducts.filter((p) => wishlistIds.includes(p.id))
    : [];

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <SectionGlow />
      <Reveal>
        <header className="mb-8 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            ADDICTIONX
          </span>
          <h1 className="text-4xl font-bold font-display sm:text-5xl">
            {dict.account.wishlist}
          </h1>
          <p className="text-muted-foreground">
            {wishlistedProducts.length > 0
              ? String(wishlistedProducts.length) + " " + dict.collectionsPage.products
              : dict.account.noWishlist}
          </p>
        </header>
      </Reveal>

      {wishlistedProducts.length > 0 ? (
        <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {wishlistedProducts.map((product) => (
            <RevealItem key={product.id}>
              <TiltCard className="h-full">
                <ProductCard
                  product={product}
                  locale={locale}
                  wishlisted={true}
                />
              </TiltCard>
            </RevealItem>
          ))}
        </RevealStagger>
      ) : (
        <div className="flex flex-col items-center gap-4 py-24 text-center rounded-3xl border border-dashed border-border bg-card/30 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-card text-muted-foreground border border-border">
            <Heart className="size-8" />
          </div>
          <h2 className="text-xl font-bold">{dict.account.noWishlist}</h2>
          <Link
            href={"/" + locale + "/catalog"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow transition-transform hover:scale-105"
          >
            <span>{dict.common.shopNow}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      )}
    </main>
  );
}
