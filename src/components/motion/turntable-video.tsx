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
//  · `interactive`   — hero only (walid's spec, wave 25 + 26): the bottle
//    is POSITION-LOCKED to the mouse — scrub, not speed:
//      · mouse X across the window = the turn: 0→1 maps the full 360°
//        (mouse at the left edge = front view, at the right edge = the
//        LAST second of the clip — it STOPS there: «الماوس وصل اخر
//        الصفحة الفيديو يقف عن اخر ثانية»).
//      · the bottle PLAYS toward the target: right of the hand = `right.mp4`
//        plays FORWARD through its turn; left of the hand = `left.mp4`
//        plays FORWARD — the RECORDED REVERSED footage, so the video
//        really plays back on the return (walid: «خاصية الـ reverse —
//        الفيديو يتعكس في الراجعة»). Arrival → PAUSE: the frame holds
//        exactly («الماوس واقف = الفيديو واقف»).
//      · قدام/ورا (mouse down/up) still ROUTES to the FRONT (0) or BACK
//        (0.5) with a short ease (rAF), then the hand owns the angle
//        again. VERTICAL wins over horizontal (discrete gesture).
//      · cursor leaves the hero → back to the AUTO 360° ping-pong from
//        the held angle (the rotation never dies on the page).
//    The hidden copy is always kept at the mirrored angle (wave 23/24
//    measured Δ, wrapped mod 1 — the loop), so any direction hand-off is
//    instant, and the end-of-video restart zone is unreachable.
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

// Measured mirror lag (wave 23): left's content sits ~12 sampled frames
// behind right's in the reversed pairing — `fTarget = 1 − fSelf + Δ`,
// wrapped mod 1 (both clips are full-turn loops: view repeats per turn).
const MIRROR_DELTA = 12 / 71; // 71 sampled frames of left.mp4 (≈0.169)
const SCRUB_END_MARGIN = 0.01; // park just before the final instant («آخر ثانية»)
const SCRUB_DEADBAND = 3; // px of micro-jitter ignored (the frame holds)
const SCRUB_RATE = 1.6; // real playback speed while the hand navigates (reverse = left.mp4)
const SCRUB_ARRIVE = 0.02; // ≈1.5 video frames — inside this the turn HOLDS (paused)
const ROUTE_ARRIVE = 0.004; // |Δfraction| below this → the routing is done
const ROUTE_EASE = 7; // per-second ease factor toward the front/back view

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

  // Scrub state (hero only): `scrubN` = the canonical turn fraction
  // (0 = FRONT view, 0.5 = BACK) the bottle currently shows. Everything
  // in the hero is driven by it 1:1 while the cursor rests on the hero.
  const scrubbingRef = useRef(false);
  const scrubNRef = useRef(0);
  const lastXRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const routeAnimRef = useRef<{ target: number; lastT: number } | null>(null);
  const targetNRef = useRef<number | null>(null); // the drag's position target (null = hold/route)
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

  // The clip time that shows bottle angle `n` (0 = front, 1 = end of the
  // turn = front again). `right.mp4` advances n with its own time; the
  // measured pair relation gives left's time: `(1 − n + Δ) mod 1` — same
  // wrapped loop, so both stay inside the clip (never the end-zone that
  // restarts a `play()`ed video — wave 24).
  const timeForN = useCallback(
    (dir: "left" | "right", n: number, video: HTMLVideoElement) => {
      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return 0;
      const safe = dur - SCRUB_END_MARGIN;
      if (dir === "right") {
        return Math.min(Math.max(0, n), 1) * safe;
      }
      let g = (1 - n + MIRROR_DELTA) % 1;
      if (g < 0) g += 1;
      if (g < 0.004) g = 0.004; // loop junction — just past the front, never exactly 0
      return g * safe;
    },
    [],
  );

  // Inverse of timeForN: the bottle angle currently shown by `video`.
  const fracOf = useCallback((video: HTMLVideoElement): number => {
    const dur = video.duration;
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    const f = Math.min(1, Math.max(0, video.currentTime / dur));
    return video === videoLeftRef.current ? (1 - f + MIRROR_DELTA) % 1 : f;
  }, []);

  const pauseBoth = useCallback(() => {
    videoRightRef.current?.pause();
    videoLeftRef.current?.pause();
  }, []);

  // Show bottle angle `n`: pick the clip by the SHORTEST signed arc from
  // the current angle (right.mp4 for forward scrubbing, left.mp4 for
  // backward), seek BOTH copies (the hidden one stays mirrored — instant
  // reversal at ANY moment), and show the chosen one. Everything stays
  // PAUSED: the frames follow the hand 1:1 and hold when it rests.
  const displayAt = useCallback(
    (nArg: number) => {
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      if (!l || !r) return;
      let n = nArg % 1;
      if (n < 0) n += 1;
      const prev = scrubNRef.current;
      const d = ((n - prev + 1.5) % 1) - 0.5; // shortest signed Δ
      const dir = Math.abs(d) < 1e-4 ? "right" : d > 0 ? "right" : "left";
      const target = dir === "right" ? r : l;
      const other = target === r ? l : r;
      target.currentTime = timeForN(dir, n, target);
      other.currentTime = timeForN(
        dir === "right" ? "left" : "right",
        n,
        other,
      );
      setActive(target);
      scrubNRef.current = n;
    },
    [setActive, timeForN],
  );

  // Enter the scrub from the auto ping-pong at the CURRENT bottle angle,
  // both videos paused (the frame holds exactly where it was).
  const enterScrub = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    if (!scrubbingRef.current) {
      scrubNRef.current = fracOf(active);
      pauseBoth();
      scrubbingRef.current = true;
    }
  }, [fracOf, pauseBoth]);

  // The horizontal drag: target the bottle at the mouse's position
  // fraction (0 = left edge → front, 1 = right edge → last second).
  const steerTo = useCallback(
    (nArg: number) => {
      enterScrub();
      routeAnimRef.current = null;
      let n = nArg % 1;
      if (n < 0) n += 1;
      targetNRef.current = n;
    },
    [enterScrub],
  );

  // Cursor left the hero → the auto 360° spin resumes from the held
  // angle (plays to the clip end, then the ping-pong alternates).
  const exitScrub = useCallback(() => {
    const active = activeRef.current;
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    routeAnimRef.current = null;
    targetNRef.current = null;
    if (active) void active.play().catch(() => {});
  }, []);

  // The direction (left/right) to ROUTE to the front (0) or back (0.5)
  // takes the SHORTEST arc from the current angle, animated with a short
  // ease in the rAF loop (the hand keeps owning the angle afterwards).
  const routeToView = useCallback(
    (target: 0 | 0.5) => {
      enterScrub();
      targetNRef.current = null; // the routing wins over the drag target
      routeAnimRef.current = { target, lastT: performance.now() };
    },
    [enterScrub],
  );

  // Always-on rAF while interactive (wave 26): the bottle PLAYS toward
  // the drag target — forward on `right.mp4` when the hand moves right,
  // FORWARD on `left.mp4` when it moves left (the recorded REVERSED
  // footage — walid's «خاصية الـ reverse»: the video really plays back
  // on the return). Arrival (≤ ~1.5 frames away) → PAUSE: the frame
  // holds exactly («الماوس واقف = الفيديو واقف»). The vertical routing
  // ease runs here too.
  useEffect(() => {
    if (!interactive || reduce) return;
    const tick = () => {
      const anim = routeAnimRef.current;
      if (anim) {
        const now = performance.now();
        const dt = Math.min(0.05, (now - anim.lastT) / 1000);
        anim.lastT = now;
        const adj = scrubNRef.current + 1;
        const rem = ((anim.target - scrubNRef.current + 1.5) % 1) - 0.5;
        if (Math.abs(rem) < ROUTE_ARRIVE) {
          displayAt(anim.target);
          routeAnimRef.current = null;
        } else {
          const step = rem * (1 - Math.exp(-ROUTE_EASE * dt));
          displayAt((scrubNRef.current + step + adj) % 1);
        }
      } else if (targetNRef.current !== null && scrubbingRef.current) {
        const active = activeRef.current;
        const l = videoLeftRef.current;
        const r = videoRightRef.current;
        if (active && l && r) {
          const n = fracOf(active); // the ACTUAL displayed angle
          scrubNRef.current = n;
          const d = ((targetNRef.current - n + 1.5) % 1) - 0.5;
          if (Math.abs(d) < SCRUB_ARRIVE) {
            // Arrived → HOLD the exact frame.
            if (!active.paused) active.pause();
          } else {
            const dir = d > 0 ? "right" : "left";
            const need = dir === "right" ? r : l;
            if (active !== need) displayAt(targetNRef.current); // swap via the mirror
            need.playbackRate = SCRUB_RATE;
            if (need.paused) void need.play().catch(() => {});
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, reduce, displayAt, steerTo, fracOf]);

  const playNext = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    const active = activeRef.current ?? r;
    const next = active === l ? r : l;
    next.currentTime = 0; // AUTO ping-pong: each clip plays its full 360° turn
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

  // Mouse-follow (hero only, walid's wave-25 SCRUB spec): inside the hero
  // the bottle angle = mouse X / window width (0 = left edge → front,
  // 1 = right edge → the clip's LAST second, held). Moving right scrubs
  // `right.mp4` forward, moving left scrubs `left.mp4` forward (the
  // bottle turns back with the hand), stillness holds the exact frame.
  // قدام/ورا (mouse down/up) route to the FRONT/BACK view — the frame
  // holds at the target. Outside the hero: auto 360° ping-pong resumes.
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
        // No hover → auto 360° spin resumes from the held angle.
        lastXRef.current = null;
        lastYRef.current = null;
        exitScrub();
        return;
      }

      enterScrub();
      const dx = lastXRef.current !== null ? e.clientX - lastXRef.current : 0;
      const dy = lastYRef.current !== null ? e.clientY - lastYRef.current : 0;
      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;

      if (Math.abs(dx) < SCRUB_DEADBAND && Math.abs(dy) < SCRUB_DEADBAND) {
        return; // micro-jitter → the bottle holds its exact frame
      }

      // Horizontal wins unless the move is CLEARLY a vertical push
      // (dy exceeds dx by a margin) — so diagonal dragging scrubs.
      if (Math.abs(dy) > Math.abs(dx) + 8) {
        // VERTICAL — route to FRONT (mouse down, قدام) / BACK (up, ورا).
        routeToView(dy > 0 ? 0 : 0.5);
      } else {
        // HORIZONTAL — the scrub: mouse X across the window = the turn
        // (the rAF loop plays the matching clip toward this target).
        steerTo(e.clientX / window.innerWidth);
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [
    interactive,
    reduce,
    enterScrub,
    exitScrub,
    displayAt,
    routeToView,
    steerTo,
  ]);

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
