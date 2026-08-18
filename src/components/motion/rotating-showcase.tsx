"use client";

import { useRef, useState } from "react";
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
// ASSEMBLY SHOWCASE — full-bleed, VIDEO-scrubbed by GSAP.
//
// The walid-made assembly film is played as a REAL `<video>` element
// (h264) and GSAP ScrollTrigger scrubs its `currentTime` with the
// wheel — so the eye sees actual 24fps motion, NOT images swapping
// (wave 31l — walid: «محتاج أحس إني بتفرج على فيديو مش صورة بتتغير
// مع كل سكرول»). The clip is re-encoded ALL-INTRА — every frame is
// a keyframe I-frame (`-g 1 -bf 0`, ~6.9MB) so seeking presents the
// EXACT frame instantly with no inter-frame decode chains and no
// visible frame-stepping (wave 31m — walid: «لسه صور مفيش إحساس
// الفيديو والتنقل بين الفريمات»).
//
// Section = 95vh, shorter than the hero; the trigger spans
// "top bottom → bottom bottom": the assembly COMPLETES exactly when
// the section is fully in view (wave 31j), then the assembled
// product + SHOP NOW ride up out of view. The scrub is eased
// (easeInOutCubic, wave 31k) so it starts soft, flows mid-flight
// and settles gently. Full width + soft 3-stop veils (waves 31i).
// SHOP NOW → general catalog (wave 31f). Reduced motion → the last
// frame (fully assembled), static.
// ============================================================

const VIDEO_SRC = "/uploads/explode/assembly-scrub.mp4";

// easeInOutCubic — soft start / flow / gentle settle (wave 31k).
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function RotatingShowcase({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
  collectionNames?: Record<string, { nameAr: string; nameEn: string }>;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
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

  // SHOP NOW fades in as the product completes — driven by the SAME
  // eased progress as the video so they stay in sync.
  const easedProgress = useTransform(scrollYProgress, (v) => easeInOut(v));
  const shopOpacity = useTransform(easedProgress, [0.72, 0.88], [0, 1]);
  const shopY = useTransform(easedProgress, [0.72, 0.9], [26, 0]);

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
      {/* Native playback is more reliable than scroll-seeking a large video,
          especially on mobile, and avoids loading GSAP for this section. */}
      <video
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        loop
        // This component is lazy-mounted below the hero. Loading the entire
        // 7 MB scrub clip immediately delays the storefront unnecessarily.
        preload="metadata"
        poster={product.image}
        onError={() => setVideoFailed(true)}
        aria-label={name}
        className={`absolute inset-0 h-full w-full select-none object-cover ${
          videoFailed ? "hidden" : ""
        }`}
      />
      {videoFailed ? (
        <img
          src={product.image}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

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
