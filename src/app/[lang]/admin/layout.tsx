import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/admin-permissions";
import type { AdminPermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/admin`)}`,
    );
  }
  // Role + permissions read fresh from the DB — the JWT only carries a
  // snapshot that goes stale after an admin is demoted in the dashboard.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true },
  });
  if (dbUser?.role !== "ADMIN") {
    redirect(`/${locale}/account`);
  }
  const permissions = dbUser?.permissions ?? [];

  const basePath = `/${locale}/admin`;
  // Which sections this admin may access — dashboard is always visible.
  const visible = [
    "products",
    "slider",
    "orders",
    "payment-verification",
    "collections",
    "bestsellers",
    "reviews",
    "coupons",
    "users",
    "newsletter",
    "shipping",
    "settings",
  ].filter((key) =>
    key === "users"
      ? hasPermission(permissions, "users") ||
        hasPermission(permissions, "admins")
      : key === "bestsellers" || key === "shipping" || key === "slider"
        ? hasPermission(permissions, "products")
        : key === "payment-verification"
          ? hasPermission(permissions, "orders")
          : hasPermission(permissions, key as AdminPermission),
  );

  const navLabels = {
    dashboard: dict.admin.dashboard,
    products: dict.admin.products,
    slider: dict.admin.slider,
    orders: dict.admin.orders,
    "payment-verification": dict.admin.paymentVerification,
    users: dict.admin.users,
    coupons: dict.admin.coupons,
    settings: dict.admin.settings,
    reviews: dict.admin.reviews,
    collections: dict.admin.collections,
    newsletter: dict.admin.newsletter,
    bestsellers: dict.admin.bestsellers,
    shipping: dict.admin.shipping || "Shipping",
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6 lg:flex-row lg:px-8">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-4 px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {dict.admin.title}
          </p>
        </div>
        <AdminNav basePath={basePath} labels={navLabels} visible={visible} />
        <div className="mt-3 flex flex-col gap-2 px-1">
          <Link
            href={`/${locale}`}
            className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dict.admin.viewSite}
          </Link>
          <SignOutButton locale={locale} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
