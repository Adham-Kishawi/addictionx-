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
//  · `interactive`   — hero only: the bottle follows the mouse FLEXIBLY.
//    The turn SPEED tracks the cursor velocity (fast mouse = fast turn,
//    slow mouse = slow turn, stopped mouse = the turn eases out and
//    stops), and the DIRECTION follows it — moving RIGHT plays `hero.mp4`
//    (the NORMAL copy = rightward turn), moving LEFT plays `hero-left.mp4`
//    (the REVERSED copy = leftward turn) via a mirrored-time switch (same
//    angle, opposite direction, no snap). When the cursor is outside the
//    hero (or still ~1.2s) it returns to the auto 360° spin: the two
//    copies alternate on `ended`, so the bottle keeps rotating with no
//    seam. The showcase stays non-interactive.
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

// Mouse-velocity → playbackRate mapping (hero only). The rotation speed
// mirrors the cursor: `rate = velocity(px/ms) × RATE_PER_VEL`, clamped.
const MAX_RATE = 2.2; // fastest turn (quick mouse flick)
const MIN_RATE = 0.1; // slowest creep (barely-moving mouse)
const RATE_PER_VEL = 1.6; // ≈1× at a normal deliberate drag (~0.6px/ms)
const IDLE_STOP_MS = 250; // no move → ease the turn out to a stop
const IDLE_AUTO_MS = 1200; // then resume the auto 360° spin

export function TurntableVideo({
  className = "",
  fit = "cover",
  poster,
  fadeOnScroll = false,
  interactive = false,
}: TurntableVideoProps) {
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null); // hero.mp4 — turns RIGHT
  const videoLeftRef = useRef<HTMLVideoElement>(null); // hero-left.mp4 — turns LEFT
  const activeRef = useRef<HTMLVideoElement | null>(null); // the currently shown video

  const [ready, setReady] = useState(false);

  // Mouse-follow state: null = auto spin, otherwise the steered direction.
  const desiredDirRef = useRef<"left" | "right" | null>(null);
  const lastXRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number | null>(null);
  const idleStopTimerRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);

  // playbackRate easing (rAF loop): `curRate` drifts toward `targetRate`.
  const targetRateRef = useRef(1);
  const curRateRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const markReady = useCallback(() => setReady(true), []);

  const setActive = useCallback((next: HTMLVideoElement) => {
    const prev = activeRef.current;
    if (prev && prev !== next) prev.style.display = "none";
    next.style.display = "block";
    activeRef.current = next;
  }, []);

  // Reverses the turn mid-playback with NO angle snap: the target video's
  // time is mirrored (duration − current) so the bottle holds its current
  // angle and simply starts turning the other way.
  const switchTo = useCallback(
    (dir: "left" | "right") => {
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      const active = activeRef.current;
      if (!l || !r || !active) return null;
      const target = dir === "right" ? r : l;
      if (target === active) return target;
      const mirror = active.duration - active.currentTime;
      let nextTime = Number.isFinite(mirror) && mirror > 0 ? mirror : 0;
      const targetDur = target.duration;
      if (Number.isFinite(targetDur) && nextTime > targetDur - 0.05) {
        nextTime = Math.max(0, targetDur - 0.05);
      }
      target.currentTime = nextTime;
      setActive(target);
      void target.play().catch(() => {});
      return target;
    },
    [setActive],
  );

  const playNext = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    const active = activeRef.current ?? r;
    const desired = desiredDirRef.current;
    // Steering overrides the ping-pong: keep re-playing the video that
    // matches the steered direction (right → normal copy, left → reversed).
    let next = active === l ? r : l;
    if (desired === "right") next = r;
    else if (desired === "left") next = l;
    next.currentTime = 0;
    setActive(next);
    void next.play().catch(() => {});
  }, [setActive]);

  useEffect(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;

    // Reduced motion → static first frame (no playback, no alternating).
    if (reduce) {
      setActive(r);
      if (rootRef.current) {
        rootRef.current.style.opacity = "1";
        rootRef.current.style.visibility = "visible";
      }
      return;
    }

    setActive(r);
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
  }, [reduce, playNext, fadeOnScroll, markReady, setActive]);

  // Always-on rate loop (hero only): eases the active video's playbackRate
  // toward `targetRate`, so speed changes are silky instead of snapping.
  useEffect(() => {
    if (!interactive || reduce) return;
    const tick = () => {
      const active = activeRef.current;
      if (active) {
        curRateRef.current +=
          (targetRateRef.current - curRateRef.current) * 0.18;
        if (Math.abs(curRateRef.current - targetRateRef.current) < 0.01) {
          curRateRef.current = targetRateRef.current;
        }
        active.playbackRate = curRateRef.current;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, reduce]);

  // Mouse-follow (hero only): the turn SPEED follows the cursor velocity
  // and the direction follows the movement. ~250ms without movement eases
  // the rotation to a stop; ~1.2s later the auto 360° spin resumes.
  useEffect(() => {
    if (!interactive || reduce) return;
    const root = rootRef.current;
    if (!root) return;

    const resetTimers = () => {
      if (idleStopTimerRef.current)
        window.clearTimeout(idleStopTimerRef.current);
      if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const now = performance.now();
      if (!inside) {
        // Cursor left the hero → return to the auto spin immediately.
        lastXRef.current = null;
        lastMoveTimeRef.current = null;
        desiredDirRef.current = null;
        targetRateRef.current = 1;
        resetTimers();
        const active = activeRef.current;
        if (active) void active.play().catch(() => {});
        return;
      }
      const x = e.clientX;
      const dt =
        lastMoveTimeRef.current !== null
          ? Math.max(8, now - lastMoveTimeRef.current)
          : 16;
      const dx = lastXRef.current !== null ? x - lastXRef.current : 0;
      lastXRef.current = x;
      lastMoveTimeRef.current = now;

      if (Math.abs(dx) <= 2) return; // ignore jitter (timers keep running)

      const dir = dx > 0 ? "right" : "left";
      desiredDirRef.current = dir;
      const vel = Math.abs(dx) / dt; // px/ms
      targetRateRef.current = Math.min(
        MAX_RATE,
        Math.max(MIN_RATE, vel * RATE_PER_VEL),
      );
      switchTo(dir);

      resetTimers();
      idleStopTimerRef.current = window.setTimeout(() => {
        if (desiredDirRef.current === null) return;
        targetRateRef.current = 0; // mouse stopped → the turn eases out
      }, IDLE_STOP_MS);
      autoTimerRef.current = window.setTimeout(() => {
        desiredDirRef.current = null;
        targetRateRef.current = 1; // back to the auto 360° spin
        const active = activeRef.current;
        if (active) void active.play().catch(() => {});
      }, IDLE_AUTO_MS);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      resetTimers();
    };
  }, [interactive, reduce, switchTo]);

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
