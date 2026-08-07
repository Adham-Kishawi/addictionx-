"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";

// ============================================================
// Interactive bottle scene — sprite filmstrip drawn on <canvas>.
//
// WHY canvas instead of background-position:
//   `backgroundSize: 1000% 600%` forces the browser to rasterize the sprite
//   at screenWidth×10 by screenHeight×6 (e.g. 1920×1080 → 19200×6480 ≈ 500MB
//   per plate, ~1GB for both, desktop AND mobile pays this with no benefit).
//   Canvas decodes the sprite ONCE at its native 6400×2160 size and crops a
//   single frame per draw with manual cover-fit → not more than ~55MB decoded
//   sprite + one screen-sized canvas, regardless of viewport.
//
// Interaction is detected automatically — no hint, no nudges, no click.
// Desktop-only (lg:block); mobile keeps the alternating auto-play video
// (lg:hidden) — the canvas never exists on mobile.
// The idle bob is driven by gsap over frame numbers (single killable target).
// ============================================================

const LEFT_SRC = "/sprites/left.jpg";
const RIGHT_SRC = "/sprites/right.jpg";

const COLS = 10;
const FRAME_W = 640;
const FRAME_H = 360;
// The two source videos differ in frame count (measured with ffprobe):
// left.mp4 = 60 frames, right.mp4 = 59 frames. Clamp per side so the cursor
// never reaches the last (empty/black) cell of right.jpg's grid.
const FRAMES = { left: 60, right: 59 } as const;
const BOB_MS = 1200;
const IDLE_BOB_MS = 2200;
const MOBILE_BREAKPOINT = 1024;

type Side = "left" | "right";

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function HeroVideoScrub() {
  const reduce = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoLeftRef = useRef<HTMLVideoElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null);

  const spritesRef = useRef<{
    left?: HTMLImageElement;
    right?: HTMLImageElement;
  }>({});
  const mouseXRef = useRef(0);
  const lastMoveRef = useRef(0);
  const activeSideRef = useRef<Side>("right");
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const bobActiveRef = useRef(false);
  const bobTargetRef = useRef<{ frame: number } | null>(null);
  const startTimerRef = useRef(0);

  const [ready, setReady] = useState(false);

  // Fit the canvas backing store to its CSS box (capped DPR keeps memory sane).
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  // Draw one sprite frame scaled to cover the canvas (no distortion on 16:10 / 3:2 / 21:9).
  const drawFrame = useCallback(
    (side: Side, idx01: number) => {
      const canvas = canvasRef.current;
      const sprite = spritesRef.current[side];
      if (!canvas || !sprite) return;
      const frames = FRAMES[side];
      const idx = Math.round(clamp01(idx01) * (frames - 1));
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      sizeCanvas();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / FRAME_W, ch / FRAME_H);
      const dw = Math.round(FRAME_W * scale);
      const dh = Math.round(FRAME_H * scale);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(
        sprite,
        col * FRAME_W,
        row * FRAME_H,
        FRAME_W,
        FRAME_H,
        dx,
        dy,
        dw,
        dh,
      );
    },
    [sizeCanvas],
  );

  const cancelBob = useCallback(() => {
    bobActiveRef.current = false;
    if (bobTargetRef.current) {
      gsap.killTweensOf(bobTargetRef.current);
      bobTargetRef.current = null;
    }
  }, []);

  // ============ Auto-rotation (bob) — after idle with no click ============
  const runBob = useCallback(() => {
    if (bobActiveRef.current || !startedRef.current) return;
    bobActiveRef.current = true;

    const active = activeSideRef.current;
    const target = { frame: 0 };
    bobTargetRef.current = target;
    gsap.killTweensOf(target);
    gsap.to(target, {
      frame: FRAMES[active] - 1,
      duration: BOB_MS / 1000,
      ease: "power1.inOut",
      onUpdate: () =>
        drawFrame(active, clamp01(target.frame / (FRAMES[active] - 1))),
      onComplete: () => {
        if (!bobActiveRef.current || !bobTargetRef.current) return;
        const next = activeSideRef.current === "left" ? "right" : "left";
        activeSideRef.current = next;
        gsap.to(bobTargetRef.current, {
          frame: 0,
          duration: BOB_MS / 1000,
          ease: "power1.inOut",
          onUpdate: () =>
            drawFrame(
              next,
              clamp01(bobTargetRef.current!.frame / (FRAMES[next] - 1)),
            ),
          onComplete: () => {
            bobActiveRef.current = false;
            bobTargetRef.current = null;
          },
        });
      },
    });
  }, [drawFrame]);

  const bobLoop = useCallback(() => {
    if (reduce) return;
    return window.setInterval(() => {
      if (!startedRef.current || bobActiveRef.current) return;
      if (document.hidden || window.scrollY > window.innerHeight) return;
      if (Date.now() - lastMoveRef.current < IDLE_BOB_MS) return;
      runBob();
    }, 1000);
  }, [reduce, runBob]);

  // ============ Mobile: alternating auto-play video ============
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

  // ============ Main setup ============
  useEffect(() => {
    if (reduce) return;

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < MOBILE_BREAKPOINT;

    if (isMobile) {
      // Automatic mobile video (right/left alternating) — no sprites are ever loaded here.
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      if (!l || !r) return;
      l.style.display = "none";
      r.style.display = "block";
      const t = window.setTimeout(() => {
        void r.play().catch(() => {});
        setReady(true);
      }, 800);
      l.addEventListener("ended", playNext);
      r.addEventListener("ended", playNext);
      return () => {
        window.clearTimeout(t);
        l.removeEventListener("ended", playNext);
        r.removeEventListener("ended", playNext);
        l.pause();
        r.pause();
      };
    }

    // ---- Desktop: canvas sprite scrubbing ----
    const canvas = canvasRef.current;
    if (!canvas) return;

    activeSideRef.current = "right";
    drawFrame("right", 0);

    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      if (bobActiveRef.current) return;
      if (document.hidden) return;

      const vw = window.innerWidth;
      const x = mouseXRef.current;
      const side: Side = x < vw / 2 ? "left" : "right";
      const progress = clamp01(
        side === "right"
          ? (x - vw / 2) / (vw - vw / 2)
          : (vw / 2 - x) / (vw / 2),
      );
      activeSideRef.current = side;
      drawFrame(side, progress);
    };

    const begin = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      window.clearTimeout(startTimerRef.current);
      rafRef.current = requestAnimationFrame(frame);
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseXRef.current = e.clientX;
      lastMoveRef.current = Date.now();
      if (bobActiveRef.current) cancelBob();
      begin();
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onScroll = () => {
      const vh = window.innerHeight;
      const fadeStart = vh * 0.25;
      const fadeEnd = vh * 0.9;
      const hidden = window.scrollY >= fadeEnd;
      if (containerRef.current) {
        if (containerRef.current.style.transition) {
          containerRef.current.style.transition = "none";
        }
        const fade = clamp01(
          1 - (window.scrollY - fadeStart) / (fadeEnd - fadeStart),
        );
        containerRef.current.style.opacity = String(fade);
        containerRef.current.style.visibility = hidden ? "hidden" : "visible";
      }
      if (hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else if (rafRef.current === 0) {
        rafRef.current = requestAnimationFrame(frame);
      }
    };
    const onResize = () => {
      if (spritesRef.current.left || spritesRef.current.right) {
        sizeCanvas();
        drawFrame(activeSideRef.current, 0);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    startTimerRef.current = window.setTimeout(begin, 300);
    const idle = bobLoop();

    return () => {
      window.clearTimeout(startTimerRef.current);
      window.clearInterval(idle);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      cancelBob();
      rafRef.current = 0;
      startedRef.current = false;
      spritesRef.current = {};
    };
  }, [reduce, cancelBob, bobLoop, drawFrame, playNext, sizeCanvas]);

  // Desktop only: load the two sprites once, then reveal the scene softly.
  useEffect(() => {
    if (reduce) return;
    const imgs = { left: new Image(), right: new Image() };
    imgs.left.src = LEFT_SRC;
    imgs.right.src = RIGHT_SRC;
    Promise.all([imgs.left.decode(), imgs.right.decode()])
      .then(() => {
        spritesRef.current = imgs;
        sizeCanvas();
        drawFrame("right", 0);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [reduce, drawFrame, sizeCanvas]);

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
      {/* Desktop canvas — the single screen-sized raster (hidden on mobile) */}
      <canvas ref={canvasRef} className="hidden h-full w-full lg:block" />

      {/* Mobile videos (alternating auto-rotation) — no canvas on small screens */}
      <div className="absolute inset-0 lg:hidden">
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
