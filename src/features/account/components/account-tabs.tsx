"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  MapPin,
  Heart,
  LayoutGrid,
  ChevronLeft,
  Clock,
  Settings,
  UserRound,
} from "lucide-react";
import { ProductCard } from "@/features/catalog/components/product-card";
import { AddressManager } from "@/features/account/components/address-manager";
import { ProfileSettings } from "@/features/account/components/profile-settings";
import { statusLabel, statusStyles } from "@/features/admin/status";
import { formatPrice } from "@/features/catalog/data/products";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import type { Product } from "@/features/catalog/data/products";
import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
};

export type AccountAddress = {
  id: string;
  fullName: string;
  governorate: string;
  city: string;
  district: string | null;
  street: string;
  building: string | null;
  apartment: string | null;
  landmark: string | null;
  phone: string;
  isDefault: boolean;
};

export function AccountTabs({
  locale,
  dict,
  user,
  orders,
  addresses,
  wishlist,
}: {
  locale: Locale;
  dict: Dictionary;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    memberSince: string;
  };
  orders: AccountOrder[];
  addresses: AccountAddress[];
  wishlist: Product[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const tabs: { key: TabKey; label: string; icon: typeof Package }[] = [
    { key: "overview", label: dict.account.tabOverview, icon: LayoutGrid },
    { key: "orders", label: dict.account.tabOrders, icon: Package },
    { key: "addresses", label: dict.account.tabAddresses, icon: MapPin },
    { key: "wishlist", label: dict.account.tabWishlist, icon: Heart },
    { key: "settings", label: dict.account.tabSettings, icon: Settings },
  ];

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-5">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={dict.account.profilePicture}
            className="size-20 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <UserRound className="size-9" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {dict.account.greeting}
          </p>
          <h1 className="font-display text-4xl font-bold">
            {user.name ?? user.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {dict.account.memberSince} ·{" "}
            {new Date(user.memberSince).toLocaleDateString(
              locale === "ar" ? "ar-EG" : "en-EG",
              { year: "numeric", month: "long" },
            )}
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.key === "orders" && orders.length > 0 && (
              <span className="rounded-full bg-background/20 px-1.5 text-xs">
                {orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={dict.account.tabOrders}
            value={String(orders.length)}
            icon={Package}
          />
          <StatCard
            label={dict.admin.revenue}
            value={formatPrice(totalSpent)}
            icon={Clock}
          />
          <StatCard
            label={dict.account.tabWishlist}
            value={String(wishlist.length)}
            icon={Heart}
          />
        </div>
      )}

      {tab === "orders" && (
        <OrdersList locale={locale} dict={dict} orders={orders} />
      )}

      {tab === "addresses" && (
        <AddressManager dict={dict} initial={addresses} />
      )}

      {tab === "wishlist" && (
        <div>
          {wishlist.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {dict.account.noWishlist}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {wishlist.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  wishlisted={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <ProfileSettings
          dict={dict}
          user={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="truncate text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function OrdersList({
  locale,
  dict,
  orders,
}: {
  locale: Locale;
  dict: Dictionary;
  orders: AccountOrder[];
}) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Package className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{dict.account.empty}</p>
        <Link
          href={`/${locale}/catalog`}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {dict.home.ctaButton}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/40"
        >
          <Link
            href={`/${locale}/account/orders/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}
              >
                {statusLabel(dict.admin, order.status)}
              </span>
              <span className="font-semibold" dir="ltr">
                #{order.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString(
                  locale === "ar" ? "ar-EG" : "en-EG",
                )}{" "}
                · {order.itemCount} {dict.catalog.results}
              </span>
              <span className="font-semibold text-primary">
                {formatPrice(order.total)}
              </span>
              <ChevronLeft className="size-4 text-muted-foreground rtl:rotate-180" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type TabKey = "overview" | "orders" | "addresses" | "wishlist" | "settings";
