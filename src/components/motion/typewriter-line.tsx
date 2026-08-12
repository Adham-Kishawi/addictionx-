"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ============================================================
// TypewriterLine — the "menu" hero text effect: the sentence is
// typed character by character with a blinking caret, then stays.
// Skill (`ui/` snippets/text-effects.tsx, corpus #12/#21/#25):
// explicit speed + start delay; reduced motion → instant full text.
// ============================================================

function useTypewriter(text: string, speed = 42, startDelay = 500) {
  const reduce = useReducedMotion();
  // Reduced motion → the full sentence at once (no typing, no caret).
  const [out, setOut] = useState(reduce ? text : "");

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    let timer: number | undefined;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) window.clearInterval(timer);
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [text, speed, startDelay, reduce]);

  return { displayed: out, done: out.length >= text.length };
}

export function TypewriterLine({
  text,
  speed = 42,
  startDelay = 500,
  className,
}: {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}) {
  const { displayed, done } = useTypewriter(text, speed, startDelay);

  return (
    <p
      className={`max-w-xl text-base leading-relaxed text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_4px_24px_rgba(0,0,0,0.45)] sm:text-lg ${className ?? ""}`}
    >
      {displayed}
      {!done && (
        <span
          aria-hidden
          className="animate-blink ml-[2px] inline-block h-[1.1em] w-[2px] translate-y-[0.18em] bg-red-400"
        />
      )}
    </p>
  );
}
