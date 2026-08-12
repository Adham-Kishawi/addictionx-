"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Rising particle field — used in the hero and the rest of the page.
// All options default to the original behavior, and in the cinematic hero
// we pass a reduced version (smaller count + screen blend + lighter opacityScale)
// to read as "dust in a light beam" rather than "noise" over the video.
// blend: screen adds light without flipping colors (red stays red).

export function ParticleField({
  count = 24,
  blend = "normal",
  opacityScale = 1,
}: {
  count?: number;
  blend?: "screen" | "exclusion" | "normal";
  opacityScale?: number;
}) {
  const reduce = useReducedMotion();
  // Wave 9 (weight): phones render half the particles — same look, half the
  // compositing budget. useSyncExternalStore keeps SSR/hydration clean.
  const isMobile = useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(max-width: 768px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 768px)").matches,
    () => false,
  );
  const particleCount = isMobile ? Math.max(6, Math.ceil(count / 2)) : count;

  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: `${(i * 41) % 100}%`,
    size: 2 + ((i * 7) % 4),
    duration: 6 + ((i * 13) % 8),
    delay: (i * 17) % 6,
    opacity: 0.25 + ((i * 11) % 5) / 10,
  }));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ mixBlendMode: blend === "normal" ? undefined : blend }}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: p.left,
            bottom: "-5%",
            width: p.size,
            height: p.size,
            opacity: p.opacity * opacityScale,
            boxShadow: "0 0 12px 2px oklch(0.6 0.22 22 / 0.5)",
          }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, "-110vh"],
                  x: [0, p.id % 2 === 0 ? 40 : -40, 0],
                }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
