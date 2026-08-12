"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ============================================================
// TurntableVideo — the reusable 360° turntable footage.
//
// `right.mp4` (turns RIGHT) and `left.mp4` (turns LEFT) alternate on
// `ended`, so the bottle rotates continuously with no seam — the same
// technique the old mobile hero used, now shared by the hero backdrop and
// the rotating showcase (the wave 11 WebGL turntable was removed — the
// real video is lighter, simpler and works everywhere).
// Source: walid's hand-made pair `public/hero/right.mp4` + `public/hero/left.mp4`
// (~3s full 360° turns each, 1280×720@24fps, start ≈ end so the loop has
// no seam). Directions VERIFIED with ffmpeg (gradient-flow metric,
// control-tested on hero.mp4): `right.mp4` = RIGHTWARD, `left.mp4` =
// LEFTWARD — names match. Both open with the same front view, so the
// mirrored-time switch maps angles exactly (duration-scaled: 3.04 vs 3.00s,
// with the wave-23 MEASURED +Δ ≈ 12-frames lag — the raw 1−f formula was
// up to ~62° off mid-turn).
// The old pair `hero.mp4`/`hero-left.mp4` (10s versions) was deleted.
//
//  · `fadeOnScroll`  — hero only: melts the layer away as the page
//    scrolls past the first screen.
//  · `fit="contain"` — showcase: show the whole bottle inside its 16:9
//    frame (black letterbox is removed by the parent mix-blend-screen).
//  · `interactive`   — hero only: the bottle moves WITH the hand in THREE
//    gestures — RIGHT/LEFT steer the 360° turn (SPEED tracks the cursor
//    velocity: fast mouse = fast turn, slow = slow; direction follows it:
//    RIGHT plays `right.mp4` = RIGHTWARD turn, LEFT plays `left.mp4` =
//    LEFTWARD turn via a mirrored-time switch: same angle, opposite
//    direction, no snap — durations scaled: 3.04s vs 3.00s), and
//    قدام/ورا (mouse down/up) ROUTE the bottle to its FRONT view (faces
//    the viewer) or BACK with an approach rate ∝ remaining angle (silk
//    hand-off back to the glide — the 360° spin NEVER stops).
//    The hidden copy stays PRE-SEEKED to the mirrored angle every frame,
//    so reversing direction is instant at ANY moment (no seek delay).
//    The 360° spin ALWAYS runs: when the hand rests over the hero the
//    turn eases down to a gentle glide (never frozen), and outside the
//    hero it runs at the full auto pace and COMPLETES the 360 turn again
//    (the two copies alternate on `ended`, no seam). The showcase stays
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

// Mouse-velocity → playbackRate mapping (hero only). The rotation speed
// mirrors the cursor: `rate = velocity(px/ms) × RATE_PER_VEL`, clamped.
// The 360° spin ALWAYS runs: a still hand over the hero eases the turn
// down to a gentle glide rate (never frozen — the hand only adds speed
// and direction on top), and outside the hero it runs at the full pace.
const MAX_RATE = 3; // fastest turn (quick mouse flick — responsive)
const MIN_RATE = 0.1; // slowest creep (barely-moving mouse)
const RATE_PER_VEL = 1.8; // ≈1× at a normal deliberate drag (~0.6px/ms)
const IDLE_GLIDE_MS = 300; // stillness over the hero → ease down to the glide
const IDLE_GLIDE_RATE = 0.55; // graceful continuous 360° while the hand rests
// Asymmetric rate easing (walid: «مرن ويستجيب بسرعة»): ACCELERATION is
// fast (the turn follows the hand almost immediately), DECELERATION is
// slow (releases settle silkily). One lerp for both was too laggy.
const RATE_ACCEL = 0.4; // per-rAF lerp when the target rate rises
const RATE_DECEL = 0.1; // per-rAF lerp when the target rate falls
// Vertical routing (قدام → front, ورا → back): the bottle turns to
// face the viewer (or show its back) with an APPROACH RATE proportional
// to the remaining turn fraction — it slows down as it gets there and
// hands back to the continuous glide: the 360° spin NEVER stops
// (walid: «لازم يلف ويفضل شغال»).
const VERT_ARRIVE = 0.02; // |Δturn fraction| below this → hand back to the glide
const RATE_PER_ANGLE = 4; // approach rate = |Δ| × this (cap MAX_RATE)
const POSE_HOLD_MS = 500; // grace window before the routing hands back to the glide
// Measured mirror lag (wave 23): left's content sits ~12 sampled frames
// behind right's in the reversed pairing — see mirrorTimeFor below.
const MIRROR_DELTA_INTO_LEFT = 12 / 71; // left.mp4 sampled every 2nd of 71 frames
const MIRROR_DELTA_INTO_RIGHT = 12 / 72; // right.mp4 sampled every 2nd of 72 frames

export function TurntableVideo({
  className = "",
  fit = "cover",
  poster,
  fadeOnScroll = false,
  interactive = false,
}: TurntableVideoProps) {
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null); // right.mp4 — turns RIGHT
  const videoLeftRef = useRef<HTMLVideoElement>(null); // left.mp4 — turns LEFT
  const activeRef = useRef<HTMLVideoElement | null>(null); // the currently shown video

  const [ready, setReady] = useState(false);

  // Mouse-follow state: null = auto spin (cursor outside), otherwise the
  // steered direction.
  const desiredDirRef = useRef<"left" | "right" | null>(null);
  const lastXRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number | null>(null);
  const accDxRef = useRef(0); // accumulated movement since the last steer
  const accDyRef = useRef(0); // accumulated vertical movement (قدام/ورا routing)
  const vertDirRef = useRef<1 | -1 | null>(null); // 1 = front (قدام) · −1 = back (ورا)
  const vertHoldTimerRef = useRef<number | null>(null);
  const idleGlideTimerRef = useRef<number | null>(null);

  // playbackRate easing (rAF loop): `curRate` drifts toward `targetRate`.
  const targetRateRef = useRef(1);
  const curRateRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  const markReady = useCallback(() => setReady(true), []);

  const setActive = useCallback((next: HTMLVideoElement) => {
    const prev = activeRef.current;
    if (prev && prev !== next) {
      prev.style.display = "none";
      prev.pause(); // the hidden copy must never advance on its own
    }
    next.style.display = "block";
    activeRef.current = next;
  }, []);

  // The time in `target` that shows the SAME bottle angle as `source` at
  // its current time. MEASURED (wave 23): the raw `td · (1 − f)` assumption
  // is up to ~62° off mid-turn — walid's pair IS reversed but NOT
  // time-aligned (left's content lags right's by ~12 sampled frames ≈ 61°).
  // Best-fit line over the full SSD matrix (every 2nd frame, 640×360,
  // both directions): `fTarget = 1 − fSelf + Δ` — mean SSD 5.98 vs 7.09
  // for the old formula (in-phase model: 6.47; the 320×180 fit agreed:
  // scale≈1.1, Δ≈+10). Clamp to [0, 1] — on the front arc the mate lands
  // on the target's own front (its loop end, same view).
  const mirrorTimeFor = useCallback(
    (source: HTMLVideoElement, target: HTMLVideoElement) => {
      const sd = source.duration;
      const td = target.duration;
      if (!Number.isFinite(sd) || !Number.isFinite(td) || sd <= 0 || td <= 0) {
        return 0;
      }
      const f = Math.min(1, Math.max(0, source.currentTime / sd));
      const delta =
        target === videoLeftRef.current
          ? MIRROR_DELTA_INTO_LEFT
          : MIRROR_DELTA_INTO_RIGHT;
      return td * Math.min(1, Math.max(0, 1 - f + delta));
    },
    [],
  );

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
      const mirror = mirrorTimeFor(active, target);
      let nextTime = mirror > 0 ? mirror : 0;
      const targetDur = target.duration;
      if (Number.isFinite(targetDur) && nextTime > targetDur - 0.05) {
        nextTime = Math.max(0, targetDur - 0.05);
      }
      target.currentTime = nextTime;
      setActive(target);
      void target.play().catch(() => {});
      return target;
    },
    [setActive, mirrorTimeFor],
  );

  // Current turn fraction `n` of the shown clip (0 = FRONT view, 0.5 = BACK:
  // the back faces the camera halfway through either clip). `right.mp4`
  // advances n with its time, `left.mp4` counts backwards.
  const navFraction = useCallback((): number => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    const active = activeRef.current;
    if (!l || !r || !active) return 0;
    if (active === r) {
      return r.duration > 0
        ? Math.min(1, Math.max(0, active.currentTime / r.duration))
        : 0;
    }
    if (l.duration > 0) {
      const f = Math.min(1, Math.max(0, active.currentTime / l.duration));
      const n = (1 - f) % 1;
      return n < 0 ? n + 1 : n;
    }
    return 0;
  }, []);

  // Route the bottle to a view — FRONT (faces the viewer, قدام) or BACK
  // (ظهرها) — taking the SHORTEST arc with an approach rate ∝ remaining
  // distance: fast first, then a silk hand-off back to the continuous
  // glide. The rotation NEVER stops (rate 0 is never a target here).
  const routeToView = useCallback(
    (dir: 1 | -1) => {
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      const active = activeRef.current;
      if (!l || !r || !active) return;
      const target = dir === 1 ? 0 : 0.5;
      const d = ((target - navFraction() + 1.5) % 1) - 0.5; // shortest signed Δ
      if (Number.isNaN(d)) return;
      if (Math.abs(d) < VERT_ARRIVE) {
        // Arrived at the view → ease to the gentle glide (still turning).
        desiredDirRef.current = null;
        targetRateRef.current = IDLE_GLIDE_RATE;
        return;
      }
      const turnDir = d > 0 ? "right" : "left";
      desiredDirRef.current = turnDir;
      switchTo(turnDir);
      targetRateRef.current = Math.min(
        MAX_RATE,
        Math.max(MIN_RATE, Math.abs(d) * RATE_PER_ANGLE),
      );
    },
    [navFraction, switchTo],
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
  // toward `targetRate` (silky speed changes) AND keeps the hidden copy
  // pre-seeked to the mirrored position (`duration − current`), so a
  // direction reversal at ANY moment is instant — the exact angle is
  // already decoded, no seek at switch time.
  useEffect(() => {
    if (!interactive || reduce) return;
    const tick = () => {
      const active = activeRef.current;
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      if (active && l && r) {
        const diff = targetRateRef.current - curRateRef.current;
        curRateRef.current += diff * (diff > 0 ? RATE_ACCEL : RATE_DECEL);
        if (Math.abs(curRateRef.current - targetRateRef.current) < 0.01) {
          curRateRef.current = targetRateRef.current;
        }
        active.playbackRate = curRateRef.current;

        // Reverse-readiness: mirror the active position into the hidden
        // copy in coarse hops (0.35s) — cheap, and the swap is instant.
        const inactive = active === l ? r : l;
        const mirror = mirrorTimeFor(active, inactive);
        if (mirror > 0) {
          if (Math.abs(inactive.currentTime - mirror) > 0.35) {
            inactive.currentTime = mirror;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, reduce, mirrorTimeFor]);

  // Mouse-follow (hero only) — the bottle moves WITH the hand in all three
  // directions: RIGHT/LEFT = steering the 360° turn (velocity-based speed),
  // قدام (mouse forward/down) = the bottle smoothly ROUTES to its FRONT
  // view (faces the viewer), ورا (up) = routes to its BACK — approach rate
  // ∝ remaining distance, silk hand-off, and the rotation NEVER stops
  // (the glide is always the floor — walid: «لازم يلف ويفضل شغال»).
  // Outside the hero the turn runs at the full auto pace (rate 1).
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
        // No hover → full auto 360° spin (continuous ping-pong).
        lastXRef.current = null;
        lastYRef.current = null;
        lastMoveTimeRef.current = null;
        accDxRef.current = 0;
        accDyRef.current = 0;
        desiredDirRef.current = null;
        vertDirRef.current = null;
        targetRateRef.current = 1;
        if (vertHoldTimerRef.current) {
          window.clearTimeout(vertHoldTimerRef.current);
        }
        if (idleGlideTimerRef.current) {
          window.clearTimeout(idleGlideTimerRef.current);
        }
        const active = activeRef.current;
        if (active) void active.play().catch(() => {});
        return;
      }

      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;
      const dt =
        lastMoveTimeRef.current !== null
          ? Math.max(8, now - lastMoveTimeRef.current)
          : 16;
      const dx = lastXRef.current !== null ? x - lastXRef.current : 0;
      const dy = lastYRef.current !== null ? y - lastYRef.current : 0;
      lastXRef.current = x;
      lastYRef.current = y;
      lastMoveTimeRef.current = now;

      accDxRef.current += dx;
      accDyRef.current += dy;
      const ax = Math.abs(accDxRef.current);
      const ay = Math.abs(accDyRef.current);

      if (ax < 3 && ay < 3) {
        // Micro-jitter → ease back to the gentle glide (unless a vertical
        // routing gesture is still alive — that wins for its window).
        if (vertDirRef.current === null) {
          targetRateRef.current = IDLE_GLIDE_RATE;
        }
        return;
      }

      // ======== HORIZONTAL: steer the 360° turn ========
      if (ax > ay) {
        accDyRef.current = 0;
        const dir = accDxRef.current > 0 ? "right" : "left";
        desiredDirRef.current = dir;
        const vel = ax / dt; // px/ms
        targetRateRef.current = Math.min(
          MAX_RATE,
          Math.max(MIN_RATE, vel * RATE_PER_VEL),
        );
        accDxRef.current = 0;
        switchTo(dir);
      } else {
        // ======== VERTICAL: route to the FRONT (قدام) / BACK (ورا) ========
        accDxRef.current = 0;
        vertDirRef.current = accDyRef.current > 0 ? 1 : -1; // down = toward the viewer
        routeToView(vertDirRef.current);
        accDyRef.current = 0;
      }

      // The gesture's grace window: while the hand keeps pushing (or
      // ≤ POSE_HOLD_MS after it stops) the routing stays alive, then
      // the turn hands back to the continuous glide.
      if (vertHoldTimerRef.current) {
        window.clearTimeout(vertHoldTimerRef.current);
      }
      vertHoldTimerRef.current = window.setTimeout(() => {
        vertDirRef.current = null;
        desiredDirRef.current = null;
        targetRateRef.current = IDLE_GLIDE_RATE;
      }, POSE_HOLD_MS);

      // Hand still over the hero → the turn eases down to the glide
      // (continuous rotation, never a frozen frame).
      if (idleGlideTimerRef.current) {
        window.clearTimeout(idleGlideTimerRef.current);
      }
      idleGlideTimerRef.current = window.setTimeout(() => {
        if (vertDirRef.current === null) {
          desiredDirRef.current = null;
          targetRateRef.current = IDLE_GLIDE_RATE;
        }
      }, IDLE_GLIDE_MS);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (vertHoldTimerRef.current) {
        window.clearTimeout(vertHoldTimerRef.current);
      }
      if (idleGlideTimerRef.current) {
        window.clearTimeout(idleGlideTimerRef.current);
      }
    };
  }, [interactive, reduce, switchTo, routeToView]);

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
        src="/hero/right.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
      <video
        ref={videoLeftRef}
        src="/hero/left.mp4"
        muted
        playsInline
        preload="auto"
        poster={poster}
        className={videoClass}
      />
    </div>
  );
}
