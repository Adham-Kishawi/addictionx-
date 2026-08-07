"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { deleteAddress } from "@/features/account/actions";
import { AddressForm } from "./address-form";
import type { AccountAddress } from "./account-tabs";
import type { Dictionary } from "@/lib/i18n/dictionary";

// إدارة عناوين العميل: قائمة + إضافة + تعديل + حذف + افتراضي.

export function AddressManager({
  dict,
  initial,
}: {
  dict: Dictionary;
  initial: AccountAddress[];
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleForm = (id: string | null) =>
    setActiveId((prev) => (prev === id ? null : id));

  const onSaved = () => {
    setActiveId(null);
    router.refresh();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(dict.account.addressDelete)) return;
    setDeletingId(id);
    await deleteAddress(id);
    setAddresses((list) => list.filter((a) => a.id !== id));
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setActiveId("new")}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Plus className="size-4" />
          {dict.account.addAddress}
        </button>
      </div>

      {activeId === "new" && (
        <AddressForm
          dict={dict}
          onSaved={onSaved}
          onCancel={() => setActiveId(null)}
        />
      )}

      {addresses.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.account.noAddresses}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => {
            const editing = activeId === address.id;
            return (
              <li
                key={address.id}
                className="rounded-2xl border border-border bg-card/40 p-5 text-sm"
              >
                {editing ? (
                  <AddressForm
                    dict={dict}
                    address={address}
                    onSaved={onSaved}
                    onCancel={() => setActiveId(null)}
                  />
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="mt-0.5 size-4 text-primary" />
                        <span className="font-semibold">
                          {address.fullName}
                        </span>
                        {address.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {dict.account.defaultAddress}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleForm(address.id)}
                          title={dict.account.addressEdit}
                          aria-label={dict.account.addressEdit}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(address.id)}
                          disabled={deletingId === address.id}
                          title={dict.account.addressDelete}
                          aria-label={dict.account.addressDelete}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      {address.governorate}
                      {address.city ? ` — ${address.city}` : ""}
                    </span>
                    {address.district && (
                      <span className="text-muted-foreground">
                        {address.district}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {address.street}
                      {address.building ? `, ${address.building}` : ""}
                      {address.apartment ? `, ${address.apartment}` : ""}
                    </span>
                    {address.landmark && (
                      <span className="text-muted-foreground">
                        {address.landmark}
                      </span>
                    )}
                    <span dir="ltr" className="text-start text-xs">
                      {address.phone}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
