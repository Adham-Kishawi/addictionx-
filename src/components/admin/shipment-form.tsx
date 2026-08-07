"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Save } from "lucide-react";
import { updateShipment } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function ShipmentForm({
  orderId,
  initialCarrier,
  initialTracking,
  dict,
}: {
  orderId: string;
  initialCarrier: string;
  initialTracking: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState(initialCarrier);
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setError(false);
    try {
      await updateShipment(orderId, { carrier, trackingNumber });
      setSaved(true);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {dict.account.carrier}
          </label>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Bosta"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {dict.account.trackingNumber}
          </label>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            dir="ltr"
            placeholder="BOS-123456"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {dict.admin.saveTracking}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.trackingSaved}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.admin.errorGeneric}
          </span>
        )}
      </div>
    </form>
  );
}
