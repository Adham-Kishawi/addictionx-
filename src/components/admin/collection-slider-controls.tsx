"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import {
  reorderCollection,
  toggleCollectionActive,
} from "@/features/admin/collections-actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Slider slide controls — reorder the home slider (up/down) and hide/show a
// collection's slide without deleting the collection itself.

export function CollectionSliderControls({
  slug,
  isActive,
  isFirst,
  isLast,
  dict,
}: {
  slug: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<{ error?: string }>) => {
    if (pending) return;
    setPending(true);
    await fn();
    setPending(false);
    router.refresh();
  };

  const btn =
    "inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending || isFirst}
        onClick={() => void run(() => reorderCollection(slug, "up"))}
        title={dict.admin.moveUp}
        aria-label={dict.admin.moveUp}
        className={btn}
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        disabled={pending || isLast}
        onClick={() => void run(() => reorderCollection(slug, "down"))}
        title={dict.admin.moveDown}
        aria-label={dict.admin.moveDown}
        className={btn}
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void run(() => toggleCollectionActive(slug))}
        title={isActive ? dict.admin.slideHidden : dict.admin.slideVisible}
        aria-label={isActive ? dict.admin.slideHidden : dict.admin.slideVisible}
        className={`inline-flex size-8 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-30 ${
          isActive
            ? "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
            : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        }`}
      >
        {isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}
