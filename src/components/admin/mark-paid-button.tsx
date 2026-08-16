"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markOrderPaid } from "@/features/admin/payment-actions";
import type { Locale } from "@/lib/i18n/dictionary";

export function MarkPaidButton({
  orderId,
  locale,
  label,
  confirmLabel,
}: {
  orderId: string;
  locale: Locale;
  label: string;
  confirmLabel: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await markOrderPaid(orderId, locale);
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 px-3"
      onClick={onClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="size-3.5" />
      )}
      {confirming ? confirmLabel : label}
    </Button>
  );
}
