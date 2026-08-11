"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Moving words strip (ticker) — visual signature between sections.

export function Marquee({
  items,
  className,
  speed = 30,
  reverse = false,
}: {
  items: readonly string[];
  className?: string;
  speed?: number;
  reverse?: boolean;
}) {
  const reduce = useReducedMotion();
  // 3 consecutive copies for the seam, and moving by –33.333% wraps without a gap
  const row = [...items, ...items, ...items];

  return (
    <div
      dir="ltr"
      className={cn("group select-none overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="flex w-max items-center will-change-transform group-hover:[animation-play-state:paused]"
        style={
          reduce
            ? undefined
            : {
                animation: `marquee-x ${speed}s linear infinite${
                  reverse ? " reverse" : ""
                }`,
              }
        }
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="whitespace-nowrap px-8 font-display text-lg font-bold uppercase tracking-[0.25em] text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
              {item}
            </span>
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 text-primary/70"
              fill="currentColor"
            >
              <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
