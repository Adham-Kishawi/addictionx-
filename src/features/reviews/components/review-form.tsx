"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import {
  createReview,
  type ReviewActionState,
} from "@/features/reviews/actions";
import { StarInput } from "@/features/reviews/components/star-input";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function ReviewForm({
  productId,
  existing,
  dict,
}: {
  productId: string;
  existing: { title: string; content: string; rating: number } | null;
  dict: Dictionary;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ReviewActionState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("rating", String(rating));
    fd.set("title", title);
    fd.set("content", content);
    const res = await createReview(undefined, fd);
    setState(res);
    setPending(false);
  };

  const error =
    state.error === "INVALID"
      ? dict.reviews.reviewError
      : state.error === "AUTH"
        ? dict.reviews.reviewError
        : null;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-5"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {existing ? dict.reviews.editTitle : dict.reviews.writeTitle}
        </span>
        <StarInput value={rating} onChange={setRating} disabled={pending} />
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        placeholder={dict.reviews.titlePlaceholder}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        minLength={3}
        maxLength={1000}
        rows={3}
        placeholder={dict.reviews.contentPlaceholder}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending || rating < 1}
          className="rounded-full px-6"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {existing ? dict.reviews.update : dict.reviews.submit}
        </Button>
        {state.success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" />
            {dict.reviews.success}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
