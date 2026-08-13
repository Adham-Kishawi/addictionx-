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
// was turned into 120 ffmpeg frames at the video's NATIVE
// 1280×720 (`public/uploads/explode/frames/f0001..f0120.jpg` —
// every 2nd frame of the 240, full quality, ~5.6MB). The section
// shows the sequence as a FULL-BLEED video filling the whole
// screen (like the hero) — NOT a square sprite box. GSAP
// ScrollTrigger (dynamic import, per the project rule) scrubs the
// scroll over the 240vh pinned section. Smoothness: TWO stacked
// imgs crossfade — the base frame is scrubbed 1:1 and the NEXT
// frame fades over it by the fractional progress, so the assembly
// glides like the video itself instead of stepping between frames
// (wave 31c — walid: «الحركة تكون سموث أكتر من كده»). The ONLY
// other element is the SHOP NOW button (fades in as the product
// completes). Reduced motion → the last frame (fully assembled),
// static.
// ============================================================

const FRAME_COUNT = 120;
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
  const href = `/${locale}/product/${product.slug}`;

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
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
        start: "top top",
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
    <section ref={ref} className="relative h-[240vh]" aria-label={name}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
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
      </div>
    </section>
  );
}
