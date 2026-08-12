"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

// ============================================================
// CollectionPicker — the hero's "Select all that apply" block
// (adapted from the sketch: service pills + contingent banner).
// OUR materials: the store's REAL collections (slug + nameAr/nameEn)
// as multi-select pills; the banner joins the picked ones and a
// "Let's Go" arrow links to the catalog (one pick → its filter).
// Skill (`ui`): explicit durations + named easings, reduced motion
// renders statically, real copy only.
// ============================================================

type Collection = { slug: string; nameAr: string; nameEn: string };

export function CollectionPicker({
  locale,
  collections,
  labels,
}: {
  locale: string;
  collections: Collection[];
  labels: {
    prompt: string;
    hint: string;
    all: string;
    empty: string;
    ready: string;
    go: string;
  };
}) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string[]>([]);

  const names = useMemo(
    () =>
      collections.reduce<Record<string, string>>((acc, c) => {
        acc[c.slug] = locale === "ar" ? c.nameAr : c.nameEn;
        return acc;
      }, {}),
    [collections, locale],
  );

  const toggle = (slug: string) =>
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  const goHref =
    selected.length === 1
      ? `/${locale}/catalog?collection=${selected[0]}`
      : `/${locale}/catalog`;

  return (
    <div dir="auto" className="w-full max-w-xl text-left">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-xl font-medium tracking-tight text-white">
          {labels.prompt}
        </p>
        <span className="text-xs text-white/50">{labels.hint}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={selected.length === 0}
          onClick={() => setSelected([])}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            selected.length === 0
              ? "border-primary/60 bg-primary/25 text-red-300 shadow-[0_0_24px_-8px_theme(colors.red.600)]"
              : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          {labels.all}
        </button>

        {collections.map((c) => {
          const active = selected.includes(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(c.slug)}
              className={`relative flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active
                  ? "border-primary/60 bg-primary/25 text-red-300 shadow-[0_0_24px_-8px_theme(colors.red.600)]"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{locale === "ar" ? c.nameAr : c.nameEn}</span>
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={reduce ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <Check className="size-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait">
          {selected.length === 0 ? (
            <motion.p
              key="empty"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 0.5, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs italic text-white"
            >
              {labels.empty}
            </motion.p>
          ) : (
            <motion.div
              key="active"
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 backdrop-blur-md">
                <p className="text-sm text-white/85">
                  <span className="font-medium text-white">{labels.ready}</span>{" "}
                  {selected.map((s, i) => (
                    <span key={s}>
                      {i > 0 && <span className="text-white/50"> · </span>}
                      <span className="text-red-300">{names[s] ?? s}</span>
                    </span>
                  ))}
                </p>
                <Link
                  href={goHref}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-opacity duration-300 hover:opacity-70"
                >
                  {labels.go}
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
