"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================
// SCROLL WORD REVEAL — a heading whose words "write themselves"
// as you scroll (ui skill ScrollWordReveal pattern): every word
// starts at 12% opacity with a -42° rotateX and completes at its
// own scroll point, so the title finishes word-by-word in sync
// with the page. Reduced motion → static text.
// ============================================================

function Word({
  progress,
  word,
  index,
  count,
  reduce,
}: {
  progress: MotionValue<number>;
  word: string;
  index: number;
  count: number;
  reduce: boolean;
}) {
  const start = index / count;
  // Keep the completion point inside [0, 1] — framer-motion v13 hands these
  // scroll ranges to Element.animate (ScrollTimeline) and Chrome rejects
  // offsets outside [0, 1] with a crashing TypeError.
  const end = Math.min(1, (index + 1.3) / count);
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const rotateX = useTransform(progress, [start, end], [-42, 0]);
  const y = useTransform(progress, [start, end], [18, 0]);

  return (
    <motion.span
      className="inline-block will-change-transform"
      style={
        reduce ? undefined : { opacity, rotateX, y, transformPerspective: 700 }
      }
    >
      {word}
    </motion.span>
  );
}

export function ScrollWordReveal({
  text,
  className,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start 0.92", "start 0.45"],
  });

  return (
    <Tag
      ref={ref}
      dir="auto"
      className={cn(
        "flex flex-wrap justify-center gap-x-[0.32em] gap-y-[0.18em]",
        className,
      )}
    >
      {words.map((word, i) => (
        <Word
          key={`${word}-${i}`}
          progress={scrollYProgress}
          word={word}
          index={i}
          count={words.length}
          reduce={reduce ?? false}
        />
      ))}
    </Tag>
  );
}
