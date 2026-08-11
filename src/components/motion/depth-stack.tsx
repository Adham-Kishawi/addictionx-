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
// DEPTH STACK — the collections as a scroll-driven deck of 3D
// cards (wave plan #3). Each card occupies its own depth slot
// (offset x, scale, rotateY, z) and rises to the front as its
// turn comes; once front, it exits right while the next rises.
// Container perspective 1200 + per-card dynamic z = real 3D
// stack without WebGL. Reduced motion → static fanned deck.
// ============================================================

export type DepthStackCard = {
  key: string;
  href: string;
  name: string;
  image?: string | null;
  art: { from: string; to: string; glow: string };
};

function StackCard({
  card,
  index,
  count,
  progress,
  reduce,
}: {
  card: DepthStackCard;
  index: number;
  count: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const frontAt = index / count;
  const handedAt = (index + 1) / count;

  const x = useTransform(
    progress,
    [0, frontAt, handedAt, 1],
    [index * 26, index * 26, 0, 34],
  );
  const scale = useTransform(
    progress,
    [0, frontAt, handedAt, 1],
    [0.86, 0.86, 1, 0.82],
  );
  const rotateY = useTransform(
    progress,
    [0, frontAt, handedAt, 1],
    [index * 9, index * 9, 0, -18],
  );
  const z = useTransform(
    progress,
    [0, frontAt + 0.001, handedAt, 1],
    [18 - index * 6, 18 - index * 6, 40, 24],
  );
  const opacity = useTransform(
    progress,
    [0, frontAt, handedAt, 1],
    [0.9, 0.9, 1, 0.3],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={
        reduce
          ? { z: 30 - index * 6, opacity: 1 - index * 0.25 }
          : { x, scale, rotateY, z, opacity, transformStyle: "preserve-3d" }
      }
    >
      <Link
        href={card.href}
        className="group relative block aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl border border-border shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] transition-colors hover:border-primary/50"
      >
        {card.image ? (
          <div className="absolute inset-0" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              draggable={false}
            />
          </div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
            style={{
              background: `radial-gradient(120% 90% at 50% 0%, ${card.art.glow}33 0%, transparent 60%), linear-gradient(160deg, ${card.art.from} 0%, ${card.art.to} 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-1 bg-gradient-to-t from-black/70 to-transparent p-6 text-center">
          <h3 className="font-display text-xl font-bold text-white">
            {card.name}
          </h3>
          <span className="flex items-center gap-1 text-sm text-white/80 transition-colors group-hover:text-primary">
            <ArrowRight className="size-4 rtl:rotate-180" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function DepthStack({ cards }: { cards: DepthStackCard[] }) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={ref} className="relative h-[260vh]">
      <div className="sticky top-24 flex h-[72vh] items-center justify-center">
        <div
          className="relative mx-auto h-[62vh] w-full max-w-3xl px-4 sm:px-6"
          style={{ perspective: 1200 }}
        >
          {cards.map((card, i) => (
            <StackCard
              key={card.key}
              card={card}
              index={i}
              count={cards.length}
              progress={scrollYProgress}
              reduce={reduce ?? false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
