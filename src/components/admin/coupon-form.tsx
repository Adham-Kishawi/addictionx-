"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle, Tag } from "lucide-react";
import { createCoupon, type UserActionState } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Field, fieldInputClass } from "@/components/ui/field";

export function CouponForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UserActionState>({});
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [active, setActive] = useState(true);

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
        <Field label={dict.admin.couponCode}>
          <input
            name="code"
            type="text"
            required
            maxLength={30}
            placeholder="SALE20"
            className={cn(fieldInputClass(), "uppercase")}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.couponType}>
          <select
            name="discountType"
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
            className={fieldInputClass()}
          >
            <option value="PERCENT">{dict.admin.couponTypePercent}</option>
            <option value="FIXED">{dict.admin.couponTypeFixed}</option>
          </select>
        </Field>
        <Field
          label={
            type === "PERCENT"
              ? dict.admin.couponValuePercent
              : dict.admin.couponValueFixed
          }
        >
          <input
            name="discountValue"
            type="number"
            required
            min="0"
            step="0.01"
            className={fieldInputClass()}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.couponMinOrder}>
          <input
            name="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={fieldInputClass()}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.couponMaxDiscount}>
          <input
            name="maxDiscount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={fieldInputClass()}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.couponMaxUses}>
          <input
            name="maxUses"
            type="number"
            min="0"
            defaultValue="0"
            className={fieldInputClass()}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.couponExpires} className="sm:col-span-2">
          <input
            name="expiresAt"
            type="date"
            className={fieldInputClass()}
            dir="ltr"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm sm:col-span-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Tag className="size-4" />
          </span>
          <span className="flex-1 font-medium">{dict.admin.active}</span>
          <Switch
            checked={active}
            onChange={setActive}
            name="isActive"
            label={dict.admin.active}
          />
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
