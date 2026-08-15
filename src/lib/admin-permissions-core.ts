export const ADMIN_PERMISSIONS = [
  "products",
  "orders",
  "reviews",
  "coupons",
  "collections",
  "users",
  "admins",
  "newsletter",
  "settings",
  "slider",
  "shipping",
  "bestsellers",
  "payment-verification",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const isPermission = (value: string): value is AdminPermission =>
  (ADMIN_PERMISSIONS as readonly string[]).includes(value);

export const hasPermission = (
  permissions: string[] | null | undefined,
  permission: AdminPermission,
): boolean => {
  if (!permissions) return false;
  if (permissions.length === 0) return true; // super admin
  return permissions.includes(permission);
};

export const isSuperAdmin = (permissions: string[] | null | undefined) =>
  Array.isArray(permissions) && permissions.length === 0;
