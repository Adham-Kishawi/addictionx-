import type { OrderStatus } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n/dictionary";

export const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  CONFIRMED: "bg-sky-500/10 text-sky-500",
  PROCESSING: "bg-violet-500/10 text-violet-500",
  SHIPPED: "bg-cyan-500/10 text-cyan-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

const statusKeyMap: Record<OrderStatus, keyof Dictionary["admin"]> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  PROCESSING: "statusProcessing",
  SHIPPED: "statusShipped",
  DELIVERED: "statusDelivered",
  CANCELLED: "statusCancelled",
  REFUNDED: "statusRefunded",
};

export const ORDER_STATUSES = Object.keys(statusKeyMap) as OrderStatus[];

// Logical status flow. An order moves forward one stage at a time and can be
// cancelled from any non-terminal live stage. CANCELLED/REFUNDED are terminal.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> =
  {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
    PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
    SHIPPED: ["DELIVERED", "CANCELLED", "REFUNDED"],
    DELIVERED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: [],
  };

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminal(status: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function statusLabel(
  adminDict: Dictionary["admin"],
  status: OrderStatus,
) {
  return adminDict[statusKeyMap[status]];
}
