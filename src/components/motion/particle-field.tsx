"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ParticleField({
  count = 16,
  blend = "screen",
  opacityScale = 0.5,
}: {
  count?: number;
  blend?: "screen" | "exclusion" | "normal";
  opacityScale?: number;
}) {
  const reduce = useReducedMotion();

  const isMobile = useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(max-width: 768px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 768px)").matches,
    () => false,
  );

  const particleCount = isMobile ? Math.max(4, Math.ceil(count / 2)) : count;

  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: `${(i * 41) % 100}%`,
    size: 2 + ((i * 5) % 3),
    duration: 8 + ((i * 11) % 7),
    delay: (i * 13) % 5,
    opacity: 0.15 + ((i * 7) % 4) / 15,
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
          className="absolute rounded-full bg-rose-400/80"
          style={{
            left: p.left,
            bottom: "-5%",
            width: p.size,
            height: p.size,
            opacity: p.opacity * opacityScale,
            boxShadow: "0 0 8px 1px rgba(244, 63, 94, 0.35)",
          }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, "-110vh"],
                  x: [0, p.id % 2 === 0 ? 25 : -25, 0],
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
