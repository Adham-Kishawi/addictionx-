"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Save, Coins, Truck, Gift } from "lucide-react";
import {
  updateShippingSettings,
  type UserActionState,
} from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { Field, fieldInputClass } from "@/components/ui/field";

export function ShippingSettingsForm({
  dict,
  feeEgp,
  thresholdEgp,
  carrier,
}: {
  dict: Dictionary;
  feeEgp: number;
  thresholdEgp: number;
  carrier: string;
}) {
  const router = useRouter();
  const [fee, setFee] = useState(String(feeEgp));
  const [threshold, setThreshold] = useState(String(thresholdEgp));
  const [carrierValue, setCarrierValue] = useState(carrier);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UserActionState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("shippingFee", fee);
    fd.set("freeShippingThreshold", threshold);
    fd.set("carrier", carrierValue);
    const res = await updateShippingSettings(undefined, fd);
    setState(res);
    setPending(false);
    if (res.success) router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={dict.admin.shippingFee}
          hint={`(${dict.product.currency})`}
        >
          <div className="relative">
            <Coins className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className={cn(fieldInputClass(), "ps-9")}
              dir="ltr"
              required
            />
          </div>
        </Field>
        <Field
          label={dict.admin.freeShippingThreshold}
          hint={`(${dict.product.currency})`}
        >
          <div className="relative">
            <Gift className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className={cn(fieldInputClass(), "ps-9")}
              dir="ltr"
              required
            />
          </div>
        </Field>
        <Field label={dict.admin.defaultCarrier} className="sm:col-span-2">
          <div className="relative">
            <Truck className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={carrierValue}
              onChange={(e) => setCarrierValue(e.target.value)}
              className={cn(fieldInputClass(), "ps-9")}
              dir="ltr"
              required
            />
          </div>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {dict.admin.save}
        </button>
        {state.success && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.trackingSaved}
          </span>
        )}
        {state.error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.admin.errorGeneric}
          </span>
        )}
      </div>
    </form>
  );
}
