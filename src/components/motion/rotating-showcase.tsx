"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

// ============================================================
// ASSEMBLY SHOWCASE — full-bleed, frame-scrubbed by GSAP (wave
// 31b — walid: «احذف أي حاجة تانية من السكشن غير زر SHOP NOW…
// الأولوية القصوى للفيديو يتعرض بمرونة وياخد عرض الشاشة»).
//
// The walid-made assembly video (`Perfume_product_assembly_…mp4`)
// was turned into ALL its native frames — ffmpeg at the video's
// native 24fps / 1280×720 (`public/uploads/explode/frames/
// f0001..f0239.jpg`, ~10.7MB — everything on the 10s of film, so
// the scroll divides into the finest possible steps, the silkiest
// scrub). The section
// shows the sequence as a FULL-BLEED video filling the whole
// screen (like the hero) — NOT a square sprite box. GSAP
// ScrollTrigger (dynamic import, per the project rule) scrubs the
// scroll as the section passes through the viewport. Smoothness: TWO
// stacked imgs crossfade — the base frame is scrubbed 1:1 and the
// NEXT frame fades over it by the fractional progress, so the
// assembly glides like the video itself instead of stepping between
// frames (wave 31c — walid: «الحركة تكون سموث أكتر من كده»).
// The ONLY other element is the SHOP NOW button (fades in as the
// product completes) — it links to the GENERAL catalog (wave 31f).
// Reduced motion → the last frame (fully assembled), static.
// ============================================================

const FRAME_COUNT = 239;
const FRAMES_BASE = "/uploads/explode/frames";

const frameSrc = (idx: number) =>
  `${FRAMES_BASE}/f${String(Math.min(FRAME_COUNT, idx + 1)).padStart(4, "0")}.jpg`;

export function RotatingShowcase({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
  collectionNames?: Record<string, { nameAr: string; nameEn: string }>;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgNextRef = useRef<HTMLImageElement | null>(null);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  // SHOP NOW goes to the GENERAL catalog — not a specific product
  // (wave 31f — walid: «توسعق الان تاخدني على الـ SHOP بشكل عام مش منتج معين»).
  const href = `/${locale}/catalog`;

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  // GSAP ScrollTrigger — scrub the frame with the wheel (wave 31b).
  useEffect(() => {
    const section = ref.current;
    const img = imgRef.current;
    const imgNext = imgNextRef.current;
    if (!section || !img || !imgNext) return;
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

      // Preload every frame so blended swaps are instant.
      for (let i = 0; i < FRAME_COUNT; i++) {
        const pre = new Image();
        pre.src = frameSrc(i);
      }

      // Crossfade scrub: img shows the base frame, imgNext is layered
      // directly ABOVE it with opacity = fractional progress — the
      // assembly glides between frames instead of stepping.
      imgNext.style.opacity = "0";
      st = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const raw = self.progress * (FRAME_COUNT - 1);
          const base = Math.min(FRAME_COUNT - 2, Math.max(0, Math.floor(raw)));
          const frac = Math.min(1, Math.max(0, raw - base));
          if (img.dataset.idx !== String(base)) {
            img.dataset.idx = String(base);
            img.src = frameSrc(base);
          }
          if (imgNext.dataset.idx !== String(base + 1)) {
            imgNext.dataset.idx = String(base + 1);
            imgNext.src = frameSrc(base + 1);
          }
          imgNext.style.opacity = String(frac);
        },
      });
    })();

    return () => {
      killed = true;
      st?.kill();
    };
  }, []);

  // SHOP NOW fades in as the product completes.
  const shopOpacity = useTransform(scrollYProgress, [0.72, 0.88], [0, 1]);
  const shopY = useTransform(scrollYProgress, [0.72, 0.9], [26, 0]);

  return (
    // 85vh stage — SHORTER than the hero (100dvh). No sticky pin: a
    // pinned full-screen stage physically needs a section taller than
    // the viewport, so the whole block now scrolls WITH the page and
    // the GSAP trigger spans "top bottom → bottom top" — the section
    // is shorter than the hero AND the frames glide across ~185vh of
    // scroll, giving the smoothest scrub yet (wave 31g).
    <section
      ref={ref}
      className="relative h-[85vh] w-full overflow-hidden bg-black"
      aria-label={name}
    >
      {/* FULL-BLEED assembly video — frame-scrubbed by GSAP */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={frameSrc(FRAME_COUNT - 1)}
        alt={name}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
      {/* Crossfade layer — the NEXT frame fades over the base frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgNextRef}
        src={frameSrc(FRAME_COUNT - 1)}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />

      {/* Edge veils — the section melts into the page (same --hero-veil-4
            pattern the hero uses: background-color at 0% → transparent), so the
            hard top/bottom cut lines disappear and the video feels part of the
            site in BOTH themes (dark blends into dark, light melts into light) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[14vh]"
        style={{
          background:
            "linear-gradient(to bottom, var(--hero-veil-4) 0%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[18vh]"
        style={{
          background:
            "linear-gradient(to top, var(--hero-veil-4) 0%, transparent 100%)",
        }}
      />

      {/* The only other element — SHOP NOW */}
      <motion.div
        className="absolute inset-x-0 bottom-[10vh] flex justify-center"
        style={reduce ? undefined : { opacity: shopOpacity, y: shopY }}
      >
        <Link
          href={href}
          className="flex h-14 items-center gap-2 rounded-full bg-primary px-10 text-lg font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_40px_-6px_theme(colors.red.600)] backdrop-blur-sm transition-transform hover:scale-105"
        >
          {dict.common.shopNow}
        </Link>
      </motion.div>
    </section>
  );
}
