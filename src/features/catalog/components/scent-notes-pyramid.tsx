"use client";

import { Sparkles, Heart, Layers, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScentNotesPyramidProps {
  notes?: {
    top?: string[];
    heart?: string[];
    base?: string[];
  } | null;
  locale: string;
  className?: string;
}

export function ScentNotesPyramid({
  notes,
  locale,
  className,
}: ScentNotesPyramidProps) {
  const topNotes = notes?.top || [];
  const heartNotes = notes?.heart || [];
  const baseNotes = notes?.base || [];

  const isAr = locale === "ar";

  if (topNotes.length === 0 && heartNotes.length === 0 && baseNotes.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/40 p-5 sm:p-6 backdrop-blur-xl shadow-lg relative overflow-hidden", className)}>
      {/* Background ambient luxury glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Flame className="size-4" />
          </span>
          <h3 className="font-display text-base font-bold text-foreground">
            {isAr ? "الهرم العطري والتركيبة" : "Olfactory Fragrance Pyramid"}
          </h3>
        </div>
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {isAr ? "نوتات النقاء والجاذبية" : "Artisan Notes"}
        </span>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        {/* 1. TOP NOTES (Peak / Opening) */}
        {topNotes.length > 0 && (
          <div className="group flex flex-col gap-1.5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 transition-all duration-300 hover:border-primary/40 hover:bg-primary/15">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 animate-pulse" />
                {isAr ? "قمة العطر (الافتتاحية)" : "Top Notes (Opening)"}
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {isAr ? "أول 15 - 30 دقيقة" : "First 15–30 mins"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {topNotes.map((note, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-lg bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition-transform duration-200 group-hover:scale-[1.02]"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 2. HEART NOTES (Heart / Middle) */}
        {heartNotes.length > 0 && (
          <div className="group flex flex-col gap-1.5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-3.5 transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/15">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-500 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <Heart className="size-3.5" />
                {isAr ? "قلب العطر (الطابع المركزي)" : "Heart Notes (Core Character)"}
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {isAr ? "يستمر 2 - 4 ساعات" : "Lasts 2–4 hours"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {heartNotes.map((note, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-lg bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition-transform duration-200 group-hover:scale-[1.02]"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. BASE NOTES (Foundation / Trail) */}
        {baseNotes.length > 0 && (
          <div className="group flex flex-col gap-1.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3.5 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/15">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-500 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5" />
                {isAr ? "قاعدة العطر (الثبات والفوحان)" : "Base Notes (Deep Sillage)"}
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {isAr ? "ثبات مستمر 8 - 12+ ساعة" : "Lingers 8–12+ hours"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {baseNotes.map((note, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-lg bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition-transform duration-200 group-hover:scale-[1.02]"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
