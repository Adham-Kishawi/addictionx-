import Link from "next/link";
import { Star, Flame } from "lucide-react";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { WishlistButton } from "@/components/wishlist-button";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  locale,
  className,
  wishlisted = null,
}: {
  product: Product;
  locale: Locale;
  className?: string;
  wishlisted?: boolean | null;
}) {
  const dict = getDictionary(locale);
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const isAr = locale === "ar";

  return (
    <div
      className={cn(
        "group relative transition-transform duration-300 hover:-translate-y-1.5",
        className,
      )}
    >
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_-12px_oklch(0.6_0.22_22/0.55)]"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <ProductArt
            product={product}
            showName={!isAr || true}
            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          />

          {/* Neon glow that fades in on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(85% 65% at 50% 35%, oklch(0.6 0.22 22 / 0.35), transparent 70%)",
            }}
          />

          {/* Sweeping light bar (shine sweep) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
          />

          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-primary-foreground">
                {dict.product.new}
              </span>
            )}
            {product.isBestseller && (
              <span className="flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-foreground backdrop-blur">
                <Flame className="size-3 text-primary" />
                {dict.product.bestseller}
              </span>
            )}
            {product.compareAtPrice != null &&
              product.compareAtPrice > product.price && (
                <span className="rounded-full bg-destructive px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-destructive-foreground">
                  {dict.product.sale}
                </span>
              )}
          </div>

          {wishlisted !== null && (
            <div className="absolute top-3 end-3">
              <WishlistButton
                productId={product.id}
                initial={wishlisted}
                labels={{
                  add: dict.account.addToWishlist,
                  remove: dict.account.removeFromWishlist,
                }}
                className="size-9"
              />
            </div>
          )}

          {product.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium">
                {dict.product.outOfStock}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold leading-tight">
              {name}
            </h3>
            <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-primary text-primary" />
              {product.rating}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-muted-foreground">
                {dict.product.currency}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {dict.product[product.gender]}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
