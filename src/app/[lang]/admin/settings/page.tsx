import { Layers, CreditCard, Bell } from "lucide-react";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import {
  getHomeSectionsConfig,
  getAdminNotificationEmail,
} from "@/lib/store-config";
import { getPaymentSettings } from "@/lib/shipping";
import { HomeSectionsForm } from "@/components/admin/home-sections-form";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { AdminNotificationEmailForm } from "@/components/admin/admin-notification-email-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("settings", locale);
  const dict = getDictionary(locale);

  const [homeSections, payment, notificationEmail] = await Promise.all([
    getHomeSectionsConfig(),
    getPaymentSettings(),
    getAdminNotificationEmail(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.settings}
      </h1>

      <section className="mb-6 rounded-2xl border border-border bg-card/40 p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <Bell className="size-4 text-primary" />
          {dict.admin.adminNotificationEmail}
        </div>
        <AdminNotificationEmailForm
          initialEmail={notificationEmail}
          locale={locale}
          dict={dict}
        />
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-card/40 p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="size-4 text-primary" />
          {dict.admin.paymentSettings}
        </div>
        <PaymentSettingsForm dict={dict} initial={payment} />
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <Layers className="size-4 text-primary" />
          {dict.admin.homeCollectionsSettings}
        </div>
        <HomeSectionsForm
          dict={dict}
          showCollections={homeSections.showCollections}
          eyebrow={homeSections.collectionsEyebrow}
          title={homeSections.collectionsTitle}
          subtitle={homeSections.collectionsSubtitle}
        />
      </section>
    </div>
  );
}
