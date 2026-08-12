"use client";

import { TurntableVideo } from "./turntable-video";

// ============================================================
// Cinematic hero backdrop — the 360° turntable footage.
//
// Wave 12 history: the old sprite-scrub hero was replaced by direct video
// playback (the brief's direction: real video, no 3D, no strips).
// The playback itself lives in the shared `TurntableVideo`
// (right.mp4 ↔ left.mp4 alternating → continuous rotation on every
// viewport; both are full 360° turns with a clean loop).
// ============================================================

export function HeroVideo() {
  return (
    <TurntableVideo
      className="absolute inset-0 h-full w-full bg-[#0a0a0a]"
      fit="cover"
      poster="/hero/frame-01.png"
      fadeOnScroll
      interactive
    />
  );
}
