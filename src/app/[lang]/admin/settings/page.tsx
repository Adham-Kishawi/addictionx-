import { Truck, Layers } from "lucide-react";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { getShippingConfig, getHomeSectionsConfig } from "@/lib/store-config";
import { ShippingSettingsForm } from "@/components/admin/shipping-settings-form";
import { HomeSectionsForm } from "@/components/admin/home-sections-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requirePermission("settings");
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const [config, homeSections] = await Promise.all([
    getShippingConfig(),
    getHomeSectionsConfig(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.settings}
      </h1>

      <section className="mb-6 rounded-2xl border border-border bg-card/40 p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-primary" />
          {dict.admin.shippingSettings}
        </div>
        <ShippingSettingsForm
          dict={dict}
          feeEgp={config.shippingFee / 100}
          thresholdEgp={config.freeShippingThreshold / 100}
          carrier={config.carrier}
        />
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
