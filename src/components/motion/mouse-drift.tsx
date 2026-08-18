"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// ============================================================
// MOUSE DRIFT — subtle cursor parallax: the wrapped content
// drifts a few pixels toward the pointer with a slow spring,
// so layered scenes feel alive. Reduced motion → static.
//
// Wave 42 — the bounds are CACHED. `getBoundingClientRect()` on
// every pointer move forces a layout on a page whose hero is
// already scrubbing video frames; the rect is measured once per
// pointer entry and invalidated on scroll/resize instead.
// ============================================================

export function MouseDrift({
  children,
  className,
  strength = 10,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 45, damping: 26 });
  const sy = useSpring(y, { stiffness: 45, damping: 26 });
  const rectRef = useRef<DOMRect | null>(null);

  const invalidate = useCallback(() => {
    rectRef.current = null;
  }, []);

  useEffect(() => {
    if (reduce) return;
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, [reduce, invalidate]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect =
      rectRef.current ??
      (rectRef.current = e.currentTarget.getBoundingClientRect());
    if (!rect.width || !rect.height) return;
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * strength * 2);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * strength * 2);
  };

  const onLeave = () => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={reduce ? undefined : { x: sx, y: sy }}
    >
      {children}
    </motion.div>
  );
}
