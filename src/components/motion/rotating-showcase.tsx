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
// shows the sequence FULL-BLEED across the whole width (wave 31i:
// walid «محتاج ياخد العرض كامل») with soft 3-stop veils at the
// edges so the video enters/exits the section cleanly. GSAP
// ScrollTrigger (dynamic import, per the project rule) scrubs the
// scroll while the 95vh section crosses the viewport, and the
// assembly COMPLETES exactly when the section is fully in view
// (wave 31j). Smoothness: TWO stacked imgs crossfade — the base frame is scrubbed 1:1 and the
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
    offset: ["start end", "end end"],
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
        // The assembly COMPLETES the moment the section is fully in view
        // (its bottom hits the viewport bottom) — then the assembled
        // product rides up out of view (wave 31j — walid: «مع انتهاء
        // السكشن يكون كل الانيميشن خلص»).
        end: "bottom bottom",
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
    // 95vh stage — a bit bigger (wave 31j: walid «كبر السكشن أكبر
    // شوية بيه ميكونش كبير أوي»), still under the hero (100dvh). No
    // sticky pin: the block scrolls WITH the page and the GSAP trigger
    // spans "top bottom → bottom bottom" — the assembly finishes
    // EXACTLY when the section is fully in view (wave 31j), then the
    // assembled product + SHOP NOW ride up out of view.
    <section
      ref={ref}
      className="relative h-[95vh] w-full overflow-hidden bg-background"
      aria-label={name}
    >
      {/* FULL-bleed assembly video — full WIDTH again (wave 31i — walid:
          «محتاج الفيديو ياخد العرض كامل») — object-cover, and the section
          edges are soft 3-stop fades so the video ENTERS/EXITS the section
          cleanly instead of a hard crop (walid: «خالص نضيف مع خروجه من السكشن») */}
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

      {/* Soft 3-stop edge veils — solid page-bg at the border → translucent
          mid → transparent: the video melts cleanly out of the section (no
          hard cut), with lower opacity than the old band (wave 31i) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[14vh]"
        style={{
          background:
            "linear-gradient(to bottom, var(--hero-veil-4) 0%, color-mix(in oklab, var(--background) 30%, transparent) 60%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[16vh]"
        style={{
          background:
            "linear-gradient(to top, var(--hero-veil-4) 0%, color-mix(in oklab, var(--background) 30%, transparent) 60%, transparent 100%)",
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
