"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePaymentAccounts } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";
import { Field, fieldInputClass } from "@/components/ui/field";

const schema = z.object({
  instapayNumber: z.string().trim(),
  instapayPhone: z.string().trim(),
  instapayName: z.string().trim(),
  vodafoneCashNumber: z.string().trim(),
  vodafoneCashNameAr: z.string().trim(),
  vodafoneCashNameEn: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

type PaymentAccountsConfig = {
  instapayNumber: string;
  instapayPhone: string;
  instapayName: string;
  vodafoneCashNumber: string;
  vodafoneCashNameAr: string;
  vodafoneCashNameEn: string;
};

type Props = {
  config: PaymentAccountsConfig;
  locale: Locale;
  dict: {
    admin: {
      instapayAccountNumber: string;
      instapayAccountName: string;
      instapayPhone: string;
      vodafoneCashNumber: string;
      vodafoneCashName: string;
      vodafoneCashNameAr: string;
      vodafoneCashNameEn: string;
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
      instapayPhone: config.instapayPhone,
      instapayName: config.instapayName,
      vodafoneCashNumber: config.vodafoneCashNumber,
      vodafoneCashNameAr: config.vodafoneCashNameAr,
      vodafoneCashNameEn: config.vodafoneCashNameEn,
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
          <Field
            label={dict.admin.instapayAccountNumber}
            error={errors.instapayNumber?.message}
            htmlFor="instapayNumber"
          >
            <input
              id="instapayNumber"
              type="text"
              {...register("instapayNumber")}
              className={fieldInputClass(!!errors.instapayNumber)}
              aria-invalid={!!errors.instapayNumber}
              placeholder="you@instapay"
              dir="ltr"
            />
          </Field>
          <Field
            label={dict.admin.instapayPhone}
            error={errors.instapayPhone?.message}
            htmlFor="instapayPhone"
          >
            <input
              id="instapayPhone"
              type="text"
              {...register("instapayPhone")}
              className={fieldInputClass(!!errors.instapayPhone)}
              aria-invalid={!!errors.instapayPhone}
              placeholder="01XXXXXXXXX"
              dir="ltr"
            />
          </Field>
          <Field
            label={dict.admin.instapayAccountName}
            error={errors.instapayName?.message}
            htmlFor="instapayName"
          >
            <input
              id="instapayName"
              type="text"
              {...register("instapayName")}
              className={fieldInputClass(!!errors.instapayName)}
              aria-invalid={!!errors.instapayName}
              placeholder="ADDICTIONX"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Vodafone Cash</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={dict.admin.vodafoneCashNumber}
            error={errors.vodafoneCashNumber?.message}
            htmlFor="vodafoneCashNumber"
          >
            <input
              id="vodafoneCashNumber"
              type="text"
              {...register("vodafoneCashNumber")}
              className={fieldInputClass(!!errors.vodafoneCashNumber)}
              aria-invalid={!!errors.vodafoneCashNumber}
              placeholder="01XXXXXXXXX"
              dir="ltr"
            />
          </Field>
          <Field
            label={dict.admin.vodafoneCashNameAr}
            error={errors.vodafoneCashNameAr?.message}
            htmlFor="vodafoneCashNameAr"
          >
            <input
              id="vodafoneCashNameAr"
              type="text"
              {...register("vodafoneCashNameAr")}
              className={fieldInputClass(!!errors.vodafoneCashNameAr)}
              aria-invalid={!!errors.vodafoneCashNameAr}
              placeholder="رانيا"
            />
          </Field>
          <Field
            label={dict.admin.vodafoneCashNameEn}
            error={errors.vodafoneCashNameEn?.message}
            htmlFor="vodafoneCashNameEn"
          >
            <input
              id="vodafoneCashNameEn"
              type="text"
              {...register("vodafoneCashNameEn")}
              className={fieldInputClass(!!errors.vodafoneCashNameEn)}
              aria-invalid={!!errors.vodafoneCashNameEn}
              placeholder="Rania"
            />
          </Field>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="gap-2 px-4"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {dict.admin.save}
      </Button>
    </form>
  );
}
