"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power } from "lucide-react";
import {
  toggleNewsletterEntry,
  deleteNewsletterEntry,
} from "@/features/newsletter/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// أزرار إدارة المشترك (تفعيل/إيقاف + حذف).

export function NewsletterActions({
  email,
  isActive,
  dict,
}: {
  email: string;
  isActive: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    if (pending) return;
    setPending(true);
    await fn();
    router.refresh();
    setPending(false);
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => run(() => toggleNewsletterEntry(email))}
        disabled={pending}
        title={
          isActive ? dict.admin.newsletterInactive : dict.admin.newsletterActive
        }
        aria-label={
          isActive ? dict.admin.newsletterInactive : dict.admin.newsletterActive
        }
        className={`inline-flex size-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
          isActive
            ? "border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
            : "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
        }`}
      >
        <Power className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (!window.confirm(dict.admin.deleteConfirm)) return;
          run(() => deleteNewsletterEntry(email));
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
