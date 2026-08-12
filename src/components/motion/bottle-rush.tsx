"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { ParticleField } from "@/components/motion/particle-field";

// ============================================================
// BOTTLE RUSH — the awe moment. A tall section (220vh) with a
// sticky fullscreen stage: while you scroll, the REAL product
// photo scrubs through a cinematic arc:
//   scale 0.5 → 1.15 · rotate -12° → 10° · blur 18px → 0
//   glow ramps up, the giant metallic "ADDICTION" splits away.
// Layer ladder: z-0 watermark / z-1 glow / z-2 bottle / z-5 text.
// Scroll-linked via useScroll stuck to prefers-reduced-motion.
// The scrub ranges keep their full drama; mid-point easing points
// turn the linear saw into an ease-out arc (fast start, silk finish).
// ============================================================

export function BottleRush({
  image,
  title,
  subtitle,
}: {
  image?: string | null;
  title: string;
  subtitle: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.45, 0.75],
    [0.5, 1.13, 1.15],
  );
  const rotate = useTransform(scrollYProgress, [0, 0.45, 1], [-12, -1, 10]);
  const blur = useTransform(scrollYProgress, [0, 0.12, 0.25], [18, 3, 0]);
  const bottleOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.9],
    [0, 1, 1],
  );
  const glowOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.45, 0.7],
    [0, 0.72, 0.85],
  );
  const wordX = useTransform(scrollYProgress, [0, 1], ["16vw", "-16vw"]);
  const fade = useTransform(scrollYProgress, [0.92, 1], [1, 0]);
  const src = image ?? "/uploads/prodact.png";

  return (
    <section ref={ref} className="relative h-[220vh]" aria-label={title}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* L0 — giant metallic brand splitting sideways on scroll */}
        <motion.span
          aria-hidden
          dir="ltr"
          className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
          style={reduce ? undefined : { x: wordX }}
        >
          <span className="text-metallic-shine text-watermark whitespace-nowrap rotate-[-6deg] font-display text-[19vw] font-bold uppercase tracking-[0.08em]">
            ADDICTION
          </span>
        </motion.span>

        {/* L1 — red aura ramping with the bottle */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={reduce ? { opacity: 0.6 } : { opacity: glowOpacity }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(46% 60% at 50% 55%, oklch(0.6 0.22 22 / 0.32), transparent 68%)",
            }}
          />
        </motion.div>

        {/* L2 — the bottle itself, scrubbed */}
        <motion.div
          className="relative z-10 flex w-full items-center justify-center px-6"
          style={
            reduce
              ? undefined
              : {
                  scale,
                  rotate,
                  filter: blur ? `blur(${blur}px)` : undefined,
                  opacity: bottleOpacity,
                }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="max-h-[62vh] w-auto max-w-[78vw] object-contain [filter:drop-shadow(0_0_70px_oklch(0.6_0.22_22/0.45))_drop-shadow(0_30px_60px_rgba(0,0,0,0.6))] select-none"
          />
        </motion.div>

        {/* L3 — sparks over the whole stage */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
          <ParticleField count={16} blend="screen" opacityScale={0.3} />
        </div>

        {/* L4 — heading, fading out as the bottle maxes */}
        <motion.div
          className="absolute inset-x-0 bottom-14 z-[5] flex flex-col items-center gap-2 px-6 text-center"
          style={reduce ? undefined : { opacity: fade }}
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
