"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePaymentAccounts } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const schema = z.object({
  instapayNumber: z.string().trim(),
  instapayName: z.string().trim(),
  vodafoneCashNumber: z.string().trim(),
  vodafoneCashName: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

type PaymentAccountsConfig = {
  instapayNumber: string;
  instapayName: string;
  vodafoneCashNumber: string;
  vodafoneCashName: string;
};

type Props = {
  config: PaymentAccountsConfig;
  locale: Locale;
  dict: {
    admin: {
      instapayAccountNumber: string;
      instapayAccountName: string;
      vodafoneCashNumber: string;
      vodafoneCashName: string;
      save: string;
      paymentSettingsSaved: string;
      paymentSettingsError: string;
    };
  };
};

export function PaymentAccountsForm({ config, locale, dict }: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      instapayNumber: config.instapayNumber,
      instapayName: config.instapayName,
      vodafoneCashNumber: config.vodafoneCashNumber,
      vodafoneCashName: config.vodafoneCashName,
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updatePaymentAccounts(data, locale);
      if (result.ok) {
        alert(dict.admin.paymentSettingsSaved);
      } else {
        alert(dict.admin.paymentSettingsError);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">InstaPay</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="instapayNumber"
              className="mb-2 block text-sm font-medium"
            >
              {dict.admin.instapayAccountNumber}
            </label>
            <input
              id="instapayNumber"
              type="text"
              {...register("instapayNumber")}
              className={inputClass(!!errors.instapayNumber)}
              placeholder="01XXXXXXXXX"
              dir="ltr"
            />
            {errors.instapayNumber && (
              <p className="mt-1 text-xs text-destructive">
                {errors.instapayNumber.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="instapayName"
              className="mb-2 block text-sm font-medium"
            >
              {dict.admin.instapayAccountName}
            </label>
            <input
              id="instapayName"
              type="text"
              {...register("instapayName")}
              className={inputClass(!!errors.instapayName)}
              placeholder="ADDICTIONX"
            />
            {errors.instapayName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.instapayName.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Vodafone Cash</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="vodafoneCashNumber"
              className="mb-2 block text-sm font-medium"
            >
              {dict.admin.vodafoneCashNumber}
            </label>
            <input
              id="vodafoneCashNumber"
              type="text"
              {...register("vodafoneCashNumber")}
              className={inputClass(!!errors.vodafoneCashNumber)}
              placeholder="01XXXXXXXXX"
              dir="ltr"
            />
            {errors.vodafoneCashNumber && (
              <p className="mt-1 text-xs text-destructive">
                {errors.vodafoneCashNumber.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="vodafoneCashName"
              className="mb-2 block text-sm font-medium"
            >
              {dict.admin.vodafoneCashName}
            </label>
            <input
              id="vodafoneCashName"
              type="text"
              {...register("vodafoneCashName")}
              className={inputClass(!!errors.vodafoneCashName)}
              placeholder="ADDICTIONX"
            />
            {errors.vodafoneCashName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.vodafoneCashName.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="gap-2 rounded-full px-8"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {dict.admin.save}
      </Button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    hasError ? "border-destructive" : "border-border",
  );
}
