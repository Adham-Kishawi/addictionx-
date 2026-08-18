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
//  · WAVE 32 — the hero plays the ALL-INTRА re-encodes
//    `right-scrub.mp4`/`left-scrub.mp4` (every frame a keyframe I-frame,
//    `-g 1 -bf 0`, 1.3MB each — walid: «استخدم نفس طريقة الفريمات و GSAP
//    في الهيرو لحل مشاكل الحركة يمين وشمال»): every interactive seek now
//    decodes ONE frame and presents it exactly — no keyframe snapping,
//    no inter-frame decode chains, the left/right steering is silk at any
//    hand speed (the same fix that made the assembly showcase smooth).
//    Originals kept for reference (only used when re-encoding).
//
//  · WAVE 42 — the MOVEMENT-PERFORMANCE pass. The interaction model
//    (screen split · dead zone · vertical routing · auto ping-pong) is
//    unchanged; what changed is the machinery underneath it:
//      1. ONE seek per presented frame, on the ACTIVE clip only. The old
//         `displayAt` seeked BOTH 720p clips on every update — double the
//         decode work for a frame nobody sees. The idle copy is now
//         synced to its mirrored angle only (a) immediately before an
//         actual direction hand-off, and (b) once after the hand rests,
//         so instant reversal is still free.
//      2. The seek pipeline is driven by `requestVideoFrameCallback`
//         (fallback: the `seeked` event, plus a short watchdog) instead
//         of an always-on rAF that polled `video.seeking`. Never more
//         than one seek in flight; the newest pointer target is
//         COALESCED and picked up the moment the previous frame is
//         presented.
//      3. The broad catch-up ease (`CATCH_RATE 6`) that made far targets
//         visibly lag the hand is gone: targets inside `DIRECT_PICK` are
//         taken exactly, and only a big jump (page entry, a flying hand)
//         gets a SHORT settle so it never jump-cuts.
//      4. Pointer handlers are LOCAL to the hero surface (no global
//         mousemove, no `getBoundingClientRect` per event — the window
//         center is cached and refreshed on resize).
//      5. Everything (playback, rAF, pending seeks) is suspended while
//         the stage is off-screen or the document is hidden, and resumed
//         on return — a background tab costs nothing.
//      6. The soft-focus veil drops to `SCRUB_BLUR` while frames are
//         actually being scrubbed and eases back to the full cinematic
//         blur when the hand rests (a full-frame backdrop blur over a
//         changing video is the most expensive layer on the page).
//
//  · `fadeOnScroll`  — hero only: melts the layer away as the page
//    scrolls past the first screen.
//  · `fit="contain"` — showcase: show the whole bottle inside its 16:9
//    frame (black letterbox is removed by the parent mix-blend-screen).
//  · `interactive`   — hero only (walid's spec, wave 25→28b): the SCREEN
//    is SPLIT at its middle — right half = the FORWARD turn only, left
//    half = the REVERSE (recorded `left.mp4`) — the direction flips ONLY
//    when the cursor crosses the middle («الشاشة مقسومة اتنين … طول ما
//    أنا في نفس الجانب مينفعش الفيديو يروح للجانب الآخر»):
//      · the distance of the cursor from the CENTER within its half maps
//        1:1 to the turn (the center = the FRONT view, the right screen
//        edge = the clip's LAST second — it stops there, the left edge =
//        a full reversed turn; ±50px dead-zone at the middle holds the
//        front — the ui-skill pattern).
//      · the videos stay PAUSED while steered, so the end-of-video
//        restart zone is unreachable = the «بيخرف» glitch cannot happen,
//        and a resting hand HOLDS the exact frame.
//      · قدام/ورا (mouse down/up) still ROUTES to the FRONT (0) or BACK
//        (0.5) with a short ease, then the hand owns the angle again.
//        VERTICAL wins over horizontal (discrete gesture).
//      · cursor leaves the hero → back to the AUTO 360° ping-pong from
//        the held angle (the rotation never dies on the page).
//  · `surfaceSelector` — the ancestor that actually receives pointer
//    events (the video layer itself is `pointer-events-none`). The hero
//    passes `#hero-stage`; without it the parent element is used.
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
  surfaceSelector?: string;
}

// Measured mirror lag (wave 23): left's content sits ~12 sampled frames
// behind right's in the reversed pairing — `fTarget = 1 − fSelf + Δ`,
// wrapped mod 1 (both clips are full-turn loops: view repeats per turn).
const MIRROR_DELTA = 12 / 71; // 71 sampled frames of left.mp4 (≈0.169)
const SCRUB_END_MARGIN = 0.01; // park just before the final instant («آخر ثانية»)
const SCRUB_DEADBAND = 3; // px of micro-jitter ignored (the frame holds)
const SCRUB_SEEK_STEP = 0.03; // seek only when ≥ ~1 frame off target (anti-jitter, ui skill)
const CENTER_DEADZONE = 50; // ui-skill dead-zone at the screen center → front view holds
const DIRECT_PICK = 0.12; // within ~12% of a turn → take the hand's exact target (zero lag)
const SETTLE_RATE = 26; // per-second ease used ONLY for a big jump (entry, flying hand)
const ROUTE_ARRIVE = 0.004; // |Δfraction| below this → the routing is done
const ROUTE_EASE = 7; // per-second ease factor toward the front/back view
const SEEK_WATCHDOG_MS = 180; // presentation watchdog — a paused decode can hang
const REST_SYNC_MS = 90; // hand at rest for this long → mirror-sync the idle clip once
// A full-viewport backdrop filter has to re-sample the moving video beneath
// it. Keep the cinematic rest blur, but remove that GPU cost while scrubbing.
const SCRUB_BLUR = "none";
const REST_BLUR = "blur(5px)"; // the full cinematic soft-focus at rest (wave 33)

// Shortest signed distance between two turn fractions, in (−0.5, 0.5].
function shortestDelta(delta: number): number {
  return (((delta % 1) + 1.5) % 1) - 0.5;
}

export function TurntableVideo({
  className = "",
  fit = "cover",
  poster,
  fadeOnScroll = false,
  interactive = false,
  surfaceSelector,
}: TurntableVideoProps) {
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
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
  const settleTRef = useRef(0); // timer of the short settle used for big jumps
  const rafRef = useRef<number | null>(null); // the (rare) scheduled pump
  const pumpRef = useRef<() => void>(() => {});
  const pendingSeekRef = useRef(false); // one seek in flight at most
  const cancelWaitRef = useRef<(() => void) | null>(null);
  const mirrorSyncedRef = useRef(false); // is the idle clip parked at the mirrored angle?
  const restTimerRef = useRef<number | null>(null);
  const centerXRef = useRef(0); // cached window centre (screen-split mapping)
  const runningRef = useRef(true); // on-screen AND document visible
  const inViewRef = useRef(true);

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

  // The soft-focus veil: cheap while frames move, full cinematic blur at
  // rest. Written straight to the DOM — never a React re-render.
  const setVeilBlur = useCallback((value: string) => {
    const veil = veilRef.current;
    if (!veil || veil.style.backdropFilter === value) return;
    veil.style.backdropFilter = value;
    veil.style.setProperty("-webkit-backdrop-filter", value);
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

  const clearRestTimer = useCallback(() => {
    if (restTimerRef.current !== null) {
      window.clearTimeout(restTimerRef.current);
      restTimerRef.current = null;
    }
  }, []);

  // Park the idle copy at the mirrored angle so a direction hand-off has
  // nothing to decode. Done ONCE per rest — never per frame (that was the
  // second half of the old double-seek cost).
  const syncIdleClip = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    const active = activeRef.current;
    if (!l || !r || !active) return;
    const idle = active === r ? l : r;
    idle.currentTime = timeForN(
      idle === r ? "right" : "left",
      scrubNRef.current,
      idle,
    );
    mirrorSyncedRef.current = true;
    setVeilBlur(REST_BLUR); // the hand rested → back to the full soft focus
  }, [setVeilBlur, timeForN]);

  const scheduleRestSync = useCallback(() => {
    if (mirrorSyncedRef.current || restTimerRef.current !== null) return;
    restTimerRef.current = window.setTimeout(() => {
      restTimerRef.current = null;
      syncIdleClip();
    }, REST_SYNC_MS);
  }, [syncIdleClip]);

  // Show bottle angle `n`. The clip is picked by the SHORTEST signed arc
  // (right.mp4 forward, left.mp4 backward); only the clip that will be on
  // screen is seeked. When the arc flips the direction, the incoming copy
  // is synced to the exact angle IMMEDIATELY BEFORE it is shown — that is
  // the only moment the second clip costs anything. Everything stays
  // PAUSED: the frames follow the hand 1:1 and hold when it rests.
  const displayAt = useCallback(
    (nArg: number): HTMLVideoElement | null => {
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      if (!l || !r) return null;
      let n = nArg % 1;
      if (n < 0) n += 1;
      const active = activeRef.current;
      const d = shortestDelta(n - scrubNRef.current);
      let dir: "left" | "right";
      if (Math.abs(d) < 1e-4 && active) {
        dir = active === l ? "left" : "right"; // a hold never forces a hand-off
      } else {
        dir = d >= 0 ? "right" : "left";
      }
      const target = dir === "right" ? r : l;
      target.currentTime = timeForN(dir, n, target);
      if (target !== active) setActive(target); // the hand-off (seek above)
      scrubNRef.current = n;
      mirrorSyncedRef.current = false;
      return target;
    },
    [setActive, timeForN],
  );

  // Wait until the seeked frame is actually PRESENTED. `rVFC` is the exact
  // signal (it fires for a paused seek too); `seeked` is the fallback, and
  // the watchdog covers a decode that never reports back.
  const waitForPresentation = useCallback(
    (video: HTMLVideoElement, done: () => void) => {
      let finished = false;
      let handle = 0;
      let timer = 0;
      const cleanup = () => {
        window.clearTimeout(timer);
        video.removeEventListener("seeked", onSeeked);
        if (handle && typeof video.cancelVideoFrameCallback === "function") {
          video.cancelVideoFrameCallback(handle);
        }
      };
      const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        done();
      };
      function onSeeked() {
        finish();
      }
      timer = window.setTimeout(finish, SEEK_WATCHDOG_MS);
      if (typeof video.requestVideoFrameCallback === "function") {
        handle = video.requestVideoFrameCallback(() => finish());
      } else {
        video.addEventListener("seeked", onSeeked);
      }
      return () => {
        finished = true;
        cleanup();
      };
    },
    [],
  );

  const schedulePump = useCallback(() => {
    if (rafRef.current !== null || pendingSeekRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      pumpRef.current();
    });
  }, []);

  const seekTo = useCallback(
    (n: number) => {
      const shown = displayAt(n);
      if (!shown) return;
      clearRestTimer();
      setVeilBlur(SCRUB_BLUR); // frames are moving — keep the veil cheap
      pendingSeekRef.current = true;
      cancelWaitRef.current?.();
      cancelWaitRef.current = waitForPresentation(shown, () => {
        cancelWaitRef.current = null;
        pendingSeekRef.current = false;
        // The frame is on screen — take the NEWEST target (coalesced) and
        // decide whether one more seek is worth it.
        pumpRef.current();
      });
    },
    [clearRestTimer, displayAt, setVeilBlur, waitForPresentation],
  );

  // The engine: one decision per presented frame. It converges on the
  // pointer target (exact when close, short settle when far) or eases the
  // vertical routing, seeks at most ONE clip, and stops on its own the
  // moment there is nothing left to move.
  const pump = useCallback(() => {
    if (!interactive || reduce) return;
    if (!runningRef.current || pendingSeekRef.current) return;
    const active = activeRef.current;
    if (!active || !scrubbingRef.current) return;

    const now = performance.now();
    const cur = scrubNRef.current;
    let desired: number | null = null;

    const anim = routeAnimRef.current;
    if (anim) {
      const dt = Math.min(0.05, Math.max(0, (now - anim.lastT) / 1000));
      anim.lastT = now;
      const rem = shortestDelta(anim.target - cur);
      if (Math.abs(rem) < ROUTE_ARRIVE) {
        desired = anim.target;
        routeAnimRef.current = null;
      } else {
        desired = cur + rem * (1 - Math.exp(-ROUTE_EASE * dt));
      }
    } else if (targetNRef.current !== null) {
      const d = shortestDelta(targetNRef.current - cur);
      if (Math.abs(d) <= DIRECT_PICK) {
        desired = targetNRef.current; // follow the hand exactly — no lag
        settleTRef.current = now;
      } else {
        // Only a BIG jump is eased, and briefly — so an entry or a flying
        // hand arrives softly instead of jump-cutting.
        const dt = Math.min(0.05, Math.max(0, (now - settleTRef.current) / 1000));
        settleTRef.current = now;
        desired = cur + d * (1 - Math.exp(-SETTLE_RATE * dt));
      }
    }

    if (desired === null) {
      scheduleRestSync();
      return;
    }

    const gate = SCRUB_SEEK_STEP / Math.max(0.01, active.duration || 1);
    if (Math.abs(shortestDelta(desired - cur)) >= gate) {
      seekTo(desired);
      return;
    }
    // Inside a single video frame → hold the exact frame (no seek churn).
    if (routeAnimRef.current) schedulePump();
    else scheduleRestSync();
  }, [interactive, reduce, scheduleRestSync, schedulePump, seekTo]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  // Enter the scrub from the auto ping-pong at the CURRENT bottle angle,
  // both videos paused (the frame holds exactly where it was).
  const enterScrub = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    if (!scrubbingRef.current) {
      scrubNRef.current = fracOf(active);
      pauseBoth();
      scrubbingRef.current = true;
      settleTRef.current = performance.now();
      mirrorSyncedRef.current = false;
      // The reverse copy is only needed once the hand actually arrives.
      const l = videoLeftRef.current;
      if (l && l.preload !== "auto") l.preload = "auto";
    }
  }, [fracOf, pauseBoth]);

  // The horizontal drag (walid's wave-28b spec — «الشاشة نفسها مقسومة
  // اتنين»): the WINDOW is split at its middle. The RIGHT half = the
  // forward turn only: its absolute distance from the center maps 1:1 to
  // the turn (center = the FRONT view, the right screen edge = the clip's
  // last second) — as long as the hand stays in the right half the video
  // can NEVER go to the reverse side, and it flips only when the cursor
  // physically crosses into the LEFT half (its mirrored mapping: the
  // left edge = a full leftward turn). The ±`CENTER_DEADZONE` holds the
  // front near the middle (the ui-skill's dead-zone).
  const steerTo = useCallback(
    (x: number) => {
      enterScrub();
      routeAnimRef.current = null;
      const c = centerXRef.current || window.innerWidth / 2;
      if (Math.abs(x - c) < CENTER_DEADZONE) {
        targetNRef.current = 0; // the front — the neutral «منتصف»
        schedulePump();
        return;
      }
      targetNRef.current = Math.max(-1, Math.min(1, (x - c) / Math.max(1, c)));
      schedulePump();
    },
    [enterScrub, schedulePump],
  );

  // Cursor left the hero → the auto 360° spin resumes from the held
  // angle (plays to the clip end, then the ping-pong alternates).
  const exitScrub = useCallback(() => {
    if (!scrubbingRef.current) return;
    const active = activeRef.current;
    scrubbingRef.current = false;
    routeAnimRef.current = null;
    targetNRef.current = null;
    clearRestTimer();
    setVeilBlur(REST_BLUR);
    if (active && runningRef.current) void active.play().catch(() => {});
  }, [clearRestTimer, setVeilBlur]);

  // The direction (left/right) to ROUTE to the front (0) or back (0.5)
  // takes the SHORTEST arc from the current angle, animated with a short
  // ease (the hand keeps owning the angle afterwards).
  const routeToView = useCallback(
    (target: 0 | 0.5) => {
      enterScrub();
      targetNRef.current = null; // the routing wins over the drag target
      routeAnimRef.current = { target, lastT: performance.now() };
      schedulePump();
    },
    [enterScrub, schedulePump],
  );

  const playNext = useCallback(() => {
    const l = videoLeftRef.current;
    const r = videoRightRef.current;
    if (!l || !r) return;
    if (!runningRef.current || scrubbingRef.current) return;
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

    // Mobile-first paint: touch devices show the POSTER instantly and the
    // footage starts a moment later, so the first seconds of the visit
    // render copy + poster instead of competing with a video download.
    // Data-saver / 2G connections stay on the poster entirely.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const conn = (
      navigator as { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const slowNet =
      Boolean(conn?.saveData) || /(^|-)2g$/.test(conn?.effectiveType ?? "");

    let t: number | undefined;
    let tReveal: number | undefined;
    if (slowNet) {
      // Poster only — the turntable is decoration, not content.
      tReveal = window.setTimeout(markReady, 0);
    } else {
      // Reveal the poster before the video arrives on touch devices.
      if (coarse) tReveal = window.setTimeout(markReady, 0);
      t = window.setTimeout(
        () => {
          if (runningRef.current) void r.play().catch(() => {});
          markReady();
        },
        coarse ? 2500 : 250,
      );
    }

    // The reverse copy is not needed for the first impression — it is
    // upgraded to a full preload once the hero has settled (or earlier,
    // the moment the pointer reaches the stage — see enterScrub).
    const upgradeLeft = window.setTimeout(() => {
      // Touch-only devices do not run mouse turntable scrubbing, so loading
      // the reciprocal clip there spends bandwidth and decoder memory without
      // improving the experience.
      if (
        window.matchMedia("(pointer: fine)").matches &&
        l.preload !== "auto"
      ) {
        l.preload = "auto";
      }
    }, 1_200);

    // Reveal as soon as the footage is actually playable (never a blind
    // timer) — the 250ms fallback above stays as a safety net.
    r.addEventListener("loadeddata", markReady);
    r.addEventListener("playing", markReady);

    l.addEventListener("ended", playNext);
    r.addEventListener("ended", playNext);

    // Hero-only: smooth exit on scroll (the hero melts into the page).
    let onScroll: (() => void) | undefined;
    let scrollRaf: number | null = null;
    if (fadeOnScroll) {
      const applyFade = () => {
        scrollRaf = null;
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
      // One write per animation frame — a scroll burst cannot flood it.
      onScroll = () => {
        if (scrollRaf === null) scrollRaf = requestAnimationFrame(applyFade);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      if (t !== undefined) window.clearTimeout(t);
      if (tReveal !== undefined) window.clearTimeout(tReveal);
      window.clearTimeout(upgradeLeft);
      r.removeEventListener("loadeddata", markReady);
      r.removeEventListener("playing", markReady);
      l.removeEventListener("ended", playNext);
      r.removeEventListener("ended", playNext);
      l.pause();
      r.pause();
      if (onScroll) window.removeEventListener("scroll", onScroll);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
    };
  }, [reduce, playNext, fadeOnScroll, markReady, setActive]);

  // Off-screen / hidden tab → nothing runs. The turntable is decorative:
  // a video that nobody can see must not decode, and no loop may survive
  // in a background tab. Coming back resumes exactly where it stopped.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const suspend = () => {
      if (!runningRef.current) return;
      runningRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cancelWaitRef.current?.();
      cancelWaitRef.current = null;
      pendingSeekRef.current = false;
      clearRestTimer();
      routeAnimRef.current = null;
      targetNRef.current = null;
      scrubbingRef.current = false;
      lastXRef.current = null;
      lastYRef.current = null;
      pauseBoth();
    };

    const resume = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      if (reduce) return;
      setVeilBlur(REST_BLUR);
      const active = activeRef.current;
      if (active) void active.play().catch(() => {});
    };

    const evaluate = () => {
      const shouldRun = inViewRef.current && !document.hidden;
      if (shouldRun) resume();
      else suspend();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) inViewRef.current = entry.isIntersecting;
        evaluate();
      },
      { threshold: 0 },
    );
    io.observe(root);
    document.addEventListener("visibilitychange", evaluate);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", evaluate);
    };
  }, [clearRestTimer, pauseBoth, reduce, setVeilBlur]);

  // Mouse-follow (hero only, walid's wave-25 SPEC → wave-28b: «الشاشة
  // نفسها مقسومة اتنين … طول ما أنا في نفس الجانب مينفعش الفيديو يروح
  // للجانب الآخر غير لما الماوس يروح الجانب الآخر»): the WINDOW SPLITS
  // at its middle. Right half = the forward turn ONLY (distance from the
  // center → the turn 1:1; the right screen edge = the last second);
  // left half = the mirrored reverse (left.mp4, the recorded reversed
  // footage — the return is real). The direction flips ONLY when the
  // cursor crosses the middle. قدام/ورا (mouse down/up) route to the
  // FRONT/BACK view. Outside the hero: auto 360° ping-pong.
  //
  // The listeners live on the hero SURFACE (the video layer itself is
  // pointer-events-none), so leaving the stage is a real `pointerleave`
  // instead of a global mousemove + a hit-test per event.
  useEffect(() => {
    if (!interactive || reduce) return;
    const root = rootRef.current;
    if (!root) return;
    const surface =
      (surfaceSelector
        ? root.closest<HTMLElement>(surfaceSelector)
        : root.parentElement) ?? root.parentElement;
    if (!surface) return;

    const measure = () => {
      centerXRef.current = window.innerWidth / 2;
    };
    measure();

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !runningRef.current) return;
      const x = e.clientX;
      const y = e.clientY;
      const dx = lastXRef.current !== null ? x - lastXRef.current : 0;
      const dy = lastYRef.current !== null ? y - lastYRef.current : 0;
      lastXRef.current = x;
      lastYRef.current = y;

      enterScrub();

      if (Math.abs(dx) < SCRUB_DEADBAND && Math.abs(dy) < SCRUB_DEADBAND) {
        return; // micro-jitter → the bottle holds its exact frame
      }

      // Horizontal wins unless the move is CLEARLY a vertical push
      // (dy exceeds dx by a margin) — so diagonal dragging scrubs.
      if (Math.abs(dy) > Math.abs(dx) + 8) {
        // VERTICAL — route to FRONT (mouse down, قدام) / BACK (up, ورا).
        routeToView(dy > 0 ? 0 : 0.5);
      } else {
        // HORIZONTAL — the SCREEN-SPLIT scrub (steerTo clamps ±1).
        steerTo(x);
      }
    };

    const onPointerLeave = () => {
      lastXRef.current = null;
      lastYRef.current = null;
      exitScrub();
    };

    surface.addEventListener("pointermove", onPointerMove, { passive: true });
    surface.addEventListener("pointerleave", onPointerLeave);
    surface.addEventListener("pointercancel", onPointerLeave);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerleave", onPointerLeave);
      surface.removeEventListener("pointercancel", onPointerLeave);
      window.removeEventListener("resize", measure);
    };
  }, [
    interactive,
    reduce,
    surfaceSelector,
    enterScrub,
    exitScrub,
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
    >
      {/* The poster paints straight from the server HTML — before any
          JavaScript loads. Without it the whole hero sat at opacity 0
          until hydration + video start (measured: LCP ~5s on a throttled
          phone). The video layer fades in ABOVE it when actually ready. */}
      {poster ? (
        <img
          src={poster}
          alt=""
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full ${
            fit === "cover" ? "object-cover" : "object-contain"
          }`}
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 0.8s ease 0.15s",
        }}
      >
      <video
        ref={videoRightRef}
        src="/hero/right-scrub.mp4"
        muted
        playsInline
        // Load only the first frame for the initial paint. Full footage is
        // fetched by the browser once playback begins.
        preload="metadata"
        poster={poster}
        className={videoClass}
      />
      <video
        ref={videoLeftRef}
        src="/hero/left-scrub.mp4"
        muted
        playsInline
        // The reverse clip is only needed after a mouse interaction.
        preload="none"
        poster={poster}
        className={videoClass}
      />
      {/* Wave 33 — soft-focus veil ABOVE the footage (walid: «خلي
          الفيديو نفسه في فوقه طبقة BLUR»): a gentle backdrop-blur that
          softens the product footage for a dreamy, eye-comfortable
          cinematic look — content layers above (veil/particles/copy)
          are NOT blurred, only the video itself.
          Wave 42 — the blur eases down while the frames are actually
          being scrubbed (blurring a moving 720p layer every frame is the
          most expensive thing on the hero) and returns the moment the
          hand rests. */}
      {/* Phones skip the veil entirely (hidden lg:block): a full-screen
          backdrop-filter over playing video is the most expensive layer
          on the page and reads barely differently on a small screen. */}
      <div
        ref={veilRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] hidden lg:block"
        style={{
          backdropFilter: REST_BLUR,
          WebkitBackdropFilter: REST_BLUR,
          transition: "backdrop-filter 240ms ease, -webkit-backdrop-filter 240ms ease",
        }}
      />
      </div>
    </div>
  );
}
