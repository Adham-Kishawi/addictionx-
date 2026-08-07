"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct, toggleProductActive } from "@/features/admin/actions";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";

export function ProductActions({
  id,
  isActive,
  locale,
  dict,
}: {
  id: string;
  isActive: boolean;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ error?: string } | void>) => {
    setPending(true);
    setError(null);
    const res = await fn();
    if (res && "error" in res) {
      setError(
        res.error === "HAS_ORDERS"
          ? dict.admin.productHasOrders
          : dict.admin.productDeleteError,
      );
    } else {
      router.refresh();
    }
    setPending(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => toggleProductActive(id))}
        aria-label={isActive ? dict.admin.deactivate : dict.admin.activate}
      >
        {isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>

      <Link
        href={`/${locale}/admin/products/${id}`}
        className="inline-flex size-7 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={dict.admin.edit}
      >
        <Pencil className="size-4" />
      </Link>

      <Button
        size="icon-sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(dict.admin.deleteConfirm)) return;
          run(() => deleteProduct(id));
        }}
        aria-label={dict.admin.delete}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>

      {error && (
        <span className="ms-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
