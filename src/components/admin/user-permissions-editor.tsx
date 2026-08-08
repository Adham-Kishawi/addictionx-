"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateUserPermissions } from "@/features/admin/actions";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions-core";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Role } from "@prisma/client";

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

  const labels: Record<string, string> = {
    products: dict.admin.permProducts,
    orders: dict.admin.permOrders,
    reviews: dict.admin.permReviews,
    coupons: dict.admin.permCoupons,
    collections: dict.admin.permCollections,
    users: dict.admin.permUsers,
    admins: dict.admin.permAdmins,
    newsletter: dict.admin.permNewsletter,
    settings: dict.admin.permSettings,
  };

  const toggle = (perm: string) =>
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );

  const save = async () => {
    if (pending) return;
    setPending(true);
    setDone(false);
    await updateUserPermissions(userId, selected);
    setPending(false);
    setDone(true);
    router.refresh();
    setTimeout(() => setDone(false), 2500);
  };

  const isSuper = selected.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium">
        <span
          className={`size-1.5 rounded-full ${
            isSuper ? "bg-primary" : "bg-amber-500"
          }`}
        />
        {isSuper ? dict.admin.superAdmin : dict.admin.limitedAdmin}
      </span>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {ADMIN_PERMISSIONS.map((perm) => (
          <label
            key={perm}
            className="flex cursor-pointer items-center gap-1.5 text-xs"
            title={self ? dict.admin.cannotEditSelfPermissions : undefined}
          >
            <input
              type="checkbox"
              checked={selected.includes(perm)}
              disabled={pending || self}
              onChange={() => toggle(perm)}
              className="size-3.5 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            />
            {labels[perm]}
          </label>
        ))}
      </div>
      {!self && (
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className={`inline-flex h-7 w-fit items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
            done
              ? "bg-emerald-500/10 text-emerald-500"
              : "border border-border bg-background hover:bg-muted/50"
          }`}
        >
          {done ? (
            <>
              <Check className="size-3.5" />
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
