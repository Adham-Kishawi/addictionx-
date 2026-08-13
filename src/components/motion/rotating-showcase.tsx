"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { ScrollScrubVideo } from "./scroll-scrub-video";

// ============================================================
// ROTATING SHOWCASE — the depth centrepiece right after the hero
// (wave 29). A 300vh pinned stage where the SCROLL IS THE
// TURNTABLE: the real 360° footage (`public/360/animation.mp4`)
// turns the bottle exactly one full turn as you scroll through
// the stage — the user "turns the product with the wheel"
// (the ui-skill `useVideoScrub` pattern, scroll-flavoured —
// frame-gated paused seeks, so the end-restart zone is
// structurally unreachable). Around the turning bottle a full
// DEPTH ladder (the project's wave-9 depth language):
//   z-0 hue-drift backdrop (red → gold → silver)
//   z-1 giant watermark (far layer)
//   z-2 floor shadow
//   z-10 the bottle in a PICTURE-PLANE dolly: it pushes IN with
//        scroll — scale 0.6→1, depth-of-field blur 10px→0, a
//        subtle orbit tilt (rotateX/rotateY) and y-drift, all in
//        a 1200px perspective container;
//   z-5 sheen sweep over the glass · z-6 details strip.
// The details strip (wave 8) is unchanged: collection + name
// always on, top→heart→base→price hand-off across the quarters,
// CTA in the last quarter. Reduced motion → static poster frame.
// ============================================================

type Slot = {
  key: string;
  label: string;
  notes: string[];
};

// Poster = the static front frame of the scroll-scrubbed 360 clip.
const FRONT_FRAME = "/360/frame-01.png";

// A single detail slot inside the strip — notes chips or price; the active
// quarter owns it via CSS opacity/translate (children animate, the glass never).
function StripSlot({
  slot,
  active,
  priceSlot,
}: {
  slot: Slot | null;
  active: boolean;
  priceSlot: React.ReactNode;
}) {
  const transition =
    "opacity 700ms cubic-bezier(0.22,0.61,0.36,1), transform 700ms cubic-bezier(0.22,0.61,0.36,1)";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(14px)",
        transition,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {slot ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {slot.label}
          </span>
          {slot.notes.length > 0 ? (
            <ul className="flex flex-wrap items-center justify-center gap-1.5">
              {slot.notes.map((note) => (
                <li
                  key={note}
                  className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        priceSlot
      )}
    </div>
  );
}

export function RotatingShowcase({
  product,
  locale,
  collectionNames,
}: {
  product: Product;
  locale: Locale;
  collectionNames?: Record<string, { nameAr: string; nameEn: string }>;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const href = `/${locale}/product/${product.slug}`;

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // ============ Depth ladder — scroll-driven transforms (wave 29) ============
  // The dolly: the bottle pushes IN from a distance (scale + depth-of-field
  // blur clearing), orbiting slightly in a 1200px perspective so the turn
  // reads as a real object turning in space, not a flat image.
  const bottleScale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8, 1],
    [0.6, 1.0, 0.98, 0.92],
  );
  const bottleBlur = useTransform(scrollYProgress, [0, 0.3], [10, 0]);
  const bottleFilter = useMotionTemplate`blur(${bottleBlur}px)`;
  const bottleRotateX = useTransform(scrollYProgress, [0, 0.5, 1], [7, 0, 3]);
  const bottleRotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);
  const bottleY = useTransform(scrollYProgress, [0, 0.5, 1], [46, 0, 14]);

  const sheenX = useTransform(scrollYProgress, [0, 1], ["-180%", "180%"]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.3], [0.45, 0.1]);

  // ============ Details strip (wave 8): a persistent glass bar under the
  // bottle — collection chip + name always on, the middle slot hands over
  // top → heart → base → price across the four quarters, and the CTA slides
  // in for the last quarter. Children animate, the glass itself never does.
  const [quarter, setQuarter] = useState(reduce ? 3 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    const q = v < 0.31 ? 0 : v < 0.56 ? 1 : v < 0.81 ? 2 : 3;
    setQuarter((prev) => (prev === q ? prev : q));
  });

  const slots: (Slot | null)[] = [
    {
      key: "top",
      label: dict.product.topNotes,
      notes: product.notes?.top ?? [],
    },
    {
      key: "heart",
      label: dict.product.heartNotes,
      notes: product.notes?.heart ?? [],
    },
    {
      key: "base",
      label: dict.product.baseNotes,
      notes: product.notes?.base ?? [],
    },
    null, // quarter 3 = price slot
  ];
  const collectionName = collectionNames?.[product.collection]
    ? isAr
      ? collectionNames[product.collection].nameAr
      : collectionNames[product.collection].nameEn
    : product.collection;
  const glow = product.art?.glow ?? "#ef4444";

  const ctaOpacity = useTransform(scrollYProgress, [0.78, 0.9], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.78, 0.92], [40, 0]);
  const floorScale = useTransform(
    scrollYProgress,
    [0, 0.35, 0.55, 1],
    [0.7, 1.14, 1.15, 0.9],
  );

  // Background hue drift across the turn: red → gold → silver
  const redO = useTransform(scrollYProgress, [0, 0.3, 0.5], [0.75, 1, 0]);
  const goldO = useTransform(scrollYProgress, [0.28, 0.5, 0.72], [0, 1, 0]);
  const silverO = useTransform(scrollYProgress, [0.55, 0.78, 1], [0, 1, 0.85]);

  return (
    <section ref={ref} className="relative h-[300vh]" aria-label={name}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* Hue drift backdrop */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 45%, oklch(0.62 0.19 25 / 0.28), transparent 70%)",
            opacity: reduce ? 1 : redO,
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 45%, oklch(0.72 0.14 70 / 0.24), transparent 70%)",
            opacity: reduce ? 0 : goldO,
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(60% 70% at 50% 45%, oklch(0.85 0.02 240 / 0.22), transparent 70%)",
            opacity: reduce ? 0 : silverO,
          }}
        />

        {/* Watermark behind the bottle */}
        <motion.span
          aria-hidden
          dir="ltr"
          className="text-watermark text-metallic-shine pointer-events-none absolute inset-0 z-[1] flex select-none items-center justify-center text-[16vw] font-bold"
          style={{ opacity: reduce ? 0.2 : watermarkOpacity }}
        >
          ADDICTIONX
        </motion.span>

        {/* The turning bottle — the SCROLL IS THE TURNTABLE (wave 29):
            one full 360° turn of `animation.mp4` per stage, scrubbed by
            scroll in a 1200px perspective dolly (push-in + orbit + DOF). */}
        <div className="relative z-10 flex h-[52vh] w-full items-center justify-center px-6 [perspective:1200px]">
          <motion.div
            className="relative flex h-full w-full items-center justify-center"
            style={
              reduce
                ? undefined
                : {
                    scale: bottleScale,
                    y: bottleY,
                    rotateX: bottleRotateX,
                    rotateY: bottleRotateY,
                    filter: bottleFilter,
                    transformStyle: "preserve-3d",
                  }
            }
          >
            <div
              className={`relative aspect-video h-full w-auto max-w-[74vw] ${
                reduce
                  ? ""
                  : "mix-blend-screen [filter:drop-shadow(0_0_60px_oklch(0.6_0.22_22/0.22))]"
              }`}
            >
              <ScrollScrubVideo
                progress={scrollYProgress}
                src="/360/animation.mp4"
                poster={FRONT_FRAME}
                className="absolute inset-0 h-full w-full object-contain"
              />

              {/* Sweeping sheen over the glass */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-soft-light"
                  style={{ x: sheenX }}
                />
              )}
            </div>
          </motion.div>
        </div>

        {/* Floor shadow under the bottle */}
        <motion.div
          aria-hidden
          className="absolute bottom-[16vh] left-1/2 z-[2] h-8 w-[38vw] -translate-x-1/2 rounded-[100%] bg-black/50 blur-2xl"
          style={reduce ? undefined : { scaleX: floorScale }}
        />

        {/* Details strip — persistent identity + quarterly hand-off (wave 8) */}
        <div className="absolute bottom-[4vh] left-1/2 z-[6] w-[min(94vw,880px)] -translate-x-1/2 px-4">
          <div className="rounded-2xl border border-white/10 bg-card/60 px-5 py-4 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-center">
              {/* Zone A — collection chip + product name (always on) */}
              <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      background: glow,
                      boxShadow: `0 0 10px ${glow}`,
                    }}
                  />
                  {collectionName}
                </span>
                <h2 className="max-w-[78vw] truncate font-display text-lg font-bold sm:max-w-xs sm:text-2xl">
                  {name}
                </h2>
              </div>

              {/* Zone B — quarterly slot: top → heart → base → price */}
              <div className="relative flex min-h-10 w-full flex-1 items-center justify-center sm:w-auto">
                {slots.map((slot, i) => (
                  <StripSlot
                    key={slot ? slot.key : "price"}
                    slot={slot}
                    active={quarter === i}
                    priceSlot={
                      <div className="flex flex-wrap items-baseline justify-center gap-2">
                        <span className="font-display text-2xl font-bold">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-muted-foreground">
                          {dict.product.currency}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="size-4 fill-primary text-primary" />
                          {product.rating}
                        </span>
                      </div>
                    }
                  />
                ))}
              </div>

              {/* Zone C — add-to-cart slides in for the last quarter */}
              <motion.div
                style={reduce ? undefined : { opacity: ctaOpacity, y: ctaY }}
              >
                <Link
                  href={href}
                  className="group/btn flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_35px_-8px_theme(colors.red.600)] transition-shadow hover:shadow-[0_0_50px_-6px_theme(colors.red.500)]"
                >
                  {dict.product.addToCart}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
