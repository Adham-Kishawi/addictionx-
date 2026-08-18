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
//
// Wave 42 — the rAF is DEMAND-DRIVEN. It used to tick 60×/s for
// the whole session, competing for the same frames as the hero's
// video scrubbing even when the page was not moving at all. Now
// the loop runs while the scroll is actually animating, parks
// itself `IDLE_STOP_MS` after it settles, and is woken by any
// input that can start a scroll (wheel / touch / key / pointer /
// native scroll / resize). A hidden tab never ticks.
// Scrolling behaviour itself is untouched: Lenis still owns the
// easing and still writes the native scroll position.
// ============================================================

const IDLE_STOP_MS = 300;

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

    let raf = 0;
    let lastActiveAt = 0;

    const tick = (time: number) => {
      lenis.raf(time);
      if (lenis.isScrolling) lastActiveAt = time;
      if (document.hidden || time - lastActiveAt > IDLE_STOP_MS) {
        raf = 0; // settled — release the frame budget
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      lastActiveAt = performance.now();
      if (raf || document.hidden) return;
      raf = requestAnimationFrame(tick);
    };

    const onLenisScroll = () => {
      stRef?.update();
      wake();
    };
    lenis.on("scroll", onLenisScroll);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        wake();
      }
    };

    // Anything that can start (or continue) a scroll re-arms the loop.
    const wakeEvents: Array<[EventTarget, string]> = [
      [window, "wheel"],
      [window, "touchstart"],
      [window, "touchmove"],
      [window, "keydown"],
      [window, "pointerdown"],
      [window, "scroll"],
      [window, "resize"],
    ];
    for (const [target, type] of wakeEvents) {
      target.addEventListener(type, wake, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    wake();
    void syncGsap();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      for (const [target, type] of wakeEvents) {
        target.removeEventListener(type, wake);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      lenis.destroy();
    };
  }, []);

  return null;
}
