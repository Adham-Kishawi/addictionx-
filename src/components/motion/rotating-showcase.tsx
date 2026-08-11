"use client";

import { useRef } from "react";
import {
  motion,
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
// a light sheen sweeps the bottle, three note panels slide in
// and out through clip-mask style reveals (one per quarter),
// the background hue drifts red → gold → silver, and the last
// quarter hands over price + CTA. True 360° needs an 8-angle
// photo set (requested from walid) — this is the single-image
// "presentation turn" illusion, honest about the flatness.
// ============================================================

type Panel = {
  label: string;
  notes: string[];
  side: "start" | "end";
  span: [number, number];
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

function NotePanel({
  panel,
  progress,
  isAr,
}: {
  panel: Panel;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  isAr: boolean;
}) {
  const [a, b] = panel.span;
  const in0 = a + 0.02;
  const in1 = a + 0.14;
  const out0 = b - 0.12;
  const out1 = b;
  const dir = panel.side === "start" ? (isAr ? 1 : -1) : isAr ? -1 : 1;
  const opacity = useTransform(progress, [in0, in1, out0, out1], [0, 1, 1, 0]);
  const x = useTransform(
    progress,
    [in0, in1, out0, out1],
    [dir * 90, 0, 0, -dir * 90],
  );

  return (
    <motion.div
      className={`absolute top-1/2 z-[5] hidden w-72 max-w-[24vw] md:block ${
        panel.side === "start" ? "start-6 lg:start-16" : "end-6 lg:end-16"
      }`}
      style={{ opacity, x }}
    >
      <div className="-translate-y-1/2 rounded-2xl border border-white/10 bg-card/60 p-5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {panel.label}
        </span>
        <ul className="flex flex-wrap gap-1.5">
          {panel.notes.map((note) => (
            <li
              key={note}
              className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs"
            >
              {note}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function RotatingShowcase({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
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

  // Multi-angle turn: the visible photo swaps front → side → back → front
  // across the scroll (walid's back.png + side.png turn this into a real
  // spin). Four crossfaded views, each handed off to the next.
  const frontView = product.image ?? "/uploads/prodact.png";
  const turnViews = [
    { src: frontView, i: [0.02, 0.24, 0.24, 0.26], o: [0, 1, 1, 0] },
    { src: "/uploads/side.png", i: [0.24, 0.26, 0.49, 0.51], o: [0, 1, 1, 0] },
    { src: "/uploads/back.png", i: [0.49, 0.51, 0.74, 0.76], o: [0, 1, 1, 0] },
    { src: frontView, i: [0.74, 0.76, 1, 1], o: [0, 1, 1, 1] },
  ];
  const floorScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.7, 1.15, 0.9],
  );

  // Background hue drift across the turn: red → gold → silver
  const redO = useTransform(scrollYProgress, [0, 0.3, 0.5], [0.75, 1, 0]);
  const goldO = useTransform(scrollYProgress, [0.28, 0.5, 0.72], [0, 1, 0]);
  const silverO = useTransform(scrollYProgress, [0.55, 0.78, 1], [0, 1, 0.85]);

  const panels: Panel[] = [
    {
      label: dict.product.topNotes,
      notes: product.notes?.top ?? [],
      side: "start",
      span: [0.06, 0.3],
    },
    {
      label: dict.product.heartNotes,
      notes: product.notes?.heart ?? [],
      side: "end",
      span: [0.32, 0.55],
    },
    {
      label: dict.product.baseNotes,
      notes: product.notes?.base ?? [],
      side: "start",
      span: [0.57, 0.8],
    },
  ];

  const ctaOpacity = useTransform(scrollYProgress, [0.78, 0.9], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.78, 0.92], [40, 0]);

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
            turnViews.map((view, i) => (
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

        {/* Note panels — one per quarter of the turn */}
        {!reduce &&
          panels.map((panel) => (
            <NotePanel
              key={panel.label}
              panel={panel}
              progress={scrollYProgress}
              isAr={isAr}
            />
          ))}

        {/* Final quarter: price + CTA handed over */}
        <motion.div
          className="absolute bottom-[8vh] z-[5] flex flex-col items-center gap-3 px-6 text-center"
          style={reduce ? undefined : { opacity: ctaOpacity, y: ctaY }}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold">
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
          <Link
            href={href}
            className="group/btn flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_35px_-8px_theme(colors.red.600)] transition-shadow hover:shadow-[0_0_50px_-6px_theme(colors.red.500)]"
          >
            {dict.product.addToCart}
            <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
