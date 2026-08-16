import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// An order is considered "stuck" when it has not moved for more than this many
// hours while still being in a live (non-terminal) stage. Tune per stage —
// new orders need the fastest response, shipping can take longer.
export const STUCK_ORDER_HOURS: Partial<Record<OrderStatus, number>> = {
  PENDING: 24,
  CONFIRMED: 48,
  PROCESSING: 72,
};

export type StuckOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  stuckHours: number;
  thresholdHours: number;
  customerName: string | null;
  phone: string | null;
};

export async function findStuckOrders(): Promise<StuckOrder[]> {
  const live = Object.keys(STUCK_ORDER_HOURS) as OrderStatus[];
  const orders = await prisma.order.findMany({
    where: { status: { in: live } },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      address: { select: { fullName: true, phone: true } },
      user: { select: { name: true, phone: true } },
    },
  });

  const now = Date.now();
  return orders
    .map((o) => {
      const thresholdHours = STUCK_ORDER_HOURS[o.status] ?? Infinity;
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        stuckHours: (now - o.updatedAt.getTime()) / 3_600_000,
        thresholdHours,
        customerName: o.user?.name ?? o.address?.fullName ?? null,
        phone: o.user?.phone ?? o.address?.phone ?? null,
      };
    })
    .filter((o) => o.stuckHours >= o.thresholdHours)
    .sort((a, b) => b.stuckHours - a.stuckHours);
}
