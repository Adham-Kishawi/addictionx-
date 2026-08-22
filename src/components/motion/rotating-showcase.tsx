"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Magnetic } from "@/components/motion/magnetic";
import { type Product } from "@/features/catalog/data/products";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

const VIDEO_SRC = "/uploads/explode/assembly-scrub.mp4";

export function RotatingShowcase({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
  collectionNames?: Record<string, { nameAr: string; nameEn: string }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVisibleRef = useRef(false);
  const targetTimeRef = useRef(0);
  const durRef = useRef(0);
  const rafRef = useRef<number>(0);
  const reduce = useReducedMotion();
  const dict = getDictionary(locale);
  const isAr = locale === "ar";
  const name = isAr ? product?.nameAr || "" : product?.nameEn || "";
  const href = `/${locale}/catalog`;

  // Video completes smoothly as section exits viewport - faster and eye-comfortable
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth easing for natural motion
  const easeProgress = useTransform(scrollYProgress, [0, 1], [0, 1], {
    ease: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, // easeInOutQuad
  });

  const shopOpacity = useTransform(easeProgress, [0.7, 0.95], [0, 1]);
  const shopY = useTransform(easeProgress, [0.7, 0.95], [20, 0]);
  const progressBarWidth = useTransform(easeProgress, [0, 1], ["0%", "100%"]);

  // Smooth playback rate control - NO SEEKING!
  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isVisibleRef.current) {
      rafRef.current = 0;
      return;
    }

    const dur = durRef.current || video.duration || 3;
    if (dur > 0) {
      const target = Math.max(0, Math.min(dur - 0.01, targetTimeRef.current));
      const current = video.currentTime || 0;
      const diff = target - current;

      // Use playbackRate instead of seeking for buttery smooth motion
      if (Math.abs(diff) > 0.05) {
        // Far from target: speed up/slow down proportionally
        const speed = 1 + Math.min(Math.abs(diff) * 2, 4); // 1x to 5x speed
        video.playbackRate = diff > 0 ? speed : -speed;

        if (video.paused) {
          try {
            video.play().catch(() => {});
          } catch {}
        }
      } else if (Math.abs(diff) > 0.01) {
        // Close to target: gentle adjustment
        video.playbackRate = diff > 0 ? 0.5 : -0.5;
      } else {
        // At target: pause
        video.playbackRate = 0;
        try {
          video.pause();
        } catch {}
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Start/stop the smooth loop based on visibility
  useEffect(() => {
    if (reduce) return;

    const startLoop = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = !!entry?.isIntersecting;
        if (entry?.isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: "200px 0px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      stopLoop();
    };
  }, [reduce, tick]);

  // Initialize video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start from beginning
    try {
      video.currentTime = 0;
      video.playbackRate = 0;
      video.pause();
    } catch {}

    const onMeta = () => {
      if (video.duration && Number.isFinite(video.duration)) {
        durRef.current = video.duration;
      }
    };

    if (video.readyState >= 1 && video.duration) {
      onMeta();
    } else {
      video.addEventListener("loadedmetadata", onMeta);
    }

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // Update target time from scroll progress
  useEffect(() => {
    if (reduce) return;

    const unsubscribe = easeProgress.on("change", (latest) => {
      const dur = durRef.current || videoRef.current?.duration || 3;
      if (dur <= 0) return;

      const p = Math.min(1, Math.max(0, latest));
      targetTimeRef.current = p * dur;
    });

    return () => {
      unsubscribe();
    };
  }, [easeProgress, reduce]);

  return (
    <section
      ref={containerRef}
      className="relative h-[75vh] sm:h-[85vh] w-full overflow-hidden bg-black py-12 flex items-center justify-center"
      aria-label={name}
    >
      {/* Full-bleed video background */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="absolute inset-0 size-full select-none object-cover opacity-95 pointer-events-none"
      />

      {/* Atmospheric ambient glows & cinematic vignettes */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
      <div className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 size-80 rounded-full bg-amber-500/15 blur-[120px]" />

      {/* Soft edge blending veils */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-background via-background/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-background via-background/40 to-transparent"
      />

      {/* Bottom scroll progress scrubber bar */}
      <div className="absolute bottom-0 inset-x-0 z-20 h-1 bg-white/10">
        <motion.div
          style={{ width: progressBarWidth }}
          className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary"
        />
      </div>

      {/* Floating Magnetic Buttons */}
      <motion.div
        style={reduce ? undefined : { opacity: shopOpacity, y: shopY }}
        className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-6 mt-auto pb-12"
      >
        <Magnetic strength={0.35}>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Link
              href={href}
              className="group relative inline-flex h-13 items-center gap-2.5 overflow-hidden rounded-full bg-primary px-9 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_35px_-5px_theme(colors.red.600)] transition-all duration-300 hover:shadow-[0_0_50px_2px_theme(colors.red.500)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <span className="relative z-10">{dict.common.shopNow}</span>
              <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5" />
            </Link>
          </motion.div>
        </Magnetic>

        <Magnetic strength={0.35}>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Link
              href={`/${locale}/collections`}
              className="group relative inline-flex h-13 items-center overflow-hidden rounded-full border border-white/30 bg-black/60 px-8 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:border-primary/80 hover:bg-white/10 hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.35)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <span className="relative z-10">{dict.nav.collection}</span>
            </Link>
          </motion.div>
        </Magnetic>
      </motion.div>
    </section>
  );
}
