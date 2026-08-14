import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultLocale } from "@/lib/i18n/dictionary";
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

// Server-side guard: reads permissions from the DB (fresh every call so
// permission changes apply immediately, unlike the JWT-session role).
export async function requirePermission(permission: AdminPermission) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${defaultLocale}/login`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account`);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });
  if (!user || !hasPermission(user.permissions, permission)) {
    redirect(`/${defaultLocale}/admin`);
  }
}

// Same as requirePermission but keeps the original requireAdmin() contract
// (used by paths that only check ADMIN + full control for now).
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${defaultLocale}/login`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account`);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });
  if (!user) {
    redirect(`/${defaultLocale}/account`);
  }
}

// Guard allowing access when ANY of the given permissions is held.
export async function requireAnyPermission(permissions: AdminPermission[]) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${defaultLocale}/login`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${defaultLocale}/account`);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissions: true },
  });
  if (!user || !permissions.some((p) => hasPermission(user.permissions, p))) {
    redirect(`/${defaultLocale}/admin`);
  }
}
