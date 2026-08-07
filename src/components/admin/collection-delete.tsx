"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle } from "lucide-react";
import { deleteCollection } from "@/features/admin/collections-actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// زر حذف المجموعة — لا يُحذف إلا إذا كانت فارغة من المنتجات.

export function CollectionDelete({
  slug,
  dict,
}: {
  slug: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    if (pending) return;
    if (!window.confirm(dict.admin.deleteConfirm)) return;
    setPending(true);
    setError(null);
    const res = await deleteCollection(slug);
    setPending(false);
    if (res.error === "NOT_EMPTY") {
      setError(dict.admin.collectionDeleteError);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title={dict.admin.delete}
        aria-label={dict.admin.delete}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
      {error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}
