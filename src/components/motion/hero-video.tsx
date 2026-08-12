"use client";

import { TurntableVideo } from "./turntable-video";

// ============================================================
// Cinematic hero backdrop — the new 360° turntable footage.
//
// Wave 12: walid replaced the old sprite-scrub hero with a NEW turntable
// video (`public/hero/hero.mp4`). Two facts about the new footage
// made the sprite filmstrip unviable:
//   1. It is NOT a perfectly closed 360° loop — its first and last frames
//      don't match, so the scrub's left↔right mirror would visibly snap.
//   2. Its very first frame is a bright flash — any looping playback would
//      flash white on every repeat.
// So instead of fighting the strip, we PLAY the footage directly as a
// cinematic video (the brief's direction: real video, no 3D, no strips).
// The playback itself lives in the shared `TurntableVideo` (hero.mp4 ↔
// hero-left.mp4 alternating → continuous rotation on every viewport).
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
