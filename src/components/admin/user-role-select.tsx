"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Role } from "@prisma/client";

export function UserRoleSelect({
  userId,
  role,
  self,
  dict,
}: {
  userId: string;
  role: Role;
  self: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onChange = async (value: string) => {
    setPending(true);
    await updateUserRole(userId, value as Role);
    router.refresh();
    setPending(false);
  };

  return (
    <select
      value={role}
      disabled={pending || self}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="CUSTOMER">{dict.admin.customerRole}</option>
      <option value="ADMIN">{dict.admin.adminRole}</option>
    </select>
  );
}
