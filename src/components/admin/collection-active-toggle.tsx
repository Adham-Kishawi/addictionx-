"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toggleCollectionActive } from "@/features/admin/collections-actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Site-wide visibility toggle — hides a collection from the whole site
// (home section, collections hub, footer) without deleting it. Distinct
// from the home-section membership managed in HomeCollectionsManager.

export function CollectionActiveToggle({
  slug,
  isActive,
  dict,
}: {
  slug: string;
  isActive: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError(null);
          void toggleCollectionActive(slug)
            .then((res) => {
              if (res?.error) setError(dict.admin.errorGeneric);
            })
            .catch((err) => {
              console.error("toggleCollectionActive failed:", err);
              setError(dict.admin.errorGeneric);
            })
            .finally(() => {
              setPending(false);
              router.refresh();
            });
        }}
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
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  );
}
