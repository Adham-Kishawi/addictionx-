"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateAdminNotificationEmail } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";
import { Field, fieldInputClass } from "@/components/ui/field";

type Props = {
  initialEmail: string;
  locale: Locale;
  dict: {
    admin: {
      adminNotificationEmail: string;
      adminNotificationEmailHint: string;
      adminNotificationEmailSaved: string;
      paymentSettingsError: string;
      save: string;
    };
  };
};

export function AdminNotificationEmailForm({
  initialEmail,
  locale,
  dict,
}: Props) {
  const [value, setValue] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAdminNotificationEmail({
        email: value,
        locale,
      });
      setStatus(result.ok ? "ok" : "error");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label={dict.admin.adminNotificationEmail}
        hint={
          status === "error" ? undefined : dict.admin.adminNotificationEmailHint
        }
        error={status === "error" ? dict.admin.paymentSettingsError : undefined}
        htmlFor="adminNotificationEmail"
      >
        <input
          id="adminNotificationEmail"
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className={fieldInputClass(status === "error")}
          aria-invalid={status === "error"}
          placeholder="you@gmail.com"
          dir="ltr"
        />
        {status === "ok" && (
          <p className="text-xs text-emerald-500">
            {dict.admin.adminNotificationEmailSaved}
          </p>
        )}
      </Field>
      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        className="gap-2 rounded-full px-6"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {dict.admin.save}
      </Button>
    </form>
  );
}
