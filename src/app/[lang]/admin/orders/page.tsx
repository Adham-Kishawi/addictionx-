import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import {
  ORDER_STATUSES,
  statusLabel,
  statusStyles,
} from "@/features/admin/status";
import type { Locale } from "@/lib/i18n/dictionary";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ lang }, { status }] = await Promise.all([params, searchParams]);
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const selectedStatus = ORDER_STATUSES.includes(status as PrismaOrderStatus)
    ? (status as PrismaOrderStatus)
    : null;

  const orders = await prisma.order.findMany({
    where: selectedStatus ? { status: selectedStatus } : undefined,
    include: { user: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{dict.admin.orders}</h1>
        <Link
          href={`/${locale}/admin/orders/new`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="size-4" />
          {dict.admin.newOrder}
        </Link>
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          href={`/${locale}/admin/orders`}
          active={!selectedStatus}
          label={dict.catalog.all}
        />
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={`/${locale}/admin/orders?status=${s}`}
            active={selectedStatus === s}
            label={statusLabel(dict.admin, s)}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noOrders}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.orderNumber}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.customer}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.date}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.total}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/admin/orders/${order.id}`}
                      className="font-medium text-primary hover:underline"
                      dir="ltr"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.user?.name ?? order.user?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(order.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}
                    >
                      {statusLabel(dict.admin, order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function formatDate(date: Date, locale: Locale) {
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG");
}
