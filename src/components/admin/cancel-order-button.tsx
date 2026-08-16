"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/features/admin/actions";

export function CancelOrderButton({
  orderId,
  label,
  confirmLabel,
}: {
  orderId: string;
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
      await updateOrderStatus(orderId, "CANCELLED");
      setConfirming(false);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="gap-1.5 px-3"
      onClick={onClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <XCircle className="size-3.5" />
      )}
      {confirming ? confirmLabel : label}
    </Button>
  );
}
