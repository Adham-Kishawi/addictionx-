"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ============================================================
// Cinematic hero backdrop — the new 360° turntable footage.
//
// Wave 12: walid replaced the old sprite-scrub hero with a NEW turntable
// video (`public/360/perfume-360.mp4`). Two facts about the new footage
// made the sprite filmstrip unviable:
//   1. It is NOT a perfectly closed 360° loop — its first and last frames
//      don't match, so the scrub's left↔right mirror (frame 59 ≈ frame 0)
//      would visibly snap when crossing the screen center.
//   2. Its very first frame is a bright flash (~gray, luma 136 vs ~12 for
//      the rest) — any looping playback would flash white on every repeat.
// So instead of fighting the strip, we PLAY the footage directly as a
// cinematic video (the brief's direction: real video, no 3D, no strips).
//
// Continuous rotation with no seam: `right.mp4` (forward turn) and
// `left.mp4` (reversed turn) alternate on `ended` — the bottle rotates
// right→left→right forever without a jump. Both files are generated from
// perfume-360.mp4 with the bright first frame trimmed.
// All viewports use the same playback (no desktop/mobile split).
// ============================================================

export function HeroVideo() {
  const reduce = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
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

    // Reduced motion / unknown state → static first frame of the forward
    // video (no playback, no alternating).
    if (reduce) {
      r.style.display = "block";
      if (containerRef.current) {
        containerRef.current.style.opacity = "1";
        containerRef.current.style.visibility = "visible";
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

    // Smooth exit on scroll (same as the old scrub — the hero melts away).
    const onScroll = () => {
      const vh = window.innerHeight;
      const fadeStart = vh * 0.25;
      const fadeEnd = vh * 0.9;
      const hidden = window.scrollY >= fadeEnd;
      if (containerRef.current) {
        const fade = Math.min(
          1,
          Math.max(0, 1 - (window.scrollY - fadeStart) / (fadeEnd - fadeStart)),
        );
        containerRef.current.style.opacity = String(fade);
        containerRef.current.style.visibility = hidden ? "hidden" : "visible";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(t);
      l.removeEventListener("ended", playNext);
      r.removeEventListener("ended", playNext);
      l.pause();
      r.pause();
      window.removeEventListener("scroll", onScroll);
    };
  }, [reduce, playNext]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundColor: "#0a0a0a",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.8s ease 0.15s",
      }}
    >
      <div className="absolute inset-0">
        <video
          ref={videoRightRef}
          src="/right.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 hidden h-full w-full object-cover"
        />
        <video
          ref={videoLeftRef}
          src="/left.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 hidden h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
