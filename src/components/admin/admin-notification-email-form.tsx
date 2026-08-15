"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateAdminNotificationEmail } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

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
      <div>
        <label
          htmlFor="adminNotificationEmail"
          className="mb-2 block text-sm font-medium"
        >
          {dict.admin.adminNotificationEmail}
        </label>
        <input
          id="adminNotificationEmail"
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setStatus("idle");
          }}
          className={cn(
            "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            status === "error" ? "border-destructive" : "border-border",
          )}
          placeholder="you@gmail.com"
          dir="ltr"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {dict.admin.adminNotificationEmailHint}
        </p>
        {status === "ok" && (
          <p className="mt-1 text-xs text-emerald-500">
            {dict.admin.adminNotificationEmailSaved}
          </p>
        )}
        {status === "error" && (
          <p className="mt-1 text-xs text-destructive">
            {dict.admin.paymentSettingsError}
          </p>
        )}
      </div>
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
