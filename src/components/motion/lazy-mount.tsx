"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// ============================================================
// LAZY MOUNT — performance gate for the heavy pinned scenes
// (wave 9: the home page got heavy). The wrapped scene stays
// OUT of the DOM until the page scrolls it within `rootMargin`
// of the viewport — then it mounts once and stays. This removes
// the 300vh/220vh sticky stages' layout work, scroll listeners
// and image memory from the initial load, so the hero and the
// first screen scroll at full frame rate.
// ============================================================

export function LazyMount({
  children,
  rootMargin = "300px 0px",
  fallbackHeight,
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  fallbackHeight?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  // The placeholder keeps the same height as the scene so the page
  // never jumps when it mounts. Height 0 = the layout below simply
  // sits higher until the scene is near (best for short-page feel);
  // pass a vh number to reserve the space.
  return (
    <div
      ref={ref}
      className={className}
      style={fallbackHeight ? { height: fallbackHeight } : undefined}
    >
      {mounted ? children : null}
    </div>
  );
}
