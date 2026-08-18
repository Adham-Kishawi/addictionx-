"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
// (`[cursor:none]`) — the ring becomes the cursor there and
// nowhere else, so the rest of the site keeps its real cursor.
//
// Wave 42 — movement performance:
//   · NO permanent rAF. The ring is written once per pointer
//     event (the browser already coalesces those to the frame
//     rate); when the pointer rests, nothing runs at all.
//   · The position is a `transform` (compositor only) instead
//     of `left`/`top`, which forced layout on every frame.
//   · The hero test is `event.target.closest("#hero-stage")`
//     instead of `document.elementFromPoint` per frame — no
//     hit-testing work.
// ============================================================

export function CursorRing() {
  const ref = useRef<HTMLDivElement | null>(null);
  const posRef = useRef({ x: -100, y: -100, over: false });
  const [shown, setShown] = useState(false);

  const apply = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { x, y, over } = posRef.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    el.style.opacity = over ? "1" : "0";
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!fine || !wide || reduce) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target as Element | null;
      posRef.current = {
        x: e.clientX,
        y: e.clientY,
        over: Boolean(target?.closest?.("#hero-stage")),
      };
      setShown(true);
      apply();
    };

    const onLeaveWindow = () => {
      posRef.current = { ...posRef.current, over: false };
      apply();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    document.addEventListener("visibilitychange", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveWindow);
      document.removeEventListener("visibilitychange", onLeaveWindow);
    };
  }, [apply]);

  // The element only exists after the first real pointer move — apply the
  // pending position as soon as it lands in the DOM.
  useEffect(() => {
    if (shown) apply();
  }, [shown, apply]);

  if (!shown) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 size-12 opacity-0 mix-blend-exclusion"
      style={{
        transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
        transition: "opacity 0.25s ease",
        willChange: "transform",
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
