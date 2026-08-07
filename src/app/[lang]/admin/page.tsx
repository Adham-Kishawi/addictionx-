import Link from "next/link";
import {
  Users,
  ShoppingBag,
  Package,
  Wallet,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  CONFIRMED: "bg-sky-500/10 text-sky-500",
  PROCESSING: "bg-violet-500/10 text-violet-500",
  SHIPPED: "bg-cyan-500/10 text-cyan-500",
  DELIVERED: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const [userCount, orderCount, productCount, revenue, recentOrders, lowStock] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 5 } },
        take: 8,
        orderBy: { stock: "asc" },
        include: { product: true },
      }),
    ]);

  const stats = [
    { label: dict.admin.users, value: userCount, icon: Users },
    { label: dict.admin.orders, value: orderCount, icon: ShoppingBag },
    { label: dict.admin.products, value: productCount, icon: Package },
    {
      label: dict.admin.revenue,
      value: formatPrice(revenue._sum.total ?? 0),
      icon: Wallet,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">
            {dict.admin.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.admin.welcome}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            {dict.admin.viewSite}
          </Link>
          <SignOutButton locale={locale} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">
                {stat.label}
              </p>
              <p className="truncate text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Latest orders */}
        <section className="rounded-2xl border border-border bg-card/40 p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            {dict.admin.recentOrders}
          </h2>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict.admin.noOrders}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-start text-xs text-muted-foreground">
                    <th className="pb-2 text-start font-medium">
                      {dict.admin.orderNumber}
                    </th>
                    <th className="pb-2 text-start font-medium">
                      {dict.admin.customer}
                    </th>
                    <th className="pb-2 text-start font-medium">
                      {dict.admin.total}
                    </th>
                    <th className="pb-2 text-start font-medium">
                      {dict.admin.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 font-medium" dir="ltr">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {order.user?.name ?? order.user?.email ?? "—"}
                      </td>
                      <td className="py-3 font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}
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
        </section>

        {/* Low stock */}
        <section className="rounded-2xl border border-border bg-card/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <h2 className="text-lg font-semibold">{dict.admin.lowStock}</h2>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict.admin.noStockAlerts}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {variant.product.name} · {variant.sizeMl}ml
                  </span>
                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {variant.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function statusLabel(
  adminDict: ReturnType<typeof getDictionary>["admin"],
  status: OrderStatus,
) {
  const map: Record<OrderStatus, string> = {
    PENDING: adminDict.statusPending,
    CONFIRMED: adminDict.statusConfirmed,
    PROCESSING: adminDict.statusProcessing,
    SHIPPED: adminDict.statusShipped,
    DELIVERED: adminDict.statusDelivered,
    CANCELLED: adminDict.statusCancelled,
    REFUNDED: adminDict.statusRefunded,
  };
  return map[status];
}
