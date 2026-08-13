"use client";

import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

// ============================================================
// EXPLODED PRODUCT LAYERS — the depth centrepiece right after
// the hero (wave 30, AI_UI_BRIEF §5.1). A 300vh pinned stage
// built from walid's four real transparent cutouts of the Red
// Rush bottle (`public/uploads/explode/*.png`), re-aligned onto
// ONE shared 1024×1536 canvas (`aligned/` — measured registration,
// the reassembled union reconstructs 94% of the bottle's
// silhouette) and stacked as CSS layers inside a 1200px
// perspective:
//   · BODY   — z0, the glass (flies in from depth −40)
//   · LIQUID — +26 above the body, rises on hover
//   · CAP    — the top piece, flies in from the DEEPEST (−280)
//              and on hover LIFTS off the neck (translateY −26
//              + translateZ 70) — the "disassembly"
//   · whole group rotateY 15° on hover + sheen sweep
// Scroll owns the ASSEMBLY: entry (0→0.5) flies the pieces in
// from their different depths, exit (0.85→1) disassembles them
// apart again. Floating FRONT layers complete the ladder:
//   · z+60  glass chip (collection · name · rating, parallax)
//   · z+120 CTA button with a PULSING NEON shadow (last quarter)
// Behind (z-): pulsing heartbeat-line pattern (blurred red),
// circular red glow (screen blend), watermark, floor shadow.
// The wave-8 details strip keeps its quarterly hand-off
// (top→heart→base→price). Reduced motion → the static assembled
// cutout + chip + CTA, no transforms.
// ============================================================

type Slot = {
  key: string;
  label: string;
  notes: string[];
};

// The four cutouts — cap/body/liquid are pre-aligned on the same canvas.
const BOTTLE_IMG = "/uploads/explode/bottle.png";
const CAP_IMG = "/uploads/explode/aligned/cap.png";
const BODY_IMG = "/uploads/explode/aligned/body.png";
const LIQUID_IMG = "/uploads/explode/aligned/liquid.png";

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

  // ============ Scroll ASSEMBLY → the complete product ============
  // (wave 30c — walid's spec: «السائل تحت الجسم و عند لحظة معينة في
  // الاسكرول يتجمعوا و يبقوا المنتج كامل اللي هي صورة ال bottle»).
  // `a` = assembly progress: 0 = pieces stacked apart, 1 = fully
  // assembled. It rises over the entry (0→0.55), holds through the
  // middle, and reverses on the exit (0.85→1) so the bottle
  // disassembles as you leave. Z-order is LIQUID under BODY under
  // CAP (the liquid sits behind the glass, the cap on top). At the
  // END of the assembly the master `bottle.png` fades in — the
  // pieces have converged onto its exact pixels by then (measured
  // registration), so the swap is the "now it is the full product"
  // beat, not a jump. Hover still lifts the pieces apart (springy
  // 0→1) — but only while the bottle is assembled.
  const hoverP = useMotionValue(0);
  const a = useTransform(scrollYProgress, [0, 0.55, 0.85, 1], [0, 1, 1, 0]);

  // Travel: cap rides down from ABOVE, liquid rides up from BELOW the
  // glass, body settles from a slightly smaller scale.
  const capTravelY = useTransform(a, (v) => (1 - v) * -150);
  const liquidTravelY = useTransform(a, (v) => (1 - v) * 150);
  const bodyTravelScale = useTransform(a, (v) => 1 - (1 - v) * 0.07);

  // Hover disassembly (only meaningful once assembled).
  const capHoverY = useTransform(hoverP, (v) => v * -46);
  const capHoverScale = useTransform(hoverP, (v) => 1 + v * 0.05);
  const liquidHoverY = useTransform(hoverP, (v) => v * -20);
  const bodyHoverScale = useTransform(hoverP, (v) => 1 + v * 0.02);
  const rotateY = useTransform(hoverP, (v) => v * 15);

  // Combined per axis (travel + hover).
  const capY = useTransform(
    [capTravelY, capHoverY],
    ([x, h]: number[]) => x + h,
  );
  const capScale = useTransform(
    [bodyTravelScale, capHoverScale],
    ([x, h]: number[]) => x * h,
  );
  const liquidY = useTransform(
    [liquidTravelY, liquidHoverY],
    ([x, h]: number[]) => x + h,
  );
  const bodyScale = useTransform(
    [bodyTravelScale, bodyHoverScale],
    ([x, h]: number[]) => x * h,
  );

  // The complete-product reveal: bottle.png fades in at the end of the
  // assembly, and hides again while the hover disassembly is on.
  const assembleReveal = useTransform(a, [0.78, 1], [0, 1]);
  const hoverHide = useTransform(hoverP, (v) => 1 - v);
  const bottleOpacity = useTransform(
    [assembleReveal, hoverHide],
    ([r, h]: number[]) => r * h,
  );
  const piecesOpacity = useTransform(bottleOpacity, (v) => 1 - v);
  const piecesPointer = useTransform(piecesOpacity, (v) =>
    v > 0.5 ? "auto" : "none",
  );

  // ============ Floating FRONT layers ============
  const chipZ = useTransform(scrollYProgress, [0, 1], [30, 60]);
  const chipY = useTransform(scrollYProgress, [0, 1], [10, -16]);
  const chipOpacity = useTransform(scrollYProgress, [0.12, 0.3], [0, 1]);
  const ctaZ = useTransform(scrollYProgress, [0, 1], [60, 120]);
  const ctaOpacity = useTransform(scrollYProgress, [0.74, 0.88], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.74, 0.9], [34, 0]);

  // Back layers
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.3], [0.45, 0.1]);
  const floorScale = useTransform(
    scrollYProgress,
    [0, 0.35, 0.55, 1],
    [0.7, 1.14, 1.15, 0.9],
  );

  // ============ Details strip (wave 8): quarterly hand-off ============
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

  const layers = reduce ? null : (
    <>
      {/* LIQUID — UNDER the body (it sits behind the glass wall), rides
          up into the bottle from below as the scroll assembles */}
      <motion.img
        src={LIQUID_IMG}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ y: liquidY }}
      />
      {/* BODY — the glass, over the liquid, under the cap */}
      <motion.img
        src={BODY_IMG}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ scale: bodyScale }}
      />
      {/* CAP — rides down from above and lands on the neck; lifts off on
          hover */}
      <motion.img
        src={CAP_IMG}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ y: capY, scale: capScale }}
      />
    </>
  );

  return (
    <section ref={ref} className="relative h-[300vh]" aria-label={name}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* Pulsing heartbeat-line pattern (deepest) */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 opacity-15 blur-[6px]"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 26px, oklch(0.62 0.22 22 / 0.9) 26px 44px)",
              maskImage:
                "radial-gradient(60% 70% at 50% 45%, black, transparent 75%)",
            }}
            animate={{
              backgroundPositionX: [0, 120, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Circular glow — screen blend, behind the bottle */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `radial-gradient(46% 52% at 50% 46%, ${glow}59, transparent 70%)`,
            mixBlendMode: "screen",
            opacity: reduce ? 1 : undefined,
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

        {/* THE EXPLODED BOTTLE — perspective stage (wave 30).
            Siblings sit at real translateZ depths; the whole group
            rotates 15° toward the viewer on hover. */}
        <div className="relative z-10 flex h-[54vh] w-full items-center justify-center px-6 [perspective:1200px]">
          <motion.div
            className="relative flex h-full w-full items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
            onHoverStart={() =>
              animate(hoverP, reduce ? 0 : 1, {
                type: "spring",
                stiffness: 160,
                damping: 22,
              })
            }
            onHoverEnd={() =>
              animate(hoverP, 0, {
                type: "spring",
                stiffness: 160,
                damping: 22,
              })
            }
          >
            {/* Assembled bottle group — the master cutout, always whole */}
            <motion.div
              className="relative h-full w-auto max-w-[70vw]"
              style={
                reduce
                  ? undefined
                  : {
                      scale: bodyTravelScale,
                      rotateY,
                      transformStyle: "preserve-3d",
                    }
              }
            >
              <div className="relative aspect-[2/3] h-full w-auto">
                {reduce ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={BOTTLE_IMG}
                    alt={name}
                    className="h-full w-full object-contain drop-shadow-[0_0_50px_oklch(0.6_0.22_22/0.25)]"
                  />
                ) : (
                  <>
                    {/* The COMPLETE PRODUCT — fades in when the pieces
                        finish assembling (the assembly beat) and hides
                        while the hover disassembly is active */}
                    <motion.img
                      src={BOTTLE_IMG}
                      alt={name}
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_0_50px_oklch(0.6_0.22_22/0.25)]"
                      style={{ opacity: bottleOpacity }}
                    />
                    {/* The pieces — visible until they converge, then
                        the full product takes over */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        opacity: piecesOpacity,
                        pointerEvents: piecesPointer,
                      }}
                    >
                      {layers}
                      {/* Sheen sweep over the glass */}
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent mix-blend-soft-light"
                        animate={{
                          x: ["-120%", "120%"],
                          opacity: [0, 0.6, 0],
                        }}
                        transition={{
                          duration: 3.4,
                          repeat: Infinity,
                          repeatDelay: 2.2,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Floating glass chip — collection · name · rating (z+60) */}
            <motion.div
              className="pointer-events-none absolute right-[4vw] top-[14%] hidden rounded-2xl border border-white/10 bg-card/60 px-4 py-3 backdrop-blur-md sm:block"
              style={
                reduce
                  ? undefined
                  : { z: chipZ, y: chipY, opacity: chipOpacity }
              }
            >
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ background: glow, boxShadow: `0 0 10px ${glow}` }}
                />
                {collectionName}
              </span>
              <p className="mt-1 max-w-40 truncate font-display text-sm font-bold">
                {name}
              </p>
              <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-primary text-primary" />
                {product.rating}
              </span>
            </motion.div>

            {/* Floating CTA — pulsing neon shadow (z+120), last quarter */}
            <motion.div
              className="absolute bottom-[20%] right-[6vw] hidden sm:block"
              style={
                reduce ? undefined : { z: ctaZ, y: ctaY, opacity: ctaOpacity }
              }
            >
              <motion.div
                className="rounded-full"
                animate={
                  reduce
                    ? undefined
                    : {
                        boxShadow: [
                          `0 0 22px -6px ${glow}cc`,
                          `0 0 46px -4px ${glow}`,
                          `0 0 22px -6px ${glow}cc`,
                        ],
                      }
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Link
                  href={href}
                  className="group/btn flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground"
                >
                  {dict.product.addToCart}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Floor shadow under the bottle */}
        <motion.div
          aria-hidden
          className="absolute bottom-[15vh] left-1/2 z-[2] h-8 w-[34vw] -translate-x-1/2 rounded-[100%] bg-black/50 blur-2xl"
          style={reduce ? undefined : { scaleX: floorScale }}
        />

        {/* Details strip — identity + quarterly hand-off (wave 8) */}
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
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
