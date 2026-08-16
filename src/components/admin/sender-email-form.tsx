"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateEmailFrom } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";
import { Field, fieldInputClass } from "@/components/ui/field";

type Props = {
  initialFrom: string;
  locale: Locale;
  dict: {
    admin: {
      emailSender: string;
      emailSenderHint: string;
      adminNotificationEmailSaved: string;
      paymentSettingsError: string;
      save: string;
    };
  };
};

export function SenderEmailForm({ initialFrom, locale, dict }: Props) {
  const [value, setValue] = useState(initialFrom);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateEmailFrom({ from: value, locale });
      setStatus(result.ok ? "ok" : "error");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label={dict.admin.emailSender}
        hint={status === "error" ? undefined : dict.admin.emailSenderHint}
        error={status === "error" ? dict.admin.paymentSettingsError : undefined}
        htmlFor="emailFrom"
      >
        <input
          id="emailFrom"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className={fieldInputClass(status === "error")}
          aria-invalid={status === "error"}
          placeholder="ADDICTIONX <addictionx2026@gmail.com>"
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
        className="gap-2 px-4"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {dict.admin.save}
      </Button>
    </form>
  );
}
