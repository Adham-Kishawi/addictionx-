"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Smooth transition between pages — mounted around {children} in the root layout.
// A change in pathname changes the key and re-renders with an entry animation.
//
// Critical note: we animate with opacity only — any transform or filter on this
// element creates a new containing block that makes any position:fixed inside it
// (like the cinematic hero video) scroll with the page instead of staying fixed.
// opacity creates a stacking context but doesn't touch fixed positioning — it is safe.

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
