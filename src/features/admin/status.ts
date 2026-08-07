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

export function statusLabel(
  adminDict: Dictionary["admin"],
  status: OrderStatus,
) {
  return adminDict[statusKeyMap[status]];
}
