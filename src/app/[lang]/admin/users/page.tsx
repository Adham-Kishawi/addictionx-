import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/admin-permissions";
import { requireAnyPermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import { AddUserForm } from "@/components/admin/add-user-form";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { UserPermissionsEditor } from "@/components/admin/user-permissions-editor";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requireAnyPermission(["users", "admins"]);
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const [users, session] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    }),
    auth(),
  ]);

  // Role/permission editing is reserved for full admins OR users holding
  // the "admins" permission.
  const dbUser = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { permissions: true },
      })
    : null;
  const canManageAdmins =
    session?.user?.role === "ADMIN" &&
    (hasPermission(dbUser?.permissions ?? [], "admins") ||
      (dbUser?.permissions ?? []).length === 0);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.users}
      </h1>

      <div className="mb-6">
        <AddUserForm
          dict={dict}
          limited={!canManageAdmins}
          canManageUsers={hasPermission(dbUser?.permissions ?? [], "users")}
        />
      </div>

      <p className="mb-4 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground">
        {dict.admin.permissionsHint}
      </p>

      {users.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noUsers}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.name}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.account.email}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.joined}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.changeRole}
                </th>
                {canManageAdmins && (
                  <th className="px-4 py-3 text-start font-medium">
                    {dict.admin.permissions}
                  </th>
                )}
                <th className="px-4 py-3 text-end font-medium">
                  {dict.admin.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {user.name ?? "—"}
                    {session?.user?.id === user.id && (
                      <span className="ms-2 text-xs text-muted-foreground">
                        ({dict.admin.goToAccount})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-EG",
                    )}
                  </td>
                  <td className="px-4 py-3 text-start">
                    {user.role === "ADMIN" && !canManageAdmins ? (
                      <span className="text-xs text-muted-foreground">
                        {dict.admin.adminRole}
                      </span>
                    ) : (
                      <UserRoleSelect
                        userId={user.id}
                        role={user.role}
                        self={session?.user?.id === user.id}
                        dict={dict}
                        disabled={!canManageAdmins}
                      />
                    )}
                  </td>
                  {canManageAdmins && (
                    <td className="max-w-[260px] px-4 py-3">
                      <UserPermissionsEditor
                        userId={user.id}
                        role={user.role}
                        permissions={user.permissions}
                        self={session?.user?.id === user.id}
                        dict={dict}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-end">
                    <DeleteUserButton
                      userId={user.id}
                      self={session?.user?.id === user.id}
                      dict={dict}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
