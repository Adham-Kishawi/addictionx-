"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { createManualOrder } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/dictionary";

export type ManualOrderProduct = {
  id: string;
  name: string;
  variants: { id: string; sizeMl: number; price: number; stock: number }[];
};

export function ManualOrderForm({
  dict,
  locale,
  products,
}: {
  dict: Dictionary;
  locale: Locale;
  products: ManualOrderProduct[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [lines, setLines] = useState<
    { productId: string; variantId: string; quantity: number }[]
  >([]);

  const addLine = () => {
    const firstProduct = products[0];
    setLines((prev) => [
      ...prev,
      {
        productId: firstProduct?.id ?? "",
        variantId: firstProduct?.variants[0]?.id ?? "",
        quantity: 1,
      },
    ]);
  };

  const updateLine = (i: number, patch: Partial<(typeof lines)[number]>) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  };

  const removeLine = (i: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const totalQirsh = lines.reduce((sum, l) => {
    const product = products.find((p) => p.id === l.productId);
    const variant = product?.variants.find((v) => v.id === l.variantId);
    return sum + (variant?.price ?? 0) * l.quantity;
  }, 0);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lines.length === 0 || lines.some((l) => !l.productId || !l.variantId)) {
      setMessage({ type: "err", text: dict.admin.emptyLines });
      return;
    }
    setPending(true);
    setMessage(null);

    const fd = new FormData(e.currentTarget);
    const res = await createManualOrder({
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      governorate: String(fd.get("governorate") ?? ""),
      address: String(fd.get("address") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      })),
    });

    setPending(false);
    if (res.ok) {
      setMessage({
        type: "ok",
        text: `${dict.admin.orderCreated} — ${res.orderNumber}`,
      });
      setLines([]);
      e.currentTarget.reset();
      router.push(`/${locale}/admin/orders/${res.orderId}`);
    } else {
      setMessage({
        type: "err",
        text: dict.admin.orderCreateError,
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Customer data */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="mb-4 text-sm font-semibold">
          {dict.checkout.shippingInfo}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.checkout.fullName} name="name" required />
          <Field label={dict.checkout.phone} name="phone" required dir="ltr" />
          <Field
            label={dict.checkout.governorate}
            name="governorate"
            required
          />
          <Field label={dict.checkout.address} name="address" required />
        </div>
      </section>

      {/* Order lines */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{dict.admin.orderLines}</h2>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
          >
            <Plus className="size-3.5" />
            {dict.admin.addLine}
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {dict.admin.emptyLines}
          </p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, i) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div
                  key={i}
                  className="grid gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      {dict.admin.selectProduct}
                    </label>
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = products.find((x) => x.id === pid);
                        updateLine(i, {
                          productId: pid,
                          variantId: p?.variants[0]?.id ?? "",
                        });
                      }}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">—</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      {dict.admin.selectSize}
                    </label>
                    <select
                      value={line.variantId}
                      onChange={(e) =>
                        updateLine(i, { variantId: e.target.value })
                      }
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {product?.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.sizeMl}ml — {formatPrice(v.price, locale)} (
                          {v.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">
                      {dict.cart.quantity}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(i, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="self-end rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                    aria-label="remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{dict.admin.orderTotal}</span>
          <span className="font-semibold text-primary">
            {formatPrice(totalQirsh, locale)}
          </span>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? dict.common.loading : dict.admin.createOrder}
        </button>
        {message?.type === "ok" && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <Check className="size-4" />
            {message.text}
          </span>
        )}
        {message?.type === "err" && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        {...props}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function formatPrice(qirsh: number, locale: Locale) {
  const pounds = qirsh / 100;
  const symbol = locale === "ar" ? " ج.م" : " EGP";
  return `${pounds.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  })}${symbol}`;
}
