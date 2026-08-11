"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { ParticleField } from "@/components/motion/particle-field";
import { Spotlight } from "@/components/motion/spotlight";

// ============================================================
// Closing CTA — a LAYERED depth scene (ui-skill z-ladder).
// Six explicit layers, each with its own motion:
//   z-0  ADDICTIONX watermark — parallax (scroll-linked y)
//   z-1  radial glow           — parallax (drifting opposite)
//   z-2  two blurred orbs      — slow CSS loops (26s / 34s)
//   z-5  rising neon sparks    — screen blend over the card
//   z-10 glass card            — gradient-only border + frost
//   z-20 bottom fade           — melts the scene into the footer
// Children = the card content (server-safe). All scroll motion is
// disabled under prefers-reduced-motion; CSS loops die globally.
// ============================================================

export function CtaScene({
  children,
  glow,
}: {
  children: React.ReactNode;
  glow?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  const watermarkY = useTransform(scrollYProgress, [0, 1], ["14%", "-14%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* L0 — giant rotated ADDICTIONX watermark, metallic shine + parallax */}
      <motion.span
        aria-hidden
        dir="ltr"
        className="text-watermark text-metallic-shine pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center rotate-[-6deg] text-[15vw]"
        style={reduce ? undefined : { y: watermarkY }}
      >
        ADDICTIONX
      </motion.span>

      {/* L1 — radial glow drifting on its own scroll layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={reduce ? undefined : { y: glowY }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(90% 120% at 50% 50%, ${glow ?? "#ef4444"}22 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* L2 — two huge blurred orbs floating slowly */}
      <div aria-hidden className="cta-orb cta-orb-a" />
      <div aria-hidden className="cta-orb cta-orb-b" />

      {/* L5 — neon sparks rising over the whole scene */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5]">
        <ParticleField count={14} blend="screen" opacityScale={0.25} />
      </div>

      {/* L10 — glass card with gradient-only border, stacked over the previous section.
            A cursor-tracking spotlight (Neon Dark Tech) lives on the glass */}
      <div className="group relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        {/* L3b — giant rotating neon orbit around the card (speeds up on hover) */}
        <div aria-hidden className="cta-orbit-ring" />
        <Spotlight className="glass-card relative -mt-20 rounded-2xl px-6 py-16 text-center sm:-mt-28 sm:rounded-3xl sm:px-10 sm:py-20">
          {children}
        </Spotlight>
      </div>

      {/* L20 — melt into the footer */}
      <div aria-hidden className="section-bottom-fade z-20" />
    </section>
  );
}
