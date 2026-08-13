"use client";

import { motion } from "framer-motion";
import { EASE, DURATION_SLOW, RISE } from "@/lib/motion-system";

export function FadeIn({
  children,
  className,
  delay = 0,
  y = RISE,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_SLOW, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
