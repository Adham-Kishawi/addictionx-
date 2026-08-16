"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/features/admin/actions";
import { ALLOWED_TRANSITIONS, statusLabel } from "@/features/admin/status";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { OrderStatus } from "@prisma/client";

export function OrderStatusSelect({
  orderId,
  status,
  dict,
}: {
  orderId: string;
  status: OrderStatus;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const nextStatuses = ALLOWED_TRANSITIONS[status];

  if (nextStatuses.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {dict.admin[statusKey(status)]}
      </span>
    );
  }

  const onChange = async (value: string) => {
    setPending(true);
    try {
      await updateOrderStatus(orderId, value);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <option value={status}>{dict.admin[statusKey(status)]}</option>
      {nextStatuses.map((s) => (
        <option key={s} value={s}>
          {statusLabel(dict.admin, s)}
        </option>
      ))}
    </select>
  );
}

function statusKey(status: OrderStatus): keyof Dictionary["admin"] {
  const map: Record<OrderStatus, keyof Dictionary["admin"]> = {
    PENDING: "statusPending",
    CONFIRMED: "statusConfirmed",
    PROCESSING: "statusProcessing",
    SHIPPED: "statusShipped",
    DELIVERED: "statusDelivered",
    CANCELLED: "statusCancelled",
    REFUNDED: "statusRefunded",
  };
  return map[status];
}
