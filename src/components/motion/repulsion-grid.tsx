"use client";

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

// ============================================================
// REPULSION GRID — cards push away from the pointer (wave plan
// #5, the "cards repel" signature). Each card tracks the pointer
// via its own springs; within `radius` px the card is pushed
// away with strength decaying to zero at the radius edge. Hover
// a card and its neighbors drift apart. Reduced motion → static.
// ============================================================

export type RepulsionItemHandle = {
  setPointer: (x: number, y: number) => void;
  reset: () => void;
};

const RepulsionItem = forwardRef<
  RepulsionItemHandle,
  { children: ReactNode; radius: number; strength: number }
>(function RepulsionItem({ children, radius, strength }, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 130, damping: 26 });
  const sy = useSpring(y, { stiffness: 130, damping: 26 });

  useImperativeHandle(ref, () => ({
    setPointer(px: number, py: number) {
      if (reduce) return;
      const el = elRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius && dist > 0.001) {
        const push = ((radius - dist) / radius) * strength;
        x.set((dx / dist) * push);
        y.set((dy / dist) * push);
      } else {
        x.set(0);
        y.set(0);
      }
    },
    reset() {
      x.set(0);
      y.set(0);
    },
  }));

  return (
    <motion.div
      ref={elRef}
      className="will-change-transform"
      style={{ x: sx, y: sy }}
    >
      {children}
    </motion.div>
  );
});

export function RepulsionGrid({
  children,
  className,
  radius = 240,
  strength = 16,
}: {
  children: ReactNode[];
  className?: string;
  radius?: number;
  strength?: number;
}) {
  const itemRefs = useRef<(RepulsionItemHandle | null)[]>([]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    itemRefs.current.forEach((h) => h?.setPointer(e.clientX, e.clientY));
  };
  const onLeave = () => {
    itemRefs.current.forEach((h) => h?.reset());
  };

  return (
    <div className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children.map((child, i) => (
        <RepulsionItem
          key={i}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          radius={radius}
          strength={strength}
        >
          {child}
        </RepulsionItem>
      ))}
    </div>
  );
}
