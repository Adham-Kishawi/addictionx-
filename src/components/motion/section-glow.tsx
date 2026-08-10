"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

// Per-section depth décor: the section's glow drifts at its own speed while
// the section scrolls (parallax ±distance%) — so EVERY section has its own
// moving background layer, not just the hero. Drop-in replacement for the
// static radial-gradient décor divs. Reduced-motion → static layer.

export function SectionGlow({
  className,
  background,
  distance = 12,
}: {
  className?: string;
  background?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLDivElement>,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${distance}%`, `-${distance}%`],
  );

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={reduce ? undefined : { y }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            background ??
            "radial-gradient(50% 90% at 50% 50%, oklch(0.6 0.22 22 / 0.08), transparent 70%)",
        }}
      />
    </motion.div>
  );
}
