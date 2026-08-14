"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Eye, EyeOff } from "lucide-react";
import { moderateReview, deleteReview, toggleReviewVisibility } from "@/features/reviews/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Admin actions on a review: approve / reject / hide/show / delete.

export function ReviewActions({
  reviewId,
  isApproved,
  isHidden,
  dict,
}: {
  reviewId: string;
  isApproved: boolean;
  isHidden: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    try {
      await fn();
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {!isApproved ? (
        <button
          onClick={() => run(() => moderateReview(reviewId, true))}
          disabled={pending}
          title={dict.admin.approve}
          aria-label={dict.admin.approve}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-emerald-500/40 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
        >
          <Check className="size-4" />
        </button>
      ) : (
        <button
          onClick={() => run(() => moderateReview(reviewId, false))}
          disabled={pending}
          title={dict.admin.reject}
          aria-label={dict.admin.reject}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-amber-500/40 text-amber-500 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      )}
      <button
        onClick={() => run(() => toggleReviewVisibility(reviewId))}
        disabled={pending}
        title={isHidden ? (dict.admin.showReview || "Show") : (dict.admin.hideReview || "Hide")}
        aria-label={isHidden ? (dict.admin.showReview || "Show") : (dict.admin.hideReview || "Hide")}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-blue-500/40 text-blue-500 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
      >
        {isHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <button
        onClick={() => {
          if (!window.confirm(dict.admin.deleteConfirm)) return;
          run(() => deleteReview(reviewId));
        }}
        disabled={pending}
        title={dict.admin.delete}
        aria-label={dict.admin.delete}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
