import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultLocale, isLocale } from "@/lib/i18n/dictionary";
import {
  ADMIN_PERMISSIONS,
  hasPermission,
  isPermission,
  isSuperAdmin,
  type AdminPermission,
} from "@/lib/admin-permissions-core";

export {
  ADMIN_PERMISSIONS,
  hasPermission,
  isPermission,
  isSuperAdmin,
  type AdminPermission,
};

// ============================================================
// Admin permissions
// - ADMIN users carry a `permissions` array. An EMPTY array = super
//   admin (full access). A non-empty array limits them to those scopes.
// ============================================================

type GuardUser = {
  role: "ADMIN" | "CUSTOMER";
  permissions: string[];
};

// Reads BOTH role and permissions from the DB on every call, so role changes
// (ADMIN<->CUSTOMER) and permission edits apply immediately instead of
// waiting for the JWT to refresh or expire.
// Redirects keep the current locale when one is available (pages pass it).
async function getGuardUser(locale?: string): Promise<GuardUser> {
  const session = await auth();
  const loc = locale && isLocale(locale) ? locale : defaultLocale;
  if (!session?.user) {
    redirect(`/${loc}/login`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${loc}/account`);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true },
  });
  if (!user) {
    redirect(`/${loc}/account`);
  }
  return user;
}

// Server-side guard: redirects when the caller does not hold `permission`.
export async function requirePermission(
  permission: AdminPermission,
  locale?: string,
) {
  const user = await getGuardUser(locale);
  const loc = locale && isLocale(locale) ? locale : defaultLocale;
  if (user.role !== "ADMIN" || !hasPermission(user.permissions, permission)) {
    redirect(`/${loc}/admin`);
  }
}

// Guard allowing access when ANY of the given permissions is held.
export async function requireAnyPermission(
  permissions: AdminPermission[],
  locale?: string,
) {
  const user = await getGuardUser(locale);
  const loc = locale && isLocale(locale) ? locale : defaultLocale;
  if (
    user.role !== "ADMIN" ||
    !permissions.some((p) => hasPermission(user.permissions, p))
  ) {
    redirect(`/${loc}/admin`);
  }
}

// Super admin = ADMIN with an empty permissions array (full control).
// Only super admins may create/delete/demote other admins.
export async function requireSuperAdmin(locale?: string) {
  const user = await getGuardUser(locale);
  const loc = locale && isLocale(locale) ? locale : defaultLocale;
  if (user.role !== "ADMIN" || !isSuperAdmin(user.permissions)) {
    redirect(`/${loc}/admin`);
  }
}
