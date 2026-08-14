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
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requireAnyPermission(["users", "admins"], locale);
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

      <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
        <p className="font-medium">{dict.admin.permissionsHint}</p>
      </div>

      {users.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noUsers}
        </p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const isSelf = session?.user?.id === user.id;
            const isAdmin = user.role === "ADMIN";

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-border bg-card/40 p-5 transition-all hover:border-border hover:shadow-md"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {user.name ?? "—"}
                      </h3>
                      {isSelf && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {dict.admin.goToAccount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {user.email ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dict.admin.joined}:{" "}
                      {new Date(user.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-EG",
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && !canManageAdmins ? (
                      <span className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {dict.admin.adminRole}
                      </span>
                    ) : (
                      <UserRoleSelect
                        userId={user.id}
                        role={user.role}
                        self={isSelf}
                        dict={dict}
                        disabled={!canManageAdmins}
                      />
                    )}
                    <DeleteUserButton
                      userId={user.id}
                      self={isSelf}
                      dict={dict}
                    />
                  </div>
                </div>

                {canManageAdmins && isAdmin && (
                  <div className="border-t border-border/60 pt-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      {dict.admin.permissions}
                    </h4>
                    <UserPermissionsEditor
                      userId={user.id}
                      role={user.role}
                      permissions={user.permissions}
                      self={isSelf}
                      dict={dict}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
