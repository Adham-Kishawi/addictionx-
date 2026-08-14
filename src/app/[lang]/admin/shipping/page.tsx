import { Truck, MapPinned } from "lucide-react";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { getShippingConfig } from "@/lib/store-config";
import { getAllGovernorates } from "@/lib/shipping";
import { ShippingSettingsForm } from "@/components/admin/shipping-settings-form";
import { ShippingZonesManager } from "@/components/admin/shipping-zones-manager";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("settings", locale);
  const dict = getDictionary(locale);

  const [config, zones] = await Promise.all([
    getShippingConfig(),
    getAllGovernorates(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.shipping || "Shipping"}
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
          <MapPinned className="size-4 text-primary" />
          {dict.admin.shippingZones}
        </div>
        <ShippingZonesManager dict={dict} locale={locale} zones={zones} />
      </section>
    </div>
  );
}
