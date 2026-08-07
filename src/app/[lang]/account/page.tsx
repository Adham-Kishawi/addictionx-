import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import {
  AccountTabs,
  type AccountOrder,
  type AccountAddress,
} from "@/features/account/components/account-tabs";
import { productFromRow } from "@/features/catalog/data/products-db";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/account`)}`,
    );
  }

  const [orders, addresses, wishlistRows, userRow] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            variants: { where: { isActive: true }, orderBy: { price: "asc" } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
  ]);

  const isAdmin = session.user.role === "ADMIN";

  const orderCards: AccountOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  }));

  const addressCards: AccountAddress[] = addresses.map((address) => ({
    id: address.id,
    fullName: address.fullName,
    governorate: address.governorate,
    city: address.city,
    district: address.district,
    street: address.street,
    building: address.building,
    apartment: address.apartment,
    landmark: address.landmark,
    phone: address.phone,
    isDefault: address.isDefault,
  }));

  const wishlist = wishlistRows
    .map((row) => productFromRow(row.product))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {dict.account.greeting}
          </p>
          <h1 className="font-display text-4xl font-bold">
            {session.user.name ?? session.user.email}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/${locale}/admin`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Shield className="size-4" />
              {dict.admin.title}
            </Link>
          )}
          <SignOutButton locale={locale} />
        </div>
      </div>

      <AccountTabs
        locale={locale}
        dict={dict}
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          memberSince:
            userRow?.createdAt.toISOString() ?? new Date().toISOString(),
        }}
        orders={orderCards}
        addresses={addressCards}
        wishlist={wishlist}
      />
    </main>
  );
}
