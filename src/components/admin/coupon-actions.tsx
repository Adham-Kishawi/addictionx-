"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power } from "lucide-react";
import { toggleCoupon, deleteCoupon } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function CouponActions({
  couponId,
  isActive,
  dict,
}: {
  couponId: string;
  isActive: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onToggle = async () => {
    setPending(true);
    try {
      await toggleCoupon(couponId);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(dict.admin.deleteConfirm)) return;
    setPending(true);
    try {
      await deleteCoupon(couponId);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-label={isActive ? dict.admin.deactivate : dict.admin.activate}
        title={isActive ? dict.admin.deactivate : dict.admin.activate}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        <Power className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={dict.admin.delete}
        title={dict.admin.delete}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
    </span>
  );
}
