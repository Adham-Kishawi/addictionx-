"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, AlertCircle } from "lucide-react";
import {
  updateUserDetails,
  type UpdateUserDetailsState,
} from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { Field, fieldInputClass } from "@/components/ui/field";

export function EditUserForm({
  userId,
  name,
  email,
  phone,
  dict,
  disabled = false,
}: {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dict: Dictionary;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UpdateUserDetailsState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    try {
      const res = await updateUserDetails(
        userId,
        undefined,
        new FormData(e.currentTarget),
      );
      setState(res);
      if (res.success) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  const error =
    state.error === "EMAIL_EXISTS" || state.error === "INVALID"
      ? dict.admin.userEditError
      : state.error
        ? dict.admin.errorGeneric
        : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil className="size-3.5" />
        {dict.admin.editUser}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-background p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.name}>
          <input
            name="name"
            className={fieldInputClass()}
            defaultValue={name ?? ""}
            required
          />
        </Field>
        <Field label={dict.account.email}>
          <input
            name="email"
            type="email"
            className={fieldInputClass()}
            dir="ltr"
            defaultValue={email ?? ""}
            required
          />
        </Field>
        <Field label={dict.admin.phone}>
          <input
            name="phone"
            className={fieldInputClass()}
            dir="ltr"
            defaultValue={phone ?? ""}
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Check className="size-3.5" />
          {pending ? dict.common.loading : dict.admin.save}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted/70 disabled:opacity-50"
        >
          <X className="size-3.5" />
          {dict.admin.cancel}
        </button>
        {state.success && (
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <Check className="size-3.5" />
            {dict.admin.userEdited}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
