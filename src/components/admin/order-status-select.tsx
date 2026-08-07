"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/features/admin/actions";
import { ORDER_STATUSES } from "@/features/admin/status";
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

  const onChange = async (value: string) => {
    setPending(true);
    await updateOrderStatus(orderId, value);
    router.refresh();
    setPending(false);
  };

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {dict.admin[statusKey(s)]}
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
