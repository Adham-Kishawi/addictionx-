"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion-system";

// ============================================================
// Masked word reveal — bombon/voyeurverite split-text style.
// Every word rises from behind an overflow mask with a soft 3D tilt
// (y 115% → 0, rotateX -45 → 0, soft-out ease, staggered 70 ms).
// Works with Arabic (split on spaces) and slots inside any heading,
// including metallic-shine gradient text. Fires once on scroll.
// ============================================================

export function WordReveal({
  text,
  as = "h2",
  className,
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = as;

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = text.split(" ");

  return (
    <Tag className={className} style={{ perspective: 700 }}>
      <motion.span
        className="inline-flex flex-wrap"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.07, delayChildren: delay },
          },
        }}
      >
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden pb-[0.18em] align-bottom"
          >
            <motion.span
              className="inline-block will-change-transform"
              variants={{
                hidden: { y: "115%", rotateX: -45, opacity: 0 },
                show: {
                  y: "0%",
                  rotateX: 0,
                  opacity: 1,
                  transition: { duration: 0.9, ease: EASE },
                },
              }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
