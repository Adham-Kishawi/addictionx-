"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

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

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[30] hidden lg:block"
      style={reduce ? undefined : { backdropFilter, willChange: "backdrop-filter" }}
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
