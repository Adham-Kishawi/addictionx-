"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { imageAdjustStyle, type ImageAdjust } from "@/lib/image-adjust";

// ============================================================
// THE SHELF — wave 41: «three bottles on a dark glass shelf».
// Replaces the MoodWorlds 300vh scroll ride with an interactive
// display case: each collection is a floating bottle inside a
// glass card, standing on a lit shelf. The active card holds a
// mouse tilt (yaw/pitch springs), every card drops a floor
// reflection, a spotlight cone falls from above and the ghost
// word of the active world breathes behind the deck.
//
// Interaction budget (per the project's "don't use them all"
// rule): mouse tilt (active card) · drag-nudge + arrows + tabs
// to switch · crossfade + settle on switch. No parallax chase,
// no scroll pinning.
// Reduced motion → tilt + drag off; arrows/tabs still work.
// ============================================================

export type ShelfCard = {
  key: string;
  name: string;
  nameEn: string;
  nameAr: string;
  tagline: string;
  href: string;
  bottle: string | null;
  image: string | null;
  imageAdjust?: ImageAdjust | null;
  tint: string;
  hrefLabel: string;
};

const STAGE = "relative mx-auto h-[560px] max-w-5xl sm:h-[640px] lg:h-[680px]";

function GlassCard({
  card,
  active,
  index,
}: {
  card: ShelfCard;
  active: boolean;
  index: number;
}) {
  return (
    <div className="relative aspect-[3/4] w-[62vw] max-w-[280px]">
      {/* Card body — pure black so the bottle render's own black background
          blends in seamlessly (the bottles keep their original studio shots,
          no keying). The colored ring + glow orb + shadow are the halo. */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[1.5rem] border bg-[#000000]"
        style={{
          borderColor: `${card.tint}4D`,
          boxShadow: `0 24px 80px -24px ${card.tint}66`,
        }}
      >
        {/* Mood backdrop fallback (until the generated bottles land) */}
        {!card.bottle && card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt=""
            className="h-full w-full object-cover opacity-45"
            style={
              card.imageAdjust ? imageAdjustStyle(card.imageAdjust) : undefined
            }
          />
        ) : null}
        {/* Diagonal sheen across the pane */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
        />
        {/* Collection glow trapped inside the glass (the halo) */}
        <div
          aria-hidden
          className="absolute inset-x-6 top-8 h-1/2 rounded-full blur-[70px]"
          style={{ background: `${card.tint}59` }}
        />
      </div>

      {/* The bottle */}
      {card.bottle ? (
        <div className="absolute inset-x-0 top-6 h-[58%]">
          <Image
            src={card.bottle}
            alt={card.name}
            fill
            priority={active}
            sizes="(min-width:640px) 280px, 62vw"
            className="object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)]"
          />
        </div>
      ) : null}

      {/* Foot: numeral + tagline + the door (the name lives BEHIND the
          bottles — clean fronts) */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-left">
        <span className="font-display text-base text-white/40">
          0{index + 1}
        </span>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/70">
          {card.tagline}
        </p>
        {active && (
          <Link
            href={card.href}
            className="group mt-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:border-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {card.hrefLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function CollectionShelf({
  cards,
  rtl = false,
}: {
  cards: ShelfCard[];
  rtl?: boolean;
}) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const count = cards.length;

  const go = (dir: number) => setActive((a) => (a + dir + count) % count);

  // Mouse tilt — pointer position across the stage drives yaw/pitch
  // springs; only the active card receives them.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 180,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), {
    stiffness: 180,
    damping: 22,
  });

  function onMouseMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  const activeCard = cards[active];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={STAGE}
      ref={stageRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* L0 — bottle-tinted glow drifting behind the deck */}
      <motion.div
        key={activeCard.key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        aria-hidden
        className="absolute left-1/2 top-[42%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{ background: activeCard.tint + "38" }}
      />

      {/* L1 — spotlight cone falling from above the shelf */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[75%] w-[54%] -translate-x-1/2 blur-md [clip-path:polygon(46%_0,54%_0,100%_100%,0_100%)] bg-gradient-to-b from-white/[0.1] via-white/[0.035] to-transparent"
      />

      {/* L2 — bilingual name BEHIND the three bottles (poster watermark):
          English in Playfair + Arabic in Alexandria, both tinted by the
          bottle's color, hidden behind the deck and peeking around it */}
      <motion.div
        key={activeCard.key}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[20%] z-[3] flex select-none flex-col items-center justify-center gap-2 whitespace-nowrap"
      >
        <span
          dir="ltr"
          className="font-display text-[11vw] font-bold leading-none lg:text-8xl"
          style={{
            color: activeCard.tint,
            opacity: 0.16,
            textShadow: `0 0 60px ${activeCard.tint}66`,
          }}
        >
          {activeCard.nameEn}
        </span>
        <span
          dir="rtl"
          className="text-[9vw] font-bold leading-none lg:text-7xl"
          style={{
            color: activeCard.tint,
            opacity: 0.13,
            textShadow: `0 0 50px ${activeCard.tint}55`,
          }}
        >
          {activeCard.nameAr}
        </span>
      </motion.div>

      {/* L3 — the deck: cards + reflections + plank, drag-nudge physics */}
      <motion.div
        drag={reduce ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          const dir = rtl ? -1 : 1;
          if (info.offset.x < -50 * dir) go(1);
          else if (info.offset.x > 50 * dir) go(-1);
        }}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      >
        {cards.map((card, i) => {
          const isActive = i === active;
          const delta = i - active;
          return (
            <motion.div
              key={card.key}
              className="absolute bottom-28 left-1/2 w-[62vw] max-w-[280px]"
              initial={false}
              animate={{
                x: `${delta * 112 - 50}%`,
                scale: isActive ? 1 : 0.9,
                opacity: isActive ? 1 : 0.5,
                rotateY: delta * -16,
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 24,
                mass: 0.9,
              }}
              style={{ zIndex: 30 - Math.abs(delta) }}
            >
              {isActive && !reduce ? (
                <motion.div
                  style={{
                    rotateX,
                    rotateY,
                    transformPerspective: 1100,
                  }}
                >
                  <GlassCard card={card} active index={i} />
                </motion.div>
              ) : (
                <GlassCard card={card} active={isActive} index={i} />
              )}

              {/* Floor reflection — the bottle's ghost on the shelf. Screen
                  blend drops the render's black background so only the lit
                  glass/glow mirrors onto the plank. */}
              {card.bottle ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 top-full h-32 opacity-40 mix-blend-screen [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,transparent_85%)]"
                >
                  <Image
                    src={card.bottle}
                    alt=""
                    fill
                    sizes="280px"
                    className="-scale-y-100 object-contain object-top"
                  />
                </div>
              ) : null}
            </motion.div>
          );
        })}

        {/* The shelf plank — inside the deck so reflections can sit on it */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-white/[0.05] to-transparent"
          style={{ zIndex: 1 }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      </motion.div>

      {/* L5 — arrows */}
      <button
        type="button"
        aria-label={rtl ? "Next" : "Previous"}
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-white/[0.06] p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-4"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </button>
      <button
        type="button"
        aria-label={rtl ? "Previous" : "Next"}
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 z-40 -translate-y-1/2 rounded-full border border-white/15 bg-white/[0.06] p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4"
      >
        <ArrowRight className="size-4 rtl:rotate-180" />
      </button>

      {/* L6 — index tabs */}
      <div className="absolute inset-x-0 bottom-3 z-40 flex justify-center gap-3">
        {cards.map((card, i) => (
          <button
            key={card.key}
            type="button"
            aria-label={card.name}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`font-display text-sm tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              i === active
                ? "text-primary"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            0{i + 1}
          </button>
        ))}
      </div>
    </motion.section>
  );
}
