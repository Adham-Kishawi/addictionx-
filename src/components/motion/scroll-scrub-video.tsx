"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

// ============================================================
// SCROLL SCRUB VIDEO — a 360° turntable clip whose frame is
// driven by SCROLL PROGRESS (wave 29 — the ui-skill's
// `useVideoScrub` pattern, scroll-flavoured; the section is the
// showcase right after the hero). Scroll 0→1 = one full 360°
// turn of the product, so the user "turns the bottle with the
// wheel" — the depth centrepiece of the new RotatingShowcase.
//
// Seamless by construction: the video stays PAUSED and we only
// seek — never play — so the clip end (and its restart zone) is
// unreachable. Hygiene learned in the hero waves:
//   · frame-gated seeks — seek only when ≥ 1 video frame of
//     travel separates us from the target (no 60Hz seek storm,
//     the stutter/hang killer — wave 28c);
//   · `!seeking` skip + a 600ms stall watchdog that re-issues a
//     seek which hangs mid-`seeking`.
// Reduced motion lives in the CALLER (static poster, no scrub).
// ============================================================

const SCRUB_END_MARGIN = 0.01; // park just before the final instant
const SCRUB_SEEK_STEP = 0.03; // ≈ 1 video frame at 24fps — seek gate
const STALL_MS = 600; // a seek stuck longer → force re-issue

export function ScrollScrubVideo({
  progress,
  src,
  poster,
  className,
}: {
  progress: MotionValue<number>; // 0…1 across the pinned stage
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSeekAtRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause(); // never autoplay — the scroll owns the frame
    video.currentTime = 0;

    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        const p = Math.min(1, Math.max(0, progress.get()));
        const target = (dur - SCRUB_END_MARGIN) * p;
        if (video.seeking && now - lastSeekAtRef.current > STALL_MS) {
          // Watchdog — a paused video CAN hang mid-seek: break it.
          video.currentTime = target;
          lastSeekAtRef.current = now;
        } else if (
          !video.seeking &&
          Math.abs(video.currentTime - target) > SCRUB_SEEK_STEP
        ) {
          video.currentTime = target;
          lastSeekAtRef.current = now;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      aria-hidden
      className={className}
    />
  );
}
