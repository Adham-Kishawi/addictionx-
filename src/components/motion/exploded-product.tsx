"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

// ============================================================
// EXPLODED PRODUCT — the bestseller card as a 5-layer float in
// perspective 1200px (wave plan #1, refined wave 34d):
//   z-120 heartbeat pattern (blurred neon) · z-60 glow (screen)
//   z-0 the bottle · z+60 glass text chip · z+120 the CTA
// Wave 34d: the scroll entry moved to the parent grid's stagger
// (RevealStagger in page.tsx) so cards rise ONE BY ONE in story
// order; here HOVER splits the layers (±35% depth), the bottle
// turns rotateY 18° and settles with a gentle zoom — restrained.
// ============================================================

const LAYERS = [
  { z: -120, kind: "pattern" },
  { z: -60, kind: "glow" },
  { z: 0, kind: "bottle" },
  { z: 60, kind: "text" },
  { z: 120, kind: "cta" },
] as const;

export function ExplodedProduct({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const href = `/${locale}/product/${product.slug}`;
  const glow = product.art?.glow ?? "#ef4444";

  return (
    <motion.div
      className="relative aspect-[3/4] w-full"
      initial={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ perspective: 1200 }}
    >
      <Link href={href} className="block h-full w-full outline-none">
        <div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {LAYERS.map((layer) => (
            <motion.div
              key={layer.kind}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformStyle: "preserve-3d" }}
              animate={
                reduce || !hovered
                  ? { z: layer.z }
                  : {
                      z: layer.z * 1.35,
                      rotateY: layer.kind === "bottle" ? 18 : 0,
                      scale: layer.kind === "bottle" ? 1.04 : 1,
                    }
              }
              transition={{ type: "spring", stiffness: 170, damping: 30 }}
            >
              {layer.kind === "pattern" && (
                <div
                  aria-hidden
                  className="flex w-4/5 flex-col gap-2 opacity-20 blur-[6px]"
                >
                  <HeartbeatLine className="h-16 w-full text-primary" />
                  <HeartbeatLine className="h-16 w-full text-primary" />
                  <HeartbeatLine className="h-16 w-full text-primary" />
                </div>
              )}

              {layer.kind === "glow" && (
                <div
                  aria-hidden
                  className="size-[88%] rounded-full mix-blend-screen"
                  style={{
                    background: `radial-gradient(60% 60% at 50% 50%, ${glow}66 0%, transparent 70%)`,
                  }}
                />
              )}

              {layer.kind === "bottle" &&
                (product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={name}
                    draggable={false}
                    className="max-h-[74%] w-auto max-w-[86%] object-contain select-none [filter:drop-shadow(0_0_40px_oklch(0.6_0.22_22/0.35))_drop-shadow(0_24px_40px_rgba(0,0,0,0.55))]"
                  />
                ) : (
                  <ProductArt product={product} className="h-[74%] w-[86%]" />
                ))}

              {layer.kind === "text" && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  <p className="font-display text-lg font-bold leading-tight">
                    {name}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-muted-foreground">
                      {dict.product.currency}
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Star className="size-3 fill-primary text-primary" />
                      {product.rating}
                    </span>
                  </div>
                </div>
              )}

              {layer.kind === "cta" && (
                <span className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_38px_-8px_theme(colors.red.600)] transition-shadow duration-300 group-hover:shadow-[0_0_48px_-6px_theme(colors.red.500)]">
                  <ShoppingBag className="size-4" />
                  {dict.product.addToCart}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
