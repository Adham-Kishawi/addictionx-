"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================
// TILT CARD — 3D cursor tilt (perspective 900): rotateX/rotateY
// follow the pointer with springs, plus a glare highlight that
// tracks the cursor (group-hover). Reduced motion → flat.
// ============================================================

export function TiltCard({
  children,
  className,
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 24 });
  const sry = useSpring(ry, { stiffness: 150, damping: 24 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
    el.style.setProperty("--glare-x", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--glare-y", `${(py + 0.5) * 100}%`);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("group relative", className)}
      style={
        reduce
          ? undefined
          : { rotateX: srx, rotateY: sry, transformPerspective: 900 }
      }
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(42% 42% at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.16), transparent 70%)",
        }}
      />
    </motion.div>
  );
}
