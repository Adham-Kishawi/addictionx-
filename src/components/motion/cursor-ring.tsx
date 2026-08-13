"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// CursorRing — the prmpt-style custom cursor (wave 33).
//
// Desktop only (pointer: fine + ≥1024px, reduced-motion off).
// A fixed 48px ring (circle + sparkle glyph, all white) that
// follows the pointer with `mix-blend-mode: exclusion` so it
// reads on ANY background (light or dark) — the exact
// eye-comfort trick from the prmpt archive spec. It only
// appears while the pointer is over the cinematic hero
// (`#hero-stage`), where the system cursor is hidden
// (`[cursor:none]` on the hero wrapper) — the ring becomes
// the cursor there and nowhere else, so the rest of the site
// keeps its real cursor. Positioned via direct DOM
// manipulation in a rAF, like the reference.
// ============================================================

export function CursorRing() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || !wide || reduce) return;

    let raf = 0;
    let x = -100;
    let y = -100;
    let lastTarget: Element | null = null;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      // Only travel while over the hero stage; park elsewhere.
      const target = document.elementFromPoint(x, y) ?? null;
      const overHero = target?.closest("#hero-stage") ?? null;
      if (overHero !== lastTarget) {
        lastTarget = overHero;
        el.style.opacity = overHero ? "1" : "0";
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    const onMove = (e: MouseEvent) => {
      setShown(true);
      x = e.clientX;
      y = e.clientY;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!shown) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed z-50 size-12 opacity-0 mix-blend-exclusion"
      style={{
        transform: "translate(-50%, -50%)",
        transition: "opacity 0.25s ease",
        left: -100,
        top: -100,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className="size-full"
        fill="none"
        stroke="white"
        strokeWidth={2.5}
      >
        <circle cx="24" cy="24" r="21.5" />
        {/* Sparkle glyph — the brand's little mark */}
        <path
          d="M24 12 L26 22 L36 24 L26 26 L24 36 L22 26 L12 24 L22 22 Z"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
