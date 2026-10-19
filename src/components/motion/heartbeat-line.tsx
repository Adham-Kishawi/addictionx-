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
      transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="heroHeartbeatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
          <stop offset="35%" stopColor="#f43f5e" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#fb7185" stopOpacity="1" />
          <stop offset="65%" stopColor="#f43f5e" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 20 L35 20 L45 8 L55 32 L65 20 L100 20 L110 12 L120 28 L130 20 L200 20"
        stroke="url(#heroHeartbeatGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
