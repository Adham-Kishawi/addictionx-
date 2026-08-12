"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ============================================================
// TurntableVideo — the reusable 360° turntable footage.
//
// `hero.mp4` (normal forward playback) and `hero-left.mp4` (the REVERSED
// copy) alternate on `ended`, so the bottle rotates continuously with no
// seam — the same technique the old mobile hero used, now shared by the
// hero backdrop and the rotating showcase (the wave 11 WebGL turntable
// was removed — the real video is lighter, simpler and works everywhere).
// Source: `public/hero/hero.mp4` (the new 360° turntable footage, natural
// turn) → forward copy + reversed `public/hero/hero-left.mp4`
// (ffmpeg: `-vf "trim=start_frame=1,reverse"`), bright first frame
// trimmed.
//
//  · `fadeOnScroll`  — hero only: melts the layer away as the page
//    scrolls past the first screen.
//  · `fit="contain"` — showcase: show the whole bottle inside its 16:9
//    frame (black letterbox is removed by the parent mix-blend-screen).
//  · `interactive`   — hero only: the bottle follows the mouse. While the
//    cursor is OUTSIDE the hero it keeps spinning its own 360° ping-pong
//    (auto = the footage's natural rotation, alternating with the
//    reversed copy, no seam). When the mouse moves OVER the hero the turn
//    follows it — moving RIGHT plays `hero-left.mp4` (the REVERSE of the
//    video), moving LEFT plays `hero.mp4` (normal) via a mirrored-time
//    switch (same angle, opposite direction, no snap). ~1.2s after the
//    mouse stops it eases back to the auto spin. The showcase stays
//    non-interactive.
//  · `poster`        — static bottle frame shown before/during load and
//    for reduced motion, so the hero is never a blank black void.
//  · reduced motion  — static first/poster frame, no playback.
// ============================================================

interface TurntableVideoProps {
  className?: string;
  fit?: "cover" | "contain";
  poster?: string;
  fadeOnScroll?: boolean;
  interactive?: boolean;
}

export function TurntableVideo({
  className = "",
  fit = "cover",
  poster,
  fadeOnScroll = false,
  interactive = false,
}: TurntableVideoProps) {
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null);
  const videoLeftRef = useRef<HTMLVideoElement>(null);

  const [ready, setReady] = useState(false);

  // Mouse-follow state: null = auto spin, otherwise the video the bottle
  // is being steered into — moving RIGHT = the REVERSED copy (hero-left),
  // moving LEFT = the normal copy (hero.mp4).
  const desiredDirRef = useRef<"left" | "right" | null>(null);
  const lastXRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const markReady = useCallback(() => setReady(true), []);

  const playNext = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    const nowActive = l.style.display !== "none" ? l : r;
    const desired = desiredDirRef.current;
    // Steering overrides the ping-pong: keep re-playing the video that
    // matches the steered direction (right → reversed copy, left → normal).
    let next = nowActive === l ? r : l;
    if (desired === "right") next = l;
    else if (desired === "left") next = r;
    nowActive.style.display = "none";
    next.style.display = "block";
    next.currentTime = 0;
    void next.play().catch(() => {});
  }, []);

  // Reverses the turn mid-playback with NO angle snap: the target video's
  // time is mirrored (duration - current) so the bottle holds its current
  // angle and simply starts turning the other way.
  const applyDirection = useCallback((dir: "left" | "right") => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    const nowActive = l.style.display !== "none" ? l : r;
    const target = dir === "right" ? l : r;
    if (target === nowActive) return;
    const mirror = nowActive.duration - nowActive.currentTime;
    let nextTime = Number.isFinite(mirror) && mirror > 0 ? mirror : 0;
    const targetDur = target.duration;
    if (Number.isFinite(targetDur) && nextTime > targetDur - 0.05) {
      nextTime = Math.max(0, targetDur - 0.05);
    }
    target.currentTime = nextTime;
    nowActive.style.display = "none";
    target.style.display = "block";
    void target.play().catch(() => {});
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
      markReady();
    }, 250);

    // Reveal as soon as the footage is actually playable (never a blind
    // timer) — the 250ms fallback above stays as a safety net.
    r.addEventListener("loadeddata", markReady);
    r.addEventListener("playing", markReady);

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
      r.removeEventListener("loadeddata", markReady);
      r.removeEventListener("playing", markReady);
      l.removeEventListener("ended", playNext);
      r.removeEventListener("ended", playNext);
      l.pause();
      r.pause();
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, [reduce, playNext, fadeOnScroll, markReady]);

  // Mouse-follow (hero only): track the cursor while it's over the hero and
  // steer the turn; fall back to the auto spin once it stops or leaves.
  useEffect(() => {
    if (!interactive || reduce) return;
    const root = rootRef.current;
    if (!root) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        lastXRef.current = null;
        desiredDirRef.current = null;
        return;
      }
      const x = e.clientX;
      if (lastXRef.current !== null) {
        const dx = x - lastXRef.current;
        if (Math.abs(dx) > 3) {
          desiredDirRef.current = dx > 0 ? "right" : "left";
          applyDirection(desiredDirRef.current);
        }
      }
      lastXRef.current = x;
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        desiredDirRef.current = null;
        lastXRef.current = null;
      }, 1200);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [interactive, reduce, applyDirection]);

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
        src="/hero/hero.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
      <video
        ref={videoLeftRef}
        src="/hero/hero-left.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
    </div>
  );
}
