"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductArt } from "@/features/catalog/components/product-art";
import { WishlistButton } from "@/components/wishlist-button";
import { cn } from "@/lib/utils";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { collectionBackdrop } from "@/features/catalog/data/collection-assets";
import type { Locale, Dictionary } from "@/lib/i18n/dictionary";

// ============================================================
// Roles carousel — one product from each collection (wave 34c:
// compact editorial edition — smaller stage, tighter spread,
// mouse-drag physics with a spring settle instead of a bare
// threshold swipe; the role-swap below still uses CSS
// transitions — the project's documented performance exception).
//
// Core idea: we don't move any element from place to place — each element
// asks "what is my role now?" and applies its own style. When activeIndex changes
// the roles swap and the CSS transition is what sees the difference and performs the motion.
// Therefore here **CSS transitions not Framer Motion** — an intentional exception
// to the project rule and its reason is performance (recorded in CLAUDE.md).
// With 3 items the back role is disabled so left == back never conflicts.
// ============================================================

type Role = "center" | "left" | "right" | "back";

const ROLE_STYLES: Record<
  Role,
  {
    scale: number;
    blur: number;
    opacity: number;
    z: number;
    left: number;
    height: number;
  }
> = {
  // Wave 34c: compact editorial proportions — the center keeps the stage
  // authority (scale 1) but the side roles spread at a gentler 0.55 and
  // fade further, so the whole scene reads as a small theatre, not a screen.
  center: { scale: 1, blur: 0, opacity: 1, z: 20, left: 50, height: 100 },
  left: { scale: 0.55, blur: 3, opacity: 0.7, z: 10, left: 18, height: 58 },
  right: { scale: 0.55, blur: 3, opacity: 0.7, z: 10, left: 82, height: 58 },
  back: { scale: 0.45, blur: 5, opacity: 0.45, z: 5, left: 50, height: 46 },
};

const ANIM_MS = 650;
const SWIPE_THRESHOLD = 60;
const DRAG_FOLLOW = 0.35;
// Ease-out: roles glide into place and settle — no mechanical snap.
// Wave 34c: opens with a touch of spring (0.34/1.08) in front of the tail.
const EASE = "cubic-bezier(0.34, 1.08, 0.24, 1)";

function slideLabel(product: Product) {
  return `${product.nameAr} — ${product.nameEn}`;
}

export function ProductCarousel({
  products,
  locale,
  wishlistIds,
  dict,
  collectionNames,
}: {
  products: Product[];
  locale: Locale;
  wishlistIds: string[] | null;
  dict: Dictionary;
  collectionNames?: Record<string, { nameAr: string; nameEn: string }>;
}) {
  const reduce = useReducedMotion();

  const total = products.length;
  const isRtl = locale === "ar";

  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  // Wave 34c — drag physics: the stage follows the pointer elastically
  // (DRAG_FOLLOW) while held, then the spring carries it back to 0 while
  // the role swap plays — a soft "throw-and-settle" instead of a snap.
  const stageX = useMotionValue(0);
  const springX = useSpring(stageX, { stiffness: 320, damping: 26, mass: 0.6 });

  const center = active;
  const right = (active + 1) % total;
  const left = (active + total - 1) % total;
  const back = total > 3 ? (active + 2) % total : null;

  const roleOf = useCallback(
    (i: number): Role => {
      if (i === center) return "center";
      if (i === right) return "right";
      if (i === left) return "left";
      if (back !== null && i === back) return "back";
      return "center";
    },
    [center, right, left, back],
  );

  const goTo = useCallback(
    (i: number) => {
      if (!inViewRef.current || isAnimating) return;
      const target = ((i % total) + total) % total;
      if (target === active) return;
      setIsAnimating(true);
      setActive(target);
    },
    [isAnimating, active, total],
  );

  const goPrev = useCallback(() => goTo(left), [goTo, left]);
  const goNext = useCallback(() => goTo(right), [goTo, right]);

  // Release the lock exactly after the transition ends (matches ANIM_MS)
  useEffect(() => {
    if (!isAnimating) return;
    const t = window.setTimeout(() => setIsAnimating(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [isAnimating]);

  // ============ Pointer drag (mouse + touch) — wave 34c ============
  const onPointerDown = (e: React.PointerEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointerRef.current;
    if (!p.active) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    // Vertical swipe = page scroll — we never intercept it
    if (Math.abs(dy) > Math.abs(dx)) {
      p.active = false;
      stageX.set(0);
      return;
    }
    // Elastic follow while held (clamped so it feels like a rubber band)
    stageX.set(
      isAnimating ? 0 : Math.max(-170, Math.min(170, dx * DRAG_FOLLOW)),
    );
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = pointerRef.current;
    if (!p.active) return;
    p.active = false;
    const dx = e.clientX - p.x;
    if (Math.abs(dx) >= SWIPE_THRESHOLD && !isAnimating) {
      // In RTL the logical directions are reversed
      const dir = dx < 0 ? 1 : -1;
      goTo(active + dir * (isRtl ? -1 : 1));
    }
    // Spring settles the stage back to rest while the roles glide
    stageX.set(0);
  };

  // ============ Pause off-screen ============
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ============ Keyboard (RTL-aware) ============
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + (isRtl ? -1 : 1));
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active + (isRtl ? 1 : -1));
    }
  };

  const activeProduct = products[active];
  if (!activeProduct) return null;

  const transition = reduce
    ? "none"
    : `transform ${ANIM_MS}ms ${EASE}, filter ${ANIM_MS}ms ${EASE}, opacity ${ANIM_MS}ms ${EASE}, left ${ANIM_MS}ms ${EASE}`;

  return (
    <section className="relative overflow-hidden border-y border-border bg-card/40 py-10">
      {/* ===== Per-collection identity background (wave 8) =====
            One layer per product, each carrying the collection's glow tint +
            giant collection name behind the stage. Active index crossfades
            via CSS opacity — the whole backdrop changes identity when the
            carousel turns. */}
      {products.map((product, i) => {
        const isActive = active === i;
        const cn = collectionNames?.[product.collection];
        const wordmark = isRtl
          ? (cn?.nameAr ?? product.nameAr)
          : (cn?.nameEn ?? product.nameEn);
        return (
          <div
            key={`identity-${product.id}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              opacity: isActive ? 1 : 0,
              transition: `opacity ${ANIM_MS}ms ${EASE}`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(60% 50% at 50% 55%, ${product.art.glow}2e, transparent 70%)`,
              }}
            />
            {/* The collection's ambient backdrop (wave 10) — masked so it
                  melts into the dark page instead of sitting as a box */}
            {(() => {
              const bg = collectionBackdrop(product.collection);
              if (!bg) return null;
              return (
                <img
                  src={bg}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover opacity-40 [mask-image:radial-gradient(80%_70%_at_50%_45%,black_30%,transparent_75%)]"
                />
              );
            })()}
            <div
              dir={isRtl ? "rtl" : "ltr"}
              className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 select-none justify-center overflow-hidden whitespace-nowrap"
            >
              <span
                className="font-display text-[14vw] font-bold leading-none lg:text-[10vw]"
                style={{
                  color: "transparent",
                  WebkitTextStroke: `1px ${product.art.glow}40`,
                }}
              >
                {wordmark}
              </span>
            </div>
          </div>
        );
      })}

      {/* Giant text — always Latin, not read from the dictionary */}
      <div
        aria-hidden
        dir="ltr"
        className="pointer-events-none absolute inset-x-0 bottom-[-2%] z-0 flex select-none justify-center overflow-hidden whitespace-nowrap"
      >
        <span
          className="font-display text-[16vw] font-bold leading-none lg:text-[12vw]"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.07)",
          }}
        >
          ADDICTIONX
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Feel the Rush"
          title={dict.home.carouselTitle}
          subtitle={dict.home.carouselSubtitle}
        />

        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-center gap-7">
            {/* ===== Stage ===== */}
            <div
              ref={stageRef}
              role="region"
              aria-roledescription="carousel"
              aria-label={dict.home.carouselTitle}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative aspect-[0.85/1] w-full max-w-[220px] touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:max-w-sm lg:max-w-md"
            >
              {/* Wave 34c — the whole stage rides the drag spring */}
              <motion.div
                aria-hidden
                className="absolute inset-0"
                style={reduce ? undefined : { x: springX }}
              >
                {products.map((product, i) => {
                  const role = roleOf(i);
                  const s = ROLE_STYLES[role];
                  const isCenter = role === "center";
                  return (
                    <div
                      key={product.id}
                      className="absolute"
                      style={{
                        bottom: 0,
                        left: `${s.left}%`,
                        width: "60%",
                        aspectRatio: "0.6 / 1",
                        transform: `translateX(-50%) scale(${s.scale})`,
                        opacity: s.opacity,
                        zIndex: s.z,
                        filter: reduce ? "none" : `blur(${s.blur}px)`,
                        transition,
                        willChange: isAnimating
                          ? "transform, filter, opacity"
                          : "auto",
                      }}
                    >
                      {isCenter ? (
                        <Link
                          href={`/${locale}/product/${product.slug}`}
                          aria-label={slideLabel(product)}
                          className="block h-full w-full focus-visible:outline-none"
                          draggable={false}
                        >
                          <SlideImage product={product} priority />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          tabIndex={-1}
                          aria-hidden="true"
                          className="block h-full w-full cursor-pointer focus-visible:outline-none"
                        >
                          <SlideImage product={product} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* ===== Active product info ===== */}
            <div className="flex flex-col items-center gap-2 text-center">
              {/* Collection identity chip (wave 8) */}
              {(() => {
                const cn = collectionNames?.[activeProduct.collection];
                if (!cn) return null;
                return (
                  <span className="mb-1 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        background: activeProduct.art.glow,
                        boxShadow: `0 0 10px ${activeProduct.art.glow}`,
                      }}
                    />
                    {isRtl ? cn.nameAr : cn.nameEn}
                  </span>
                );
              })()}
              <h3 className="font-display text-lg font-bold sm:text-xl">
                {locale === "ar" ? activeProduct.nameAr : activeProduct.nameEn}
              </h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {formatPrice(activeProduct.price)} {dict.product.currency}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <WishlistButton
                  productId={activeProduct.id}
                  initial={wishlistIds?.includes(activeProduct.id) ?? false}
                  labels={{
                    add: dict.account.addToWishlist,
                    remove: dict.account.removeFromWishlist,
                  }}
                  className="size-9"
                />
                <Button
                  render={
                    <Link href={`/${locale}/product/${activeProduct.slug}`} />
                  }
                  size="lg"
                  className="h-10 rounded-full px-6"
                >
                  {dict.home.carouselExplore}
                </Button>
              </div>
            </div>

            {/* ===== Navigation buttons ===== */}
            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={goPrev}
                aria-label={dict.home.carouselPrev}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <ArrowLeft className="size-5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={dict.home.carouselNext}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <ArrowRight className="size-5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Screen-reader announcement — outside the Reveal so it doesn't shake with the roles */}
        <div className="sr-only" aria-live="polite">
          {dict.home.carouselItem} {active + 1} {dict.home.carouselOf} {total} —{" "}
          {locale === "ar" ? activeProduct.nameAr : activeProduct.nameEn}
        </div>
      </div>
    </section>
  );
}

function SlideImage({
  product,
  priority,
}: {
  product: Product;
  priority?: boolean;
}) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt=""
        fill
        sizes="(min-width:1024px) 560px, (min-width:640px) 500px, 320px"
        className="object-contain object-bottom"
        priority={priority}
        draggable={false}
      />
    );
  }
  return (
    <ProductArt product={product} className="h-full w-full" showName={false} />
  );
}
