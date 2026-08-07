"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AuroraBackground() {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* توهج أحمر علوي */}
      <motion.div
        className="absolute -top-1/3 left-1/2 h-[80vh] w-[120vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.6 0.22 22 / 0.28), transparent 65%)",
        }}
        animate={
          reduce ? undefined : { opacity: [0.5, 1, 0.5], scale: [1, 1.15, 1] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* كرة أرجوانية يسار */}
      <motion.div
        className="absolute top-1/4 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.18 285 / 0.25), transparent 70%)",
        }}
        animate={reduce ? undefined : { x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* كرة حمراء يمين */}
      <motion.div
        className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.6 0.22 22 / 0.22), transparent 70%)",
        }}
        animate={reduce ? undefined : { x: [0, -70, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ضباب ضوئي سفلي */}
      <motion.div
        className="absolute -bottom-40 left-1/2 h-96 w-[90vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.85 0.03 285 / 0.14), transparent 70%)",
        }}
        animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
