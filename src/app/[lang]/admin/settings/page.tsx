import { Layers, CreditCard, Bell, Send } from "lucide-react";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import {
  getHomeSectionsConfig,
  getAdminNotificationEmail,
  getEmailFrom,
} from "@/lib/store-config";
import { getPaymentSettings } from "@/lib/shipping";
import { HomeSectionsForm } from "@/components/admin/home-sections-form";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { AdminNotificationEmailForm } from "@/components/admin/admin-notification-email-form";
import { SenderEmailForm } from "@/components/admin/sender-email-form";

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

  const [homeSections, payment, notificationEmail, emailFrom] =
    await Promise.all([
      getHomeSectionsConfig(),
      getPaymentSettings(),
      getAdminNotificationEmail(),
      getEmailFrom(),
    ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">{dict.admin.settings}</h1>
      <p className="text-sm text-muted-foreground">{dict.admin.settingsDesc}</p>

      <section className="w-full overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {dict.admin.adminNotificationEmail}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.adminNotificationEmailHint}
            </p>
          </div>
        </div>
        <div className="p-6">
          <AdminNotificationEmailForm
            initialEmail={notificationEmail}
            locale={locale}
            dict={dict}
          />
        </div>
      </section>

      <section className="w-full overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Send className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{dict.admin.emailSender}</h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.emailSenderHint}
            </p>
          </div>
        </div>
        <div className="p-6">
          <SenderEmailForm
            initialFrom={emailFrom}
            locale={locale}
            dict={dict}
          />
        </div>
      </section>

      <section className="w-full overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {dict.admin.paymentSettings}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.paymentSettingsDesc}
            </p>
          </div>
        </div>
        <div className="p-6">
          <PaymentSettingsForm dict={dict} initial={payment} />
        </div>
      </section>

      <section className="w-full overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Layers className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {dict.admin.homeCollectionsSettings}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.fieldsOptional}
            </p>
          </div>
        </div>
        <div className="p-6">
          <HomeSectionsForm
            dict={dict}
            showCollections={homeSections.showCollections}
            eyebrow={homeSections.collectionsEyebrow}
            title={homeSections.collectionsTitle}
            subtitle={homeSections.collectionsSubtitle}
          />
        </div>
      </section>
    </div>
  );
}
