"use client";

import { useRef, useState } from "react";
import {
  motion,
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
// ROTATING SHOWCASE — the centerpiece (wave plan #2). A 300vh
// pinned stage right after the hero: the hero product turns on
// its axis (-36°→36° rotateY, perspective 1400) bound to scroll,
// a light sheen sweeps the bottle, the background hue drifts
// red → gold → silver, and a persistent details strip under the
// bottle hands over top/heart/base → price+CTA across the four
// quarters. The photo layer swaps front → real gallery → side →
// back → front (wave 8: real product.images[] first, classic 4-view
// fallback when the DB has no photos). True 360° needs an 8-angle
// photo set (requested from walid) — this is the single-image
// "presentation turn" illusion, honest about the flatness.
// ============================================================

type Slot = {
  key: string;
  label: string;
  notes: string[];
};

function TurnView({
  src,
  alt,
  progress,
  points,
  className,
}: {
  src: string;
  alt: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  points: { i: number[]; o: number[] };
  className: string;
}) {
  const opacity = useTransform(progress, points.i, points.o);
  return (
    <motion.img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{ opacity }}
    />
  );
}

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
    "opacity 650ms cubic-bezier(0.4,0,0.2,1), transform 650ms cubic-bezier(0.4,0,0.2,1)";
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

  const rotateY = useTransform(scrollYProgress, [0, 1], [-36, 36]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.72, 1, 0.9]);
  const sheenX = useTransform(scrollYProgress, [0, 1], ["-180%", "180%"]);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.3], [0.45, 0.1]);

  // ============ The turn (wave 8): real product.images[] first, then the
  // side/back photo set, always ending back on the front view. Products with
  // a real gallery spin through their own photos; the classic 4-view
  // front→side→back→front remains the fallback for DB products with no photos.
  const frontView = product.image ?? "/uploads/prodact.png";
  const extras = (product.images ?? []).filter(
    (src) =>
      src !== frontView &&
      src !== "/uploads/back.png" &&
      src !== "/uploads/side.png",
  );
  const mid: string[] = [...extras.slice(0, 4)];
  if (!mid.includes("/uploads/side.png")) mid.push("/uploads/side.png");
  if (!mid.includes("/uploads/back.png")) mid.push("/uploads/back.png");
  const start = mid.lastIndexOf(frontView);
  if (start !== -1) mid.splice(start, 1);
  const views = [frontView, ...mid, frontView].slice(0, 6);
  const n = views.length;

  const turnPoints = views.map((_, i) => {
    const k = i;
    const i0 = k === 0 ? 0.02 : k / n + 0.015;
    const i1 = Math.min(k / n + 0.09, 1);
    const i2 = Math.max((k + 1) / n - 0.09, 0);
    const i3 = k === n - 1 ? 1 : (k + 1) / n - 0.015;
    return {
      src: views[k],
      i: [i0, i1, i2, i3],
      o: k === n - 1 ? [0, 1, 1, 1] : [0, 1, 1, 0],
    };
  });

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
    [0, 0.5, 1],
    [0.7, 1.15, 0.9],
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

        {/* The turning bottle — photo swaps across front/side/back/front */}
        <motion.div
          className="relative z-10 flex w-full items-center justify-center px-6"
          style={
            reduce ? undefined : { rotateY, scale, transformPerspective: 1400 }
          }
        >
          {reduce ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frontView}
              alt={name}
              draggable={false}
              className="max-h-[56vh] w-auto max-w-[74vw] select-none object-contain [filter:drop-shadow(0_0_80px_oklch(0.6_0.22_22/0.4))_drop-shadow(0_40px_80px_rgba(0,0,0,0.6))]"
            />
          ) : (
            turnPoints.map((view, i) => (
              <TurnView
                key={`${view.src}-${i}`}
                src={view.src}
                alt={name}
                progress={scrollYProgress}
                points={view}
                className="absolute inset-0 m-auto max-h-[56vh] w-auto max-w-[74vw] select-none object-contain [filter:drop-shadow(0_0_80px_oklch(0.6_0.22_22/0.4))_drop-shadow(0_40px_80px_rgba(0,0,0,0.6))]"
              />
            ))
          )}

          {/* Sweeping sheen over the glass */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent mix-blend-soft-light"
              style={{ x: sheenX }}
            />
          )}
        </motion.div>

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
