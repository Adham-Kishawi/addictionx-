"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, ArrowRight, Ban } from "lucide-react";
import { deleteCollection } from "@/features/admin/collections-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Collection delete — FREE: when the collection has products the admin chooses
// to move them to another collection OR delete them with the collection.

export function CollectionDelete({
  slug,
  productCount,
  collections,
  dict,
}: {
  slug: string;
  productCount: number;
  collections: { slug: string; nameAr: string; nameEn: string }[];
  dict: Dictionary;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"move" | "delete" | null>(null);
  const [target, setTarget] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const others = collections.filter((c) => c.slug !== slug);

  const run = async (opts: { moveTo?: string; deleteProducts?: boolean }) => {
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await deleteCollection(slug, opts);
    setPending(false);
    if (res.error) {
      setError(dict.admin.collectionDeleteError);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  const onDelete = () => {
    if (!window.confirm(dict.admin.deleteConfirm)) return;
    if (productCount === 0) {
      void run({});
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        title={dict.admin.delete}
        aria-label={dict.admin.delete}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <h3 className="mb-1 font-display text-lg font-bold">
              {dict.admin.collections}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {dict.admin.deleteCollectionChoice} ({productCount}{" "}
              {dict.admin.collectionProducts})
            </p>

            <div className="flex flex-col gap-2">
              {others.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode(mode === "move" ? null : "move")}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-start text-sm transition-colors hover:border-primary/40"
                >
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                  <span className="flex-1">
                    {dict.admin.deleteMoveProducts}
                  </span>
                </button>
              )}

              {mode === "move" && others.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-3">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                    {dict.admin.deleteMoveTo}
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">—</option>
                      {others.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.nameAr} / {c.nameEn}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!target || pending}
                    onClick={() => void run({ moveTo: target })}
                    className="rounded-full"
                  >
                    {pending ? "..." : dict.admin.save}
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode(mode === "delete" ? null : "delete")}
                className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-background px-4 py-3 text-start text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Ban className="size-4 shrink-0" />
                <span className="flex-1">{dict.admin.deleteWithProducts}</span>
              </button>
              {mode === "delete" && (
                <p className="rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
                  {dict.admin.deleteProductsNote}
                </p>
              )}
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setMode(null);
                }}
              >
                {dict.admin.cancel}
              </Button>
              {mode === "delete" && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => void run({ deleteProducts: true })}
                >
                  {dict.admin.delete}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
