"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, AlertCircle } from "lucide-react";
import { createUser, type UserActionState } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function AddUserForm({
  dict,
  limited = false,
  canManageUsers = true,
}: {
  dict: Dictionary;
  limited?: boolean;
  canManageUsers?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UserActionState>({});

  const canCreate = limited ? canManageUsers : true;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate) return;
    setPending(true);
    setState({});
    try {
      const fd = new FormData(e.currentTarget);
      // A limited admin may only create customers — force the role.
      if (limited) fd.set("role", "CUSTOMER");
      const res = await createUser(undefined, fd);
      setState(res);
      if (res.success) {
        e.currentTarget.reset();
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  const error =
    state.error === "EMAIL_EXISTS" || state.error === "INVALID"
      ? dict.admin.userCreateError
      : state.error
        ? dict.admin.errorGeneric
        : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card/40 p-5"
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Plus className="size-4 text-primary" />
        {dict.admin.addUser}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={dict.admin.name}
          name="name"
          type="text"
          required
          placeholder={dict.admin.name}
        />
        <Field
          label={dict.account.email}
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder="user@example.com"
        />
        <Field
          label={dict.admin.userPassword}
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
        />
        {!limited && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {dict.admin.changeRole}
            </label>
            <select
              name="role"
              defaultValue="CUSTOMER"
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="CUSTOMER">{dict.admin.customerRole}</option>
              <option value="ADMIN">{dict.admin.adminRole}</option>
            </select>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {dict.admin.create}
        </button>
        {state.success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <Check className="size-4" />
            {dict.admin.userCreated}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        {...props}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
