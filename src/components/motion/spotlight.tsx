"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

// Spotlight — a soft radial light that follows the cursor inside the
// card (Neon Dark Tech glow). Writes --sp-x/--sp-y CSS vars on move;
// the overlay fades in on hover. Keep children untouched above it.

export function Spotlight({
  children,
  className,
  tint = "oklch(0.6 0.22 22 / 0.16)",
}: {
  children: React.ReactNode;
  className?: string;
  tint?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sp-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--sp-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn("group/spot relative overflow-hidden", className)}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(26rem 18rem at var(--sp-x, 50%) var(--sp-y, 50%), ${tint}, transparent 68%)`,
        }}
      />
    </div>
  );
}
