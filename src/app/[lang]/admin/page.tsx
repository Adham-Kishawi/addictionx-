import Link from "next/link";
import {
  Users,
  ShoppingBag,
  Package,
  Wallet,
  ExternalLink,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import { statusStyles, statusLabel } from "@/features/admin/status";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfChart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  startOfChart.setHours(0, 0, 0, 0);

  const [
    userCount,
    orderCount,
    productCount,
    revenue,
    recentOrders,
    lowStock,
    pendingCount,
    todayOrders,
    chartOrders,
    paidOrderCount,
  ] = await Promise.all([
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
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.order.findMany({
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        createdAt: { gte: startOfChart },
      },
      select: { total: true, createdAt: true },
    }),
    prisma.order.count({
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
  ]);

  const revenueTotal = revenue._sum.total ?? 0;
  const avgOrderValue =
    paidOrderCount > 0 ? Math.round(revenueTotal / paidOrderCount) : 0;

  const stats = [
    { label: dict.admin.users, value: userCount, icon: Users },
    { label: dict.admin.orders, value: orderCount, icon: ShoppingBag },
    { label: dict.admin.products, value: productCount, icon: Package },
    {
      label: dict.admin.revenue,
      value: formatPrice(revenueTotal),
      icon: Wallet,
    },
  ];

  const chart = buildChartData(
    chartOrders,
    startOfChart,
    dict.admin.ordersToday,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">
            {dict.admin.dashboard}
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

      {/* Secondary stats + revenue chart */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/40 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="size-5 text-primary" />
              {dict.admin.revenueChart}
            </h2>
            <span className="text-xs text-muted-foreground">
              {dict.admin.avgOrder}: {formatPrice(avgOrderValue)}
            </span>
          </div>

          {chart.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {dict.admin.revenueChartEmpty}
            </p>
          ) : (
            <div className="flex h-40 items-end gap-1.5">
              {chart.data.map((day, i) => {
                const isToday = i === chart.data.length - 1;
                return (
                  <div
                    key={day.label}
                    className="group flex flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${day.label}: ${formatPrice(day.value)}`}
                  >
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {formatPrice(day.value)}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isToday
                          ? "bg-primary"
                          : day.value > 0
                            ? "bg-primary/50 group-hover:bg-primary"
                            : "bg-muted"
                      }`}
                      style={{ height: `${day.height}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex gap-1.5">
            {chart.data.map((day) => (
              <span
                key={day.label}
                className="flex-1 text-center text-[9px] text-muted-foreground"
              >
                {day.short}
              </span>
            ))}
          </div>
        </section>

        {/* Pending orders */}
        <section className="flex flex-col justify-center rounded-2xl border border-border bg-card/40 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            <h2 className="text-lg font-semibold">
              {dict.admin.pendingOrders}
            </h2>
          </div>
          <p className="text-4xl font-bold">{pendingCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.admin.pendingOrdersHint} · {dict.admin.ordersToday}:{" "}
            {todayOrders}
          </p>
          <Link
            href={`/${locale}/admin/orders`}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {dict.admin.orders}
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
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

type ChartDay = {
  label: string;
  short: string;
  value: number;
  height: number;
};

function buildChartData(
  orders: { total: number; createdAt: Date }[],
  start: Date,
  todayLabel: string,
): { data: ChartDay[] } {
  const days: ChartDay[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const total = orders
      .filter(
        (o) =>
          `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}-${o.createdAt.getDate()}` ===
          dateKey,
      )
      .reduce((sum, o) => sum + o.total, 0);
    days.push({
      label: d.toLocaleDateString(),
      short:
        i === 13 ? todayLabel : `${String(d.getMonth() + 1)}/${d.getDate()}`,
      value: total,
      height: 0,
    });
  }
  const max = Math.max(...days.map((d) => d.value), 1);
  for (const day of days) {
    day.height = day.value === 0 ? 3 : Math.round((day.value / max) * 100);
  }
  return { data: days };
}
