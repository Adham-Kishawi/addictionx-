"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Package,
  ShoppingBag,
  Star,
  TicketPercent,
  Layers,
  Users,
  Shield,
  Mail,
  Settings,
  Crown,
  Image,
  Truck,
  Flame,
  BadgeCheck,
} from "lucide-react";
import { updateUserPermissions } from "@/features/admin/actions";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions-core";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

// Checkbox grid: toggle granular permissions for another admin.
// Empty selection = nothing checked → super admin (full access).

export function UserPermissionsEditor({
  userId,
  role,
  permissions,
  self,
  dict,
}: {
  userId: string;
  role: Role;
  permissions: string[];
  self: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(permissions);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (role !== "ADMIN") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const permissionConfig: Record<
    string,
    { label: string; icon: typeof Package }
  > = {
    products: { label: dict.admin.permProducts, icon: Package },
    orders: { label: dict.admin.permOrders, icon: ShoppingBag },
    reviews: { label: dict.admin.permReviews, icon: Star },
    coupons: { label: dict.admin.permCoupons, icon: TicketPercent },
    collections: { label: dict.admin.permCollections, icon: Layers },
    users: { label: dict.admin.permUsers, icon: Users },
    admins: { label: dict.admin.permAdmins, icon: Shield },
    newsletter: { label: dict.admin.permNewsletter, icon: Mail },
    settings: { label: dict.admin.permSettings, icon: Settings },
    slider: { label: dict.admin.permSlider, icon: Image },
    shipping: { label: dict.admin.permShipping, icon: Truck },
    bestsellers: { label: dict.admin.permBestsellers, icon: Flame },
    "payment-verification": {
      label: dict.admin.permPaymentVerification,
      icon: BadgeCheck,
    },
  };

  const toggle = (perm: string) =>
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );

  const save = async () => {
    if (pending) return;
    setPending(true);
    setDone(false);
    try {
      await updateUserPermissions(userId, selected);
      router.refresh();
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setPending(false);
    }
  };

  const isSuper = selected.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Badge */}
      <div
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm",
          isSuper
            ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary ring-1 ring-primary/20"
            : "bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-500",
        )}
      >
        {isSuper ? (
          <Crown className="size-3.5" />
        ) : (
          <Shield className="size-3.5" />
        )}
        {isSuper ? dict.admin.superAdmin : dict.admin.limitedAdmin}
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ADMIN_PERMISSIONS.map((perm) => {
          const config = permissionConfig[perm];
          const Icon = config.icon;
          const isChecked = selected.includes(perm);
          const isDisabled = pending || self;

          return (
            <label
              key={perm}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-all",
                isChecked
                  ? "border-primary/40 bg-primary/5 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-card/40 text-muted-foreground hover:border-border hover:bg-card",
                isDisabled && "cursor-not-allowed opacity-50",
              )}
              title={self ? dict.admin.cannotEditSelfPermissions : undefined}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => toggle(perm)}
                className="peer sr-only"
              />
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isChecked ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="flex-1">{config.label}</span>
              {isChecked && (
                <Check className="size-3.5 shrink-0 text-primary" />
              )}
            </label>
          );
        })}
      </div>

      {/* Save Button */}
      {!self && (
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={cn(
            "inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium shadow-sm transition-all disabled:opacity-50",
            done
              ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-500"
              : "border border-border bg-background text-foreground hover:bg-muted/70",
          )}
        >
          {done ? (
            <>
              <Check className="size-4" />
              {dict.admin.permissionUpdated}
            </>
          ) : pending ? (
            dict.common.loading
          ) : (
            dict.admin.save
          )}
        </button>
      )}
    </div>
  );
}
