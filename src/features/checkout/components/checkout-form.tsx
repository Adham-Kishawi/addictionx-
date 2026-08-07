"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice } from "@/features/catalog/data/products";
import { createOrder, validateCoupon } from "@/features/checkout/actions";
import {
  useCartStore,
  getCartSubtotal,
  getCartItemCount,
} from "@/stores/cart-store";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type ShippingConfig = {
  fee: number;
  freeThreshold: number;
  carrier: string;
};

type CouponState = { code: string; discount: number } | null;

export function CheckoutForm({ locale }: { locale: Locale }) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const dict = getDictionary(locale);

  const subtotal = getCartSubtotal(items);
  const count = getCartItemCount(items);

  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(
    null,
  );
  const [coupon, setCoupon] = useState<CouponState>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<
    "idle" | "checking" | "error" | "applied"
  >("idle");

  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ShippingConfig | null) => {
        if (data) setShippingConfig(data);
      })
      .catch(() => {});
  }, []);

  const shippingFee = shippingConfig?.fee ?? 0;
  const freeThreshold = shippingConfig?.freeThreshold ?? Infinity;
  const discount = coupon?.discount ?? 0;
  const shipping = subtotal - discount >= freeThreshold ? 0 : shippingFee;
  const total = subtotal - discount + shipping;

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [placed, setPlaced] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [error, setError] = useState<
    "GENERIC" | "UNAVAILABLE" | "STOCK" | "COUPON_INVALID" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const schema = z.object({
    name: z.string().min(2, dict.checkout.validation.name),
    phone: z
      .string()
      .min(10, dict.checkout.validation.phone)
      .regex(/^[0-9+\s-]+$/, dict.checkout.validation.phone),
    governorate: z.string().min(1, dict.checkout.validation.governorate),
    address: z.string().min(5, dict.checkout.validation.address),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", governorate: "", address: "" },
  });

  if (placed) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <CheckCircle2 className="size-20 text-emerald-400" />
        <h1 className="font-display text-3xl font-bold">
          {dict.checkout.successTitle}
        </h1>
        <p className="text-lg font-semibold text-primary" dir="ltr">
          {dict.checkout.orderNumber}: {placed.orderNumber}
        </p>
        <p className="max-w-md text-muted-foreground">
          {dict.checkout.successText}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            render={<Link href={`/${locale}/account`} />}
            size="lg"
            className="rounded-full px-8"
          >
            {dict.checkout.viewOrders}
          </Button>
          <Button
            render={<Link href={`/${locale}/catalog`} />}
            variant="outline"
            size="lg"
            className="rounded-full px-8"
          >
            {dict.home.ctaButton}
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">{dict.cart.empty}</p>
        <Button
          render={<Link href={`/${locale}/catalog`} />}
          variant="outline"
          size="lg"
          className="rounded-full px-8"
        >
          {dict.cart.startShopping}
        </Button>
      </div>
    );
  }

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponStatus("checking");
    startTransition(async () => {
      const result = await validateCoupon(code, subtotal);
      if (result.ok && result.discount != null) {
        setCoupon({ code, discount: result.discount });
        setCouponStatus("applied");
      } else {
        setCoupon(null);
        setCouponStatus("error");
      }
    });
  };

  const onSubmit = handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      const result = await createOrder({
        locale,
        items,
        name: data.name,
        phone: data.phone,
        governorate: data.governorate,
        address: data.address,
        paymentMethod: "CASH_ON_DELIVERY",
        couponCode: coupon?.code,
      });
      if (result.ok) {
        clearCart();
        setPlaced({ orderId: result.orderId, orderNumber: result.orderNumber });
      } else {
        setError(result.error);
      }
    });
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="size-5 shrink-0" />
            <span>
              {
                dict.checkout.errors[
                  error.toLowerCase() as
                    "generic" | "unavailable" | "stock" | "coupon_invalid"
                ]
              }
            </span>
          </div>
        )}

        {/* Shipping info */}
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6">
          <legend className="px-2 text-sm font-semibold">
            {dict.checkout.shippingInfo}
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.checkout.fullName} error={errors.name?.message}>
              <input
                type="text"
                {...register("name")}
                className={inputClass(!!errors.name)}
                placeholder="Ahmed Ali"
              />
            </Field>
            <Field label={dict.checkout.phone} error={errors.phone?.message}>
              <input
                type="tel"
                inputMode="tel"
                {...register("phone")}
                className={inputClass(!!errors.phone)}
                placeholder="+20 100 000 0000"
              />
            </Field>
          </div>

          <Field
            label={dict.checkout.governorate}
            error={errors.governorate?.message}
          >
            <select
              {...register("governorate")}
              className={inputClass(!!errors.governorate)}
            >
              <option value="">—</option>
              {[
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
              ].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label={dict.checkout.address} error={errors.address?.message}>
            <textarea
              rows={3}
              {...register("address")}
              className={cn(inputClass(!!errors.address), "resize-none")}
              placeholder="District, Street, Building, Floor"
            />
          </Field>
        </fieldset>

        {/* Discount coupon */}
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6">
          <legend className="px-2 text-sm font-semibold">
            {dict.checkout.couponTitle}
          </legend>

          {coupon ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
              <span className="flex items-center gap-2">
                <Tag className="size-4 text-emerald-500" />
                <span className="font-semibold" dir="ltr">
                  {coupon.code}
                </span>
                <span className="text-emerald-600">
                  −{formatPrice(coupon.discount)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                  setCouponStatus("idle");
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={dict.checkout.couponRemove}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponStatus("idle");
                }}
                placeholder={dict.checkout.couponPlaceholder}
                className={cn(
                  inputClass(couponStatus === "error"),
                  "uppercase",
                )}
                dir="ltr"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                disabled={isPending || !couponInput.trim()}
                className="shrink-0 rounded-lg px-4"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  dict.checkout.couponApply
                )}
              </Button>
            </div>
          )}
          {couponStatus === "error" && (
            <p className="text-xs text-destructive">
              {dict.checkout.couponInvalid}
            </p>
          )}
        </fieldset>

        {/* Payment method */}
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6">
          <legend className="px-2 text-sm font-semibold">
            {dict.checkout.payment}
          </legend>

          <PaymentOption
            active={paymentMethod === "cod"}
            onClick={() => setPaymentMethod("cod")}
            icon={<Banknote className="size-5" />}
            title={dict.checkout.cashOnDelivery}
            hint={dict.checkout.cashOnDeliveryHint}
          />
          <PaymentOption
            active={paymentMethod === "card"}
            onClick={() => setPaymentMethod("card")}
            icon={<CreditCard className="size-5" />}
            title={dict.checkout.card}
            hint={dict.checkout.cardHint}
            disabled
          />
        </fieldset>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 w-full rounded-full text-base sm:w-auto sm:px-10"
        >
          {isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              {dict.checkout.placeOrder}
            </>
          ) : (
            `${dict.checkout.placeOrder} · ${formatPrice(total)} ${dict.product.currency}`
          )}
        </Button>
      </form>

      {/* Order summary */}
      <aside className="h-fit rounded-2xl border border-border bg-card/40 p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 text-sm font-semibold">
          {dict.checkout.orderSummary} ({count})
        </h2>
        <ul className="mb-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3">
              <ProductArt
                product={item}
                showName={false}
                className="size-12 shrink-0 rounded-lg overflow-hidden"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {locale === "ar" ? item.nameAr : item.nameEn}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.price)}
                  {item.sizeMl ? ` · ${item.sizeMl}ml` : ""}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{dict.cart.subtotal}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>{dict.cart.discount}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>{dict.cart.shipping}</span>
            <span>
              {shipping === 0 ? dict.cart.shippingFree : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>{dict.cart.total}</span>
            <span>
              {formatPrice(total)} {dict.product.currency}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    hasError ? "border-destructive" : "border-border",
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-start transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
