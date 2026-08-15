"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  AlertCircle,
  ChevronDown,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createGovernorate,
  createRegion,
  deleteGovernorate,
  deleteRegion,
  toggleGovernorateActive,
  toggleRegionActive,
} from "@/features/admin/zones-actions";
import { formatPrice } from "@/features/catalog/data/products";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import type { GovernorateAdminDto } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Field, fieldInputClass } from "@/components/ui/field";

export function ShippingZonesManager({
  dict,
  locale,
  zones,
}: {
  dict: Dictionary;
  locale: Locale;
  zones: GovernorateAdminDto[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [addingGov, setAddingGov] = useState(false);
  const [addingRegion, setAddingRegion] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const name = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const run = async (
    fn: () => Promise<{ success?: boolean; error?: string }>,
    busyId?: string,
  ) => {
    setPending(true);
    if (busyId) setPendingId(busyId);
    setMessage(null);
    const res = await fn();
    setPending(false);
    setPendingId(null);
    if (res.success) {
      setMessage({ type: "ok", text: dict.admin.zoneSaved });
      router.refresh();
    } else {
      setMessage({ type: "err", text: dict.admin.zoneSaveError });
    }
    return res;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {dict.admin.shippingZonesDesc}
        </p>
        <button
          type="button"
          onClick={() => setAddingGov(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-4" />
          {dict.admin.addGovernorate}
        </button>
      </div>

      {addingGov && (
        <GovForm
          dict={dict}
          onCancel={() => setAddingGov(false)}
          onSubmit={async (fd) => {
            const res = await run(() => createGovernorate(undefined, fd));
            if (res.success) setAddingGov(false);
          }}
        />
      )}

      {zones.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {dict.admin.noGovernorates}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {zones.map((gov) => {
            const open = openId === gov.id;
            return (
              <li
                key={gov.id}
                className={cn(
                  "rounded-xl border border-border bg-background transition-opacity",
                  pendingId === gov.id && "opacity-60",
                )}
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : gov.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start text-sm font-medium"
                  >
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span className="truncate">
                      {name(gov.nameAr, gov.nameEn)}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {gov.regions.length}
                    </span>
                    {!gov.isActive && (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        {dict.admin.inactive}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    title={dict.admin.delete}
                    onClick={() => {
                      if (window.confirm(dict.admin.deleteConfirm))
                        run(() => deleteGovernorate(gov.id));
                    }}
                    disabled={pending}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {dict.admin.active}
                    </span>
                    <Switch
                      checked={gov.isActive}
                      disabled={pending}
                      onChange={() =>
                        run(() => toggleGovernorateActive(gov.id), gov.id)
                      }
                      label={dict.admin.activate}
                    />
                  </div>
                </div>

                {open && (
                  <div className="flex flex-col gap-3 border-t border-border p-4">
                    {gov.regions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {dict.admin.noRegions}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {gov.regions.map((region) => (
                          <li
                            key={region.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm transition-opacity",
                              pendingId === region.id && "opacity-60",
                              !region.isActive && "opacity-50",
                            )}
                          >
                            <span className="min-w-0 truncate">
                              {name(region.nameAr, region.nameEn)}
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {formatPrice(region.shippingFee)}
                              </span>
                              <Switch
                                checked={region.isActive}
                                disabled={pending}
                                onChange={() =>
                                  run(
                                    () => toggleRegionActive(region.id),
                                    region.id,
                                  )
                                }
                                label={dict.admin.activate}
                              />
                              <button
                                type="button"
                                title={dict.admin.delete}
                                onClick={() => {
                                  if (window.confirm(dict.admin.deleteConfirm))
                                    run(() => deleteRegion(region.id));
                                }}
                                disabled={pending}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {addingRegion === gov.id ? (
                      <RegionForm
                        dict={dict}
                        onCancel={() => setAddingRegion(null)}
                        onSubmit={async (fd) => {
                          const res = await run(() =>
                            createRegion(gov.id, undefined, fd),
                          );
                          if (res.success) setAddingRegion(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingRegion(gov.id)}
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Plus className="size-3.5" />
                        {dict.admin.addRegion}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm",
            message.type === "ok" ? "text-emerald-500" : "text-destructive",
          )}
        >
          {message.type === "ok" ? (
            <Check className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {message.text}
        </p>
      )}
    </div>
  );
}

function GovForm({
  dict,
  onCancel,
  onSubmit,
}: {
  dict: Dictionary;
  onCancel: () => void;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <form
      action={async (fd) => {
        setPending(true);
        await onSubmit(fd);
        setPending(false);
      }}
      className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2"
    >
      <Field label={dict.admin.governorateNameAr}>
        <input
          name="nameAr"
          placeholder={dict.admin.governorateNameAr}
          className={fieldInputClass()}
          required
        />
      </Field>
      <Field label={dict.admin.governorateNameEn}>
        <input
          name="nameEn"
          placeholder={dict.admin.governorateNameEn}
          className={fieldInputClass()}
          dir="ltr"
          required
        />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {dict.admin.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          {dict.admin.cancel}
        </button>
      </div>
    </form>
  );
}

function RegionForm({
  dict,
  onCancel,
  onSubmit,
}: {
  dict: Dictionary;
  onCancel: () => void;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <form
      action={async (fd) => {
        setPending(true);
        await onSubmit(fd);
        setPending(false);
      }}
      className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2"
    >
      <Field label={dict.admin.regionNameAr}>
        <input
          name="nameAr"
          placeholder={dict.admin.regionNameAr}
          className={fieldInputClass()}
          required
        />
      </Field>
      <Field label={dict.admin.regionNameEn}>
        <input
          name="nameEn"
          placeholder={dict.admin.regionNameEn}
          className={fieldInputClass()}
          dir="ltr"
          required
        />
      </Field>
      <Field label={dict.admin.regionFeeEgp} className="sm:col-span-2">
        <input
          name="shippingFeeEgp"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          className={fieldInputClass()}
          dir="ltr"
          required
        />
      </Field>
      <div className="flex items-end gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {dict.admin.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          {dict.admin.cancel}
        </button>
      </div>
    </form>
  );
}
