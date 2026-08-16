"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Save, CreditCard } from "lucide-react";
import { updatePaymentSettings } from "@/features/admin/zones-actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { PaymentSettings } from "@/lib/shipping";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function PaymentSettingsForm({
  dict,
  initial,
}: {
  dict: Dictionary;
  initial: PaymentSettings;
}) {
  const router = useRouter();
  const [card, setCard] = useState(initial.cardEnabled);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setFailed(false);
    const fd = new FormData();
    if (card) fd.set("cardEnabled", "on");
    const res = await updatePaymentSettings(undefined, fd);
    setPending(false);
    if (res.success) {
      setSaved(true);
      router.refresh();
    } else {
      setFailed(true);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <ToggleRow
        icon={CreditCard}
        label={dict.admin.enableCard}
        checked={card}
        onChange={setCard}
      />

      <p className="text-xs text-muted-foreground">
        {dict.admin.paymentSettingsDesc}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {dict.admin.save}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.paymentSettingsSaved}
          </span>
        )}
        {failed && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.admin.errorGeneric}
          </span>
        )}
      </div>
    </form>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
          checked
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1 font-medium">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </label>
  );
}
