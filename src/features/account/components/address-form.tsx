"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, AlertCircle, X } from "lucide-react";
import { createAddress, updateAddress } from "@/features/account/actions";
import { Button } from "@/components/ui/button";
import type { AccountAddress } from "./account-tabs";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

const governorates = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Mansoura",
  "Tanta",
  "Assiut",
  "Aswan",
  "Luxor",
  "Port Said",
  "Suez",
];

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

// Add/edit address form — same fields as checkout + optional side fields.
// address = null → create new, otherwise → edit.

export function AddressForm({
  dict,
  address,
  onSaved,
  onCancel,
}: {
  dict: Dictionary;
  address?: AccountAddress | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(address);

  const [form, setForm] = useState({
    fullName: address?.fullName ?? "",
    phone: address?.phone ?? "",
    governorate: address?.governorate ?? "",
    city: address?.city ?? "",
    district: address?.district ?? "",
    street: address?.street ?? "",
    building: address?.building ?? "",
    apartment: address?.apartment ?? "",
    landmark: address?.landmark ?? "",
    isDefault: address?.isDefault ?? false,
  });
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"saved" | "error" | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setDone(null);

    const fd = new FormData();
    fd.set("fullName", form.fullName);
    fd.set("phone", form.phone);
    fd.set("governorate", form.governorate);
    fd.set("city", form.city);
    fd.set("district", form.district);
    fd.set("street", form.street);
    fd.set("building", form.building);
    fd.set("apartment", form.apartment);
    fd.set("landmark", form.landmark);
    fd.set("isDefault", form.isDefault ? "on" : "");

    const res = isEdit
      ? await updateAddress(address!.id, undefined, fd)
      : await createAddress(undefined, fd);

    setPending(false);
    if (res.error) {
      setDone("error");
      return;
    }
    router.refresh();
    setDone("saved");
    setTimeout(onSaved, 500);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-card/40 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.account.fieldFullName} required>
          <input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label={dict.account.fieldPhone} required>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={cn(inputClass, "dir-ltr text-start")}
            dir="ltr"
            required
          />
        </Field>
        <Field label={dict.account.fieldGovernorate} required>
          <select
            value={form.governorate}
            onChange={(e) => set("governorate", e.target.value)}
            className={inputClass}
            required
          >
            <option value="">—</option>
            {governorates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label={dict.account.fieldCity} required>
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label={dict.account.fieldDistrict}>
          <input
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={dict.account.fieldStreet} required>
          <input
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label={dict.account.fieldBuilding}>
          <input
            value={form.building}
            onChange={(e) => set("building", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={dict.account.fieldApartment}>
          <input
            value={form.apartment}
            onChange={(e) => set("apartment", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={dict.account.fieldLandmark} className="sm:col-span-2">
          <input
            value={form.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="size-4 accent-primary"
        />
        {dict.account.setAsDefault}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="rounded-full px-6">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {dict.account.addressSave}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          title={dict.account.addressDelete}
          aria-label={dict.account.addressDelete}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
        {done === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" />
            {dict.account.addressSaved}
          </span>
        )}
        {done === "error" && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.account.addressError}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}
