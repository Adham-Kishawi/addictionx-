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
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import { statusStyles, statusLabel } from "@/features/admin/status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tone = {
  blue: {
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    glow: "from-sky-500/10",
    bar: "bg-sky-500",
  },
  violet: {
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    glow: "from-violet-500/10",
    bar: "bg-violet-500",
  },
  emerald: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/10",
    bar: "bg-emerald-500",
  },
  amber: {
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    glow: "from-amber-500/10",
    bar: "bg-amber-500",
  },
} as const;

type Tone = keyof typeof tone;

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
  });

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
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true, address: true },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      take: 6,
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
    {
      label: dict.admin.users,
      value: userCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      icon: Users,
      tone: tone.blue as (typeof tone)[Tone],
    },
    {
      label: dict.admin.orders,
      value: orderCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      icon: ShoppingBag,
      tone: tone.violet as (typeof tone)[Tone],
    },
    {
      label: dict.admin.products,
      value: productCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
      icon: Package,
      tone: tone.emerald as (typeof tone)[Tone],
    },
    {
      label: dict.admin.revenue,
      value: formatPrice(revenueTotal),
      icon: Wallet,
      tone: tone.amber as (typeof tone)[Tone],
    },
  ];

  const chart = buildChartData(
    chartOrders,
    startOfChart,
    dict.admin.ordersToday,
  );
  const pendingRatio = paidOrderCount > 0 ? pendingCount / paidOrderCount : 0;

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
            className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-60",
                stat.tone.glow,
              )}
            />
            <div className="relative flex items-center gap-4">
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-110",
                  stat.tone.chip,
                )}
              >
                <stat.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">
                  {stat.label}
                </p>
                <p className="truncate text-2xl font-bold tabular-nums">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats + revenue chart */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card/40 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-4" />
              </span>
              {dict.admin.revenueChart}
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {dict.admin.avgOrder}:{" "}
              <span className="font-semibold text-foreground">
                {formatPrice(avgOrderValue)}
              </span>
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
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        isToday
                          ? "bg-primary"
                          : day.value > 0
                            ? "bg-primary/40 group-hover:bg-primary/70"
                            : "bg-muted",
                      )}
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
        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent" />
          <div className="relative flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </span>
            <h2 className="text-lg font-semibold">
              {dict.admin.pendingOrders}
            </h2>
          </div>
          <p className="relative mt-5 text-5xl font-bold tabular-nums">
            {pendingCount}
          </p>
          <p className="relative mt-1 text-sm text-muted-foreground">
            {dict.admin.pendingOrdersHint} · {dict.admin.ordersToday}:{" "}
            <span className="font-semibold text-foreground">{todayOrders}</span>
          </p>
          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(pendingRatio * 100, 100)}%` }}
            />
          </div>
          <Link
            href={`/${locale}/admin/orders`}
            className="group mt-6 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {dict.admin.orders}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Latest orders */}
        <section className="rounded-2xl border border-border bg-card/40 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{dict.admin.recentOrders}</h2>
            <Link
              href={`/${locale}/admin/orders`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/70"
            >
              {dict.home.viewAll}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

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
                      {dict.admin.date}
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
                      className="group border-b border-border/60 transition-colors hover:bg-muted/40 last:border-0"
                    >
                      <td className="py-3 font-medium" dir="ltr">
                        <Link
                          href={`/${locale}/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 text-primary transition-colors hover:text-primary/70"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {order.user?.name ??
                          order.user?.email ??
                          order.address?.fullName ??
                          "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {dateFmt.format(order.createdAt)}
                      </td>
                      <td className="py-3 font-medium tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            statusStyles[order.status],
                          )}
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="size-4" />
              </span>
              {dict.admin.lowStock}
            </h2>
            <Link
              href={`/${locale}/admin/products`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/70"
            >
              {dict.home.viewAll}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict.admin.noStockAlerts}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {variant.product.name} · {variant.sizeMl}ml
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                      variant.stock === 0
                        ? "bg-destructive/10 text-destructive"
                        : variant.stock <= 3
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
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
