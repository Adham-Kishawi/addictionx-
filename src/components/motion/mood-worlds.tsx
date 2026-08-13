"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ============================================================
// MooD WORLDS — wave 34f: «Three moods, entire worlds».
// Replaces the DepthStack deck with a scroll-driven WORLD RIDE:
// a 300vh stage pinned full-screen; each collection is its own
// world with its OWN atmosphere — the ambient backdrop + glow
// tint + ghost word + tagline. As you scroll, worlds dissolve
// into each other (crossfade + scale settle + parallax drift +
// text reveal) — moving between worlds, not scrolling cards.
//
// Techniques chosen (brief: don't use them all — these carry
// the story): crossfade · scale (settle-in, push-out) · layered
// parallax drift · text reveal · ghost watermark. Overlap 8%
// so transitions feel continuous, never sudden.
// Reduced motion → a simple vertical stack of tasteful cards.
// ============================================================

export type MoodWorld = {
  key: string;
  name: string;
  ghost: string;
  tagline: string;
  href: string;
  image?: string | null;
  glow: string;
  indexLabel: string;
  hrefLabel: string;
};

const OVERLAP = 0.08;

function WorldScene({
  world,
  index,
  count,
  progress,
}: {
  world: MoodWorld;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  const start = index / count;
  const end = (index + 1) / count;

  // Dissolve: fade in slightly early, hold, fade out slightly late
  const opacity = useTransform(
    progress,
    [start - OVERLAP, start, end, end + OVERLAP],
    [0, 1, 1, 0],
    { clamp: true },
  );
  // Settle: world arrives zoomed, settles to rest, pushes away on exit
  const scale = useTransform(
    progress,
    [start - OVERLAP, start, end, end + OVERLAP],
    [1.08, 1, 1, 1.06],
    { clamp: true },
  );
  // Text: reveals after the world lands, exits before it leaves
  const textOpacity = useTransform(
    progress,
    [start, start + 0.12, end - 0.12, end],
    [0, 1, 1, 0],
    { clamp: true },
  );
  const textY = useTransform(progress, [start, start + 0.12], [28, 0], {
    clamp: true,
  });
  // Backdrop drift: the SAME slow sweep for every world — the camera
  // glides laterally the whole ride, worlds passing beneath it
  const drift = useTransform(progress, [0, 1], ["-4%", "4%"]);

  const interactive = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity,
        scale,
        pointerEvents: interactive,
        willChange: "opacity, transform",
      }}
    >
      {/* L0 — ambient world backdrop with a slow lateral drift */}
      <motion.div
        aria-hidden
        className="absolute -inset-[8%]"
        style={{ y: drift }}
      >
        {world.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={world.image}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : null}
      </motion.div>

      {/* L1 — theme veil + collection glow tint */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, var(--mood-veil-1), var(--mood-veil-2) 55%, var(--mood-veil-3))`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at 50% 50%, ${world.glow}30, transparent 70%)`,
        }}
      />

      {/* L2 — ghost word of the world behind the text */}
      <motion.span
        aria-hidden
        dir="ltr"
        className="text-metallic-shine pointer-events-none absolute inset-x-0 top-[14%] flex select-none justify-center overflow-hidden whitespace-nowrap font-display text-[22vw] font-bold leading-none lg:text-[15vw]"
        style={{ opacity: textOpacity, y: textY }}
      >
        {world.ghost}
      </motion.span>

      {/* L3 — the world's text: index, name, one line, the door */}
      <motion.div
        className="absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-4 px-6 text-center"
        style={{ opacity: textOpacity, y: textY }}
      >
        <span className="inline-flex items-center gap-3 text-xs tracking-[0.4em] text-white/70">
          <span className="h-px w-8 bg-white/40" />
          {world.indexLabel} · {index + 1} / {count}
          <span className="h-px w-8 bg-white/40" />
        </span>
        <h3 className="font-display text-4xl font-bold text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.8)] sm:text-5xl lg:text-6xl">
          {world.name}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-white/80 drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)] sm:text-base">
          {world.tagline}
        </p>
        <Link
          href={world.href}
          className="group mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {world.hrefLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function MoodWorlds({
  worlds,
  hrefLabel,
}: {
  worlds: MoodWorld[];
  hrefLabel: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // The ride hint fades in the first moments of the ride
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  // Reduced motion: a plain stacked card world — all content reachable
  if (reduce) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6">
        {worlds.map((world) => (
          <Link
            key={world.key}
            href={world.href}
            className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border sm:aspect-[16/10]"
          >
            {world.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={world.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `radial-gradient(120% 90% at 50% 0%, ${world.glow}33 0%, transparent 60%), var(--mood-veil-1)`,
                }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 bg-gradient-to-t from-black/75 to-transparent p-6 text-center">
              <span className="text-xs tracking-[0.35em] text-white/70">
                {world.indexLabel}
              </span>
              <h3 className="font-display text-2xl font-bold text-white">
                {world.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {worlds.map((world, i) => (
          <WorldScene
            key={world.key}
            world={world}
            index={i}
            count={worlds.length}
            progress={scrollYProgress}
          />
        ))}

        {/* L10 — the ride hint */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[6%] flex justify-center"
          style={{ opacity: hintOpacity }}
        >
          <span className="animate-pulse rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-[10px] tracking-[0.35em] text-white/70 backdrop-blur-sm">
            {hrefLabel.toUpperCase()}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
