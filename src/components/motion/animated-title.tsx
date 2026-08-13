"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion-system";

export function AnimatedTitle({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const letters = text.split("");

  return (
    <motion.h1
      aria-label={text}
      initial="hidden"
      animate="show"
      variants={{
        show: {
          transition: {
            staggerChildren: reduce ? 0 : 0.07,
            delayChildren: reduce ? 0 : 0.15,
          },
        },
      }}
      className="font-display text-6xl font-bold tracking-tight sm:text-8xl"
      dir="ltr"
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          aria-hidden
          variants={{
            hidden: {
              opacity: 0,
              y: reduce ? 0 : 80,
              rotateX: reduce ? 0 : -90,
              filter: reduce ? "none" : "blur(14px)",
            },
            show: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.9,
                ease: EASE,
              },
            },
          }}
          className="text-metallic-shine inline-block will-change-transform"
          style={{ perspective: 400 }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.h1>
  );
}
