"use client";

import { motion } from "framer-motion";

export function HeartbeatLine({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 40"
      fill="none"
      aria-hidden
      className={className}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.4, delay: 0.6, ease: "easeInOut" }}
    >
      <motion.path
        d="M0 20 L35 20 L45 8 L55 32 L65 20 L100 20 L110 12 L120 28 L130 20 L200 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
