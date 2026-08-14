"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Save } from "lucide-react";
import { updatePaymentSettings } from "@/features/admin/zones-actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { PaymentSettings } from "@/lib/shipping";

export function PaymentSettingsForm({
  dict,
  initial,
}: {
  dict: Dictionary;
  initial: PaymentSettings;
}) {
  const router = useRouter();
  const [card, setCard] = useState(initial.cardEnabled);
  const [wallet, setWallet] = useState(initial.walletEnabled);
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
    if (wallet) fd.set("walletEnabled", "on");
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
      <Toggle label={dict.admin.enableCard} checked={card} onChange={setCard} />
      <Toggle
        label={dict.admin.enableWallet}
        checked={wallet}
        onChange={setWallet}
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary" />
        <span className="absolute start-1 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
      </span>
    </label>
  );
}
