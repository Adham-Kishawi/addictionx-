"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// Neon glow following the cursor (Desktops only) — the brand's visual signature.
// Completely hidden on touch and with prefers-reduced-motion.
//
// Over the cinematic hero (where the video also follows the cursor) the glow dims
// via --cursor-glow-opacity which HeaderScroll controls — two synchronized glows
// on the same hand are noise, so the user sees the video-drag effect, not the glow.

export function CursorGlow() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [glowOpacity, setGlowOpacity] = useState(1);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || reduce) return;
    const readOpacity = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--cursor-glow-opacity")
        .trim();
      const v = parseFloat(raw);
      setGlowOpacity(Number.isFinite(v) ? v : 1);
    };
    const onMove = (e: PointerEvent) => {
      setEnabled(true);
      x.set(e.clientX);
      y.set(e.clientY);
    };
    readOpacity();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", readOpacity, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", readOpacity);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[90] size-[420px] rounded-full"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        opacity: glowOpacity,
        background:
          "radial-gradient(circle, oklch(0.6 0.22 22 / 0.10) 0%, transparent 60%)",
      }}
    />
  );
}
