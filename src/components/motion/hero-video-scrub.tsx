"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";

// ============================================================
// مشهد الزجاجة التفاعلي — sprite filmstrip (لا فيديو seeking).
//
// مشكلة `video.currentTime = x` أن الـ seek غير متزامن: الباوزر يطلب
// الإطار لاحقًا فيظهر تأخير و"بطء غير طبيعي" خلف الماوس.
// الحل الاحترافي (الأكثر نعومةً في متاجر العطور العالمية): نستخرج كل
// إطارات الفيديو مرة واحدة إلى صورة شبكة (filmstrip) — هنا 60 إطارًا
// (10 أعمدة × 6 صفوف) لكل اتجاه — والحركة تصير لمجرد `background-position`
// (عرض فوري، صفر lag، صفر طلب إطارات) مع تسارع GSAP لنعومة العين.
//
// الخرائط: عرض الشاشة كله مجال دوران — يمين المنتصف يتصاعد على
// right-sprite، يسار المنتصف يتصاعد على left-sprite. **لا deadZone**
// (كان سابقًا وسط الشاشة لا يستجيب = الشعور بالبطء). العكس يعمل:
// رجوع الماوس للوسط يعيد الإطار الأول بنعومة.
//
// التفاعل يُكتشف تلقائيًا — بلا hint ولا ضغط ولا نقرة.
// الموبايل: يبقى الفيديو بالدوران التلقائي المتبادل (يمين/شمال).
// البوب التلقائي عند الخمول ما زال يعمل عبر gsap بأرقام الإطارات.
// ============================================================

const LEFT_SRC = "/sprites/left.jpg";
const RIGHT_SRC = "/sprites/right.jpg";

const COLS = 10;
const ROWS = 6;
// الفيديوان فعليًّا 59 إطارًا (0..58) — آخر خلية في الشبكة (59) فارغة.
// التقيد في clamp على FRAMES يمنع الوصول للأخيرة المفلوفة (السوداء).
const FRAMES = 59;
const BOB_MS = 1200;
const IDLE_BOB_MS = 2200;
const MOBILE_BREAKPOINT = 1024;

type Side = "left" | "right";

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

// موضع إطار (index 0..59) في شبكة 10×6 → background-position
function cssPos(idx: number): string {
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  const x = (col / (COLS - 1)) * 100;
  const y = (row / (ROWS - 1)) * 100;
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

export function HeroVideoScrub() {
  const reduce = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPlateRef = useRef<HTMLDivElement>(null);
  const rightPlateRef = useRef<HTMLDivElement>(null);
  const videoLeftRef = useRef<HTMLVideoElement>(null);
  const videoRightRef = useRef<HTMLVideoElement>(null);

  const mouseXRef = useRef(0);
  const lastMoveRef = useRef(0);
  const activeSideRef = useRef<Side>("right");
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const bobActiveRef = useRef(false);
  const startTimerRef = useRef(0);

  const [ready, setReady] = useState(false);

  const getPlates = useCallback(
    () => ({ left: leftPlateRef.current, right: rightPlateRef.current }),
    [],
  );

  const renderFrame = useCallback(
    (side: Side, idx01: number) => {
      const plates = getPlates();
      const node = side === "left" ? plates.left : plates.right;
      if (!node) return;
      node.style.backgroundPosition = cssPos(
        Math.round(clamp01(idx01) * (FRAMES - 1)),
      );
    },
    [getPlates],
  );

  const setSide = useCallback(
    (side: Side) => {
      const { left, right } = getPlates();
      if (!left || !right) return;
      left.style.display = side === "left" ? "block" : "none";
      right.style.display = side === "right" ? "block" : "none";
    },
    [getPlates],
  );

  const cancelBob = useCallback(() => {
    bobActiveRef.current = false;
    gsap.killTweensOf(mouseXRef); // أي tween gsap عام يُقتل هنا
  }, []);

  // ============ الدوران التلقائي (bob) — بعد خمول بلا أي نقرة ============
  const runBob = useCallback(() => {
    if (bobActiveRef.current || !startedRef.current) return;
    bobActiveRef.current = true;

    const active = activeSideRef.current;
    const target = { frame: 0 };
    gsap.killTweensOf(target);
    gsap.to(target, {
      frame: FRAMES - 1,
      duration: BOB_MS / 1000,
      ease: "power1.inOut",
      onUpdate: () => renderFrame(active, target.frame / (FRAMES - 1)),
      onComplete: () => {
        if (!bobActiveRef.current) return;
        activeSideRef.current = active === "left" ? "right" : "left";
        gsap.to(target, {
          frame: 0,
          duration: BOB_MS / 1000,
          ease: "power1.inOut",
          onUpdate: () =>
            renderFrame(activeSideRef.current, target.frame / (FRAMES - 1)),
          onComplete: () => {
            bobActiveRef.current = false;
          },
        });
      },
    });
  }, [renderFrame]);

  const bobLoop = useCallback(() => {
    if (reduce) return;
    return window.setInterval(() => {
      if (!startedRef.current || bobActiveRef.current) return;
      if (document.hidden || window.scrollY > window.innerHeight) return;
      if (Date.now() - lastMoveRef.current < IDLE_BOB_MS) return;
      runBob();
    }, 1000);
  }, [reduce, runBob]);

  // ============ الموبايل: تشغيل الفيديو التلقائي المتبادل ============
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

  // ============ الإعداد الرئيسي ============
  useEffect(() => {
    if (reduce) return;

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < MOBILE_BREAKPOINT;

    if (isMobile) {
      // فيديو الموبايل التلقائي (يمين/شمال بالتناوب)
      const l = videoLeftRef.current;
      const r = videoRightRef.current;
      if (!l || !r) return;
      l.style.display = "none";
      r.style.display = "block";
      const t = window.setTimeout(() => {
        void r.play().catch(() => {});
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

    // ---- الديسكتوب: sprite scrubbing ----
    const { left, right } = getPlates();
    if (!left || !right) return;

    setSide("right");
    activeSideRef.current = "right";
    renderFrame("right", 0);
    renderFrame("left", 0);

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

      if (side !== activeSideRef.current) {
        activeSideRef.current = side;
        setSide(side);
      }
      renderFrame(side, progress);
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
      begin();
      if (bobActiveRef.current) {
        cancelBob();
        setSide(activeSideRef.current);
        if (startedRef.current && rafRef.current === 0) {
          rafRef.current = requestAnimationFrame(frame);
        }
      }
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

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    startTimerRef.current = window.setTimeout(begin, 300);
    const idle = bobLoop();

    return () => {
      window.clearTimeout(startTimerRef.current);
      window.clearInterval(idle);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(rafRef.current);
      cancelBob();
      rafRef.current = 0;
      startedRef.current = false;
    };
  }, [reduce, getPlates, setSide, cancelBob, bobLoop, renderFrame, playNext]);

  // عند جاهزية الصور (بعد لود الشبكتين) نُظهر المشهد بلينّ
  useEffect(() => {
    const imgs = [LEFT_SRC, RIGHT_SRC].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
    Promise.all(
      imgs.map((img) =>
        img.decode().then(
          () => null,
          () => null,
        ),
      ),
    ).then(() => setReady(true));
  }, []);

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
      {/* لوحا الـ sprite (ديسكتوب) — فيديو سابق ليس له دلالة هنا */}
      {/* اللوح الأيمن منزاح 5px ناحية اليسار (الفيديو كامل) لضبط الفرق البسيط بين اللوحين */}
      <div
        ref={rightPlateRef}
        style={{
          position: "absolute",
          inset: 0,
          transform: "translateX(-5px)",
          backgroundImage: `url(${RIGHT_SRC})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: "0% 0%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        ref={leftPlateRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${LEFT_SRC})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: "0% 0%",
          backgroundRepeat: "no-repeat",
          display: "none",
        }}
      />

      {/* فيديوهات الموبايل (الدوران التلقائي المتناوب) */}
      <div className="absolute inset-0 lg:hidden">
        <video
          ref={videoRightRef}
          src="/right.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
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
