"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

// ============================================================
// Scroll-depth system for the hero — three layers sliding at DIFFERENT
// speeds (bombon-style parallax):
//   · backdrop (video/sprites) — slow drift + zooming in slowly
//   · mid (veil + neon dust)   — medium drift
//   · content (title/cta)      — fastest exit, cinematic fade + shrink
// The next sections slide OVER the hero, which solders the page together.
// All motion is scroll-linked (useScroll) and disabled under
// prefers-reduced-motion.
// ============================================================

export function HeroParallax({
  backdrop,
  mid,
  content,
  indicator,
}: {
  backdrop: React.ReactNode;
  mid: React.ReactNode;
  content: React.ReactNode;
  indicator?: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "36%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.82], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden text-white"
      style={{ backgroundColor: "var(--hero-bg)" }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0"
        style={reduce ? undefined : { y: bgY, scale: bgScale }}
      >
        {backdrop}
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={reduce ? undefined : { y: midY }}
      >
        {mid}
      </motion.div>

      <motion.div
        className="relative z-20 w-full"
        style={
          reduce
            ? undefined
            : { y: contentY, opacity: contentOpacity, scale: contentScale }
        }
      >
        {content}
      </motion.div>

      {indicator}
    </section>
  );
}
