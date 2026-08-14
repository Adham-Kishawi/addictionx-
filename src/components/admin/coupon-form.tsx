"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle } from "lucide-react";
import { createCoupon, type UserActionState } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

export function CouponForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UserActionState>({});
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    try {
      const fd = new FormData(e.currentTarget);
      const res = await createCoupon(undefined, fd);
      setState(res);
      if (res.success) {
        e.currentTarget.reset();
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  const error =
    state.error === "DUPLICATE"
      ? dict.admin.couponCreateError
      : state.error
        ? dict.admin.errorGeneric
        : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponCode}
          </span>
          <input
            name="code"
            type="text"
            required
            maxLength={30}
            placeholder="SALE20"
            className={cn(inputClass, "uppercase")}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponType}
          </span>
          <select
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
            className={inputClass}
          >
            <option value="PERCENT">{dict.admin.couponTypePercent}</option>
            <option value="FIXED">{dict.admin.couponTypeFixed}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {type === "PERCENT"
              ? dict.admin.couponValuePercent
              : dict.admin.couponValueFixed}
          </span>
          <input
            name="discountValue"
            type="number"
            required
            min="0"
            step="0.01"
            className={inputClass}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponMinOrder}
          </span>
          <input
            name="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={inputClass}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponMaxDiscount}
          </span>
          <input
            name="maxDiscount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={inputClass}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponMaxUses}
          </span>
          <input
            name="maxUses"
            type="number"
            min="0"
            defaultValue="0"
            className={inputClass}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-muted-foreground">
            {dict.admin.couponExpires}
          </span>
          <input
            name="expiresAt"
            type="date"
            className={inputClass}
            dir="ltr"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked
            className="size-4 accent-primary"
          />
          <span>{dict.admin.active}</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" />
          {dict.admin.create}
        </button>
        {state.success && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.couponCreated}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
