"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// ============================================================
// SmoothScroll — wave 34h: the premium feel of the homepage is
// a FLUID journey (brief section 9: "Scrolling should feel
// smooth, fluid, controlled, premium, responsive").
//
// Lenis renders the scroll as an eased glide instead of the
// mechanical wheel → touch feel of native browsers, while
// KEEPING native scroll position (no hijack: wheel/touch/
// keyboard/anchors all still work; sticky + GSAP pinning
// unaffected). Integration points:
//   · gsap ScrollTrigger — refreshed on every lenis scroll so
//     the showcase scrub stays perfectly in sync
//   · framer-motion useScroll — reads real scroll, so it
//     follows lenis automatically
// Skipped entirely under prefers-reduced-motion.
// ============================================================

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    // Keep every GSAP ScrollTrigger (the scroll-scrubbed videos)
    // in lockstep with the eased scroll
    let stRef: { update: () => void } | null = null;
    const syncGsap = async () => {
      if (stRef) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      stRef = ScrollTrigger;
    };

    const onLenisScroll = () => {
      stRef?.update();
    };

    lenis.on("scroll", onLenisScroll);

    // rAF loop is lenis's own engine
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    void syncGsap();

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
