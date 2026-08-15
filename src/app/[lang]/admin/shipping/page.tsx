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
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">
        {dict.admin.shipping || "Shipping"}
      </h1>
      <p className="text-sm text-muted-foreground">{dict.admin.shippingDesc}</p>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Truck className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {dict.admin.shippingSettings}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.shippingSettingsDesc}
            </p>
          </div>
        </div>
        <div className="p-6">
          <ShippingSettingsForm
            dict={dict}
            feeEgp={config.shippingFee / 100}
            thresholdEgp={config.freeShippingThreshold / 100}
            carrier={config.carrier}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <MapPinned className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {dict.admin.shippingZones}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dict.admin.shippingZonesDesc}
            </p>
          </div>
        </div>
        <div className="p-6">
          <ShippingZonesManager dict={dict} locale={locale} zones={zones} />
        </div>
      </section>
    </div>
  );
}
