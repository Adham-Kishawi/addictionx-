"use client";

import { useEffect, useRef, useState } from "react";
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
// ASSEMBLY SHOWCASE — the section right after the hero
// (wave 31 — walid's GSAP spec: «هحط فيديو أخرجه لفريمات بـ
// ffmpeg و استخدم GSAP عشان تظبط حركة الانيميشن مع السكرول»).
//
// walid filmed a REAL product-assembly animation (the bottle's
// pieces fly together) and I turned it into a **frame sequence**
// (`public/uploads/explode/assembly-sprite.jpg`): 120 frames at
// 640×360 laid out on ONE 8×15 spritesheet (5120×5400 — inside
// the browser's texture limit), built with ffmpeg (`scale=640:360,
// fps=12` → every 2nd of the 240 original frames) + cv2 grid.
//
// The scrub itself is GSAP **ScrollTrigger** (loaded via dynamic
// import per the project rule — the ONLY scroll-driven animation
// in GSAP, everything else stays framer-motion):
//   trigger = the 300vh section · start "top top" · end "bottom
//   bottom" · scrub 0.6 · onUpdate maps progress → frame index →
//   `background-position` on the sprite div (`-col*640px
//   -row*360px`). The sprite box is aspect 128:135 (the sprite's
//   own ratio) with `background-size: cover` so every cell renders
//   pixel-exact — the product assembles 1:1 with the wheel.
//
// The rest of the stage is unchanged from the depth ladder: hue
// backdrops, pulsing heartbeat pattern, watermark, floor shadow,
// floating glass chip (z+60) + pulsing-neon CTA (z+120), and the
// wave-8 details strip with its quarterly hand-off. Reduced
// motion → the LAST sprite cell (the fully assembled product).
// ============================================================

type Slot = {
  key: string;
  label: string;
  notes: string[];
};

// The GSAP-scrubbed assembly sequence.
const SPRITE = "/uploads/explode/assembly-sprite.jpg";
const SPRITE_COLS = 8;
const SPRITE_ROWS = 15;
const SPRITE_FRAMES = SPRITE_COLS * SPRITE_ROWS; // 120
const SPRITE_W = 640;
const SPRITE_H = 360;
// Last cell = the fully assembled product (reduced-motion static).
const LAST_X = -(SPRITE_COLS - 1) * SPRITE_W;
const LAST_Y = -(SPRITE_ROWS - 1) * SPRITE_H;

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
  const spriteRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const href = `/${locale}/product/${product.slug}`;

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // ============ GSAP ScrollTrigger — the assembly scrub (wave 31) ============
  // Loaded lazily per the project rule (GSAP only via dynamic import).
  // The 300vh section is already CSS-sticky, so no GSAP pin is needed —
  // ScrollTrigger only measures the range and scrubs the sprite position.
  useEffect(() => {
    const section = ref.current;
    const sprite = spriteRef.current;
    if (!section || !sprite) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let killed = false;
    let st: { kill: () => void } | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.set(sprite, { backgroundPosition: "0px 0px" });
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(
            SPRITE_FRAMES - 1,
            Math.max(0, Math.round(self.progress * (SPRITE_FRAMES - 1))),
          );
          const col = idx % SPRITE_COLS;
          const row = Math.floor(idx / SPRITE_COLS);
          gsap.set(sprite, {
            backgroundPosition: `${-col * SPRITE_W}px ${-row * SPRITE_H}px`,
          });
        },
      });
    })();

    return () => {
      killed = true;
      st?.kill();
    };
  }, []);

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

        {/* THE ASSEMBLY — GSAP ScrollTrigger scrubs the spritesheet's
            background-position 1:1 with the wheel (wave 31) */}
        <div className="relative z-10 flex h-[52vh] w-full items-center justify-center px-6 [perspective:1200px]">
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              ref={spriteRef}
              role="img"
              aria-label={name}
              className="relative h-full max-w-[76vw] aspect-[128/135] bg-cover"
              style={{
                backgroundImage: `url(${SPRITE})`,
                backgroundSize: "cover",
                backgroundPosition: `${LAST_X}px ${LAST_Y}px`,
                filter: `drop-shadow(0 0 60px oklch(0.6 0.22 22 / 0.2))`,
              }}
            />
          </div>
        </div>

        {/* Floating glass chip — collection · name · rating (z+60) */}
        <motion.div
          className="pointer-events-none absolute right-[4vw] top-[14%] hidden rounded-2xl border border-white/10 bg-card/60 px-4 py-3 backdrop-blur-md sm:block"
          style={
            reduce ? undefined : { z: chipZ, y: chipY, opacity: chipOpacity }
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
          style={reduce ? undefined : { z: ctaZ, y: ctaY, opacity: ctaOpacity }}
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
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
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
