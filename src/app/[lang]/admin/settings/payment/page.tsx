import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { PaymentAccountsForm } from "@/components/admin/payment-accounts-form";
import { getPaymentAccountsConfig } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  // Require "settings" permission
  await requirePermission("settings", locale);

  // Fetch current payment account settings
  const config = await getPaymentAccountsConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dict.admin.paymentSettings}</h1>
        <p className="mt-2 text-muted-foreground">
          {dict.admin.paymentSettingsHint}
        </p>
      </div>

      <PaymentAccountsForm config={config} locale={locale} dict={dict} />
    </div>
  );
}
