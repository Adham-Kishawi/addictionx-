"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  TicketPercent,
  Truck,
  Star,
  Layers,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav({
  basePath,
  labels,
  visible,
}: {
  basePath: string;
  labels: {
    dashboard: string;
    products: string;
    orders: string;
    users: string;
    coupons: string;
    settings: string;
    reviews: string;
    collections: string;
    newsletter: string;
  };
  visible: string[];
}) {
  const pathname = usePathname();

  const allItems = [
    {
      href: basePath,
      label: labels.dashboard,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `${basePath}/products`,
      label: labels.products,
      icon: Package,
      key: "products",
    },
    {
      href: `${basePath}/orders`,
      label: labels.orders,
      icon: ShoppingBag,
      key: "orders",
    },
    {
      href: `${basePath}/collections`,
      label: labels.collections,
      icon: Layers,
      key: "collections",
    },
    {
      href: `${basePath}/reviews`,
      label: labels.reviews,
      icon: Star,
      key: "reviews",
    },
    {
      href: `${basePath}/coupons`,
      label: labels.coupons,
      icon: TicketPercent,
      key: "coupons",
    },
    {
      href: `${basePath}/users`,
      label: labels.users,
      icon: Users,
      key: "users",
    },
    {
      href: `${basePath}/newsletter`,
      label: labels.newsletter,
      icon: Mail,
      key: "newsletter",
    },
    {
      href: `${basePath}/settings`,
      label: labels.settings,
      icon: Truck,
      key: "settings",
    },
  ];

  const items = allItems.filter(
    (item) => item.exact || visible.includes(item.key!),
  );

  return (
    <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card/40 p-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
