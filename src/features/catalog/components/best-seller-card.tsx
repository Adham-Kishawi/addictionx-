"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowUpRight, Flame } from "lucide-react";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

// ============================================================
// BEST SELLERS CARD (wave 35) — the section's card redesign:
//   • the perfume NAME sits clearly UNDER the image (not over it)
//   • a glass card with a glow that wakes on hover + a rank number
//   • idle life: the bottle floats slowly and the glow breathes,
//     hover zooms the bottle, sweeps a shine bar and slides up a
//     Discover pill — stronger motion + a moment of visual wow
//   • scroll entry lives in the parent's RevealStagger grid
// ============================================================

export function BestSellerCard({
  product,
  locale,
  rank,
}: {
  product: Product;
  locale: Locale;
  rank: number;
}) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const href = `/${locale}/product/${product.slug}`;
  const glow = product.art?.glow ?? "#ef4444";

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Breathing aura behind the card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `radial-gradient(60% 60% at 50% 30%, ${glow}55 0%, transparent 70%)`,
        }}
        animate={
          reduce ? undefined : { opacity: hovered ? [0.5, 0.9, 0.5] : 0 }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <Link href={href} className="block outline-none">
        {/* ===== Image stage ===== */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:border-primary/50 group-hover:shadow-[0_0_70px_-18px_oklch(0.6_0.22_22/0.55)]">
          {/* Art / photo backdrop */}
          <motion.div
            className="absolute inset-0"
            animate={reduce ? undefined : { scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.08, 0.24, 1] }}
          >
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <ProductArt
                product={product}
                showName={false}
                className="h-full w-full"
              />
            )}
          </motion.div>

          {/* Neon wash on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(80% 60% at 50% 30%, ${glow}40 0%, transparent 70%)`,
            }}
          />

          {/* Sweeping shine bar */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[240%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[460%]"
          />

          {/* Rank number */}
          <div className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 backdrop-blur-md">
            <Flame className="size-3 text-primary" />
            <span className="text-xs font-bold tracking-[0.2em] text-foreground">
              {String(rank).padStart(2, "0")}
            </span>
          </div>

          {/* Floating bottle (idle life) */}
          {!product.image && (
            <motion.div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
              animate={
                reduce
                  ? undefined
                  : { y: [0, -9, 0], scale: hovered ? 1.08 : 1 }
              }
              transition={
                reduce
                  ? undefined
                  : {
                      y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.7, ease: [0.34, 1.08, 0.24, 1] },
                    }
              }
            >
              <ProductArt
                product={{ art: product.art, nameEn: product.nameEn }}
                showName={false}
                className="h-3/5 w-3/5"
              />
            </motion.div>
          )}

          {/* Discover pill slides up on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
            <span className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_38px_-8px_theme(colors.red.600)]">
              {dict.home.carouselExplore}
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
            </span>
          </div>
        </div>

        {/* ===== Name + price UNDER the image ===== */}
        <div className="px-1 pt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold leading-tight text-foreground">
              {name}
            </h3>
            <span className="mt-0.5 flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-3.5 fill-primary text-primary" />
              {product.rating}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted-foreground">
              {dict.product.currency}
            </span>
            {product.compareAtPrice != null &&
              product.compareAtPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
