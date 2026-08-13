"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

// ============================================================
// HeroMelt — wave 34b: the hero does not end, it MELTS.
//
// A full-stage overlay inside #hero-stage that turns the
// hero's exit into a cinematic focus-pull:
//   · backdrop-blur grows 0 → 16px as the stage leaves the
//     viewport (progress 0.55 → 1) — the scene dissolves into
//     soft light instead of cutting
//   · at the very end (0.9 → 1) a solid theme-bg veil fades in
//     over everything, so the hero blends perfectly into the
//     page background before the next section arrives
// One continuous visual scene transforming into the next —
// no sudden blur changes, no hard edge. pointer-events-none,
// transform/opacity/filter only (no layout). Reduced motion
// disables the effect entirely.
// ============================================================

export function HeroMelt() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLDivElement>,
    offset: ["start start", "end start"],
  });

  const blur = useTransform(scrollYProgress, [0.55, 1], [0, 16]);
  const veilOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;

  if (reduce) return null;

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[30]"
      style={{ backdropFilter, willChange: "backdrop-filter" }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "var(--hero-veil-4)",
          opacity: veilOpacity,
        }}
      />
    </motion.div>
  );
}
