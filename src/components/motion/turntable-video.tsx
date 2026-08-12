"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ============================================================
// TurntableVideo — the reusable 360° turntable footage.
//
// `right.mp4` (forward turn) and `left.mp4` (reversed turn) alternate
// on `ended`, so the bottle rotates continuously with no seam — the
// same technique the old mobile hero used, now shared by the hero
// backdrop and the rotating showcase (the wave 11 WebGL turntable was
// removed — the real video is lighter, simpler and works everywhere).
// Both files are generated from `public/360/perfume-360.mp4` with the
// bright first frame trimmed.
//
//  · `fadeOnScroll`  — hero only: melts the layer away as the page
//    scrolls past the first screen.
//  · `fit="contain"` — showcase: show the whole bottle inside its 16:9
//    frame (black letterbox is removed by the parent mix-blend-screen).
//  · reduced motion   — static first frame, no playback.
// ============================================================

interface TurntableVideoProps {
  className?: string;
  fit?: "cover" | "contain";
  poster?: string;
  fadeOnScroll?: boolean;
}

export function TurntableVideo({
  className = "",
  fit = "cover",
  poster,
  fadeOnScroll = false,
}: TurntableVideoProps) {
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null);
  const videoLeftRef = useRef<HTMLVideoElement>(null);

  const [ready, setReady] = useState(false);

  const playNext = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    const nowActive = l.style.display !== "none" ? l : r;
    const next = nowActive === l ? r : l;
    nowActive.style.display = "none";
    next.style.display = "block";
    next.currentTime = 0;
    void next.play().catch(() => {});
  }, []);

  useEffect(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;

    // Reduced motion → static first frame (no playback, no alternating).
    if (reduce) {
      r.style.display = "block";
      if (rootRef.current) {
        rootRef.current.style.opacity = "1";
        rootRef.current.style.visibility = "visible";
      }
      return;
    }

    l.style.display = "none";
    r.style.display = "block";
    const t = window.setTimeout(() => {
      void r.play().catch(() => {});
      setReady(true);
    }, 250);

    l.addEventListener("ended", playNext);
    r.addEventListener("ended", playNext);

    // Hero-only: smooth exit on scroll (the hero melts into the page).
    let onScroll: (() => void) | undefined;
    if (fadeOnScroll) {
      onScroll = () => {
        const vh = window.innerHeight;
        const fadeStart = vh * 0.25;
        const fadeEnd = vh * 0.9;
        const hidden = window.scrollY >= fadeEnd;
        if (rootRef.current) {
          const fade = Math.min(
            1,
            Math.max(
              0,
              1 - (window.scrollY - fadeStart) / (fadeEnd - fadeStart),
            ),
          );
          rootRef.current.style.opacity = String(fade);
          rootRef.current.style.visibility = hidden ? "hidden" : "visible";
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      window.clearTimeout(t);
      l.removeEventListener("ended", playNext);
      r.removeEventListener("ended", playNext);
      l.pause();
      r.pause();
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [reduce, playNext, fadeOnScroll]);

  const videoClass = `absolute inset-0 hidden h-full w-full ${
    fit === "cover" ? "object-cover" : "object-contain"
  }`;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none relative overflow-hidden ${className}`}
      style={{
        opacity: ready ? 1 : 0,
        transition: "opacity 0.8s ease 0.15s",
      }}
    >
      <video
        ref={videoRightRef}
        src="/right.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
      <video
        ref={videoLeftRef}
        src="/left.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
    </div>
  );
}
