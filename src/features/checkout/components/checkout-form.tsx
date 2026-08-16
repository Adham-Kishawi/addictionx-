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
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice } from "@/features/catalog/data/products";
import { createOrder, validateCoupon } from "@/features/checkout/actions";
import {
  useCartStore,
  getCartSubtotal,
  getCartItemCount,
  cartItemKey,
} from "@/stores/cart-store";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { isValidEgyptianPhone } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { PaymentProofUpload } from "@/components/checkout/payment-proof-upload";

type Zone = {
  id: string;
  nameAr: string;
  nameEn: string;
  regions: {
    id: string;
    nameAr: string;
    nameEn: string;
    shippingFee: number;
  }[];
};

type PaymentSettings = { cardEnabled: boolean };

type PaymentAccountsConfig = {
  instapayNumber: string;
  instapayPhone: string;
  instapayName: string;
  vodafoneCashNumber: string;
  vodafoneCashNameAr: string;
  vodafoneCashNameEn: string;
};

type CouponState = { code: string; discount: number } | null;

type InitialValues = {
  name: string;
  phone: string;
  governorateName: string;
  regionName: string;
  address: string;
};

// Guest autofill: shoppers who pay without an account get their shipping
// details remembered on this browser so the next checkout is pre-filled.
const AUTOFILL_KEY = "addictionx:checkout-autofill";

export function CheckoutForm({
  locale,
  initialValues,
  isLoggedIn,
}: {
  locale: Locale;
  initialValues?: InitialValues;
  isLoggedIn?: boolean;
}) {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const dict = getDictionary(locale);

  const subtotal = getCartSubtotal(items);
  const count = getCartItemCount(items);

  const [zones, setZones] = useState<Zone[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cardEnabled: false,
  });
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountsConfig>(
    {
      instapayNumber: "",
      instapayPhone: "",
      instapayName: "ADDICTIONX",
      vodafoneCashNumber: "",
      vodafoneCashNameAr: "ADDICTIONX",
      vodafoneCashNameEn: "ADDICTIONX",
    },
  );
  const [freeThreshold, setFreeThreshold] = useState<number | null>(null);
  const [coupon, setCoupon] = useState<CouponState>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<
    "idle" | "checking" | "error" | "applied"
  >("idle");

  // Payment proof state (for InstaPay and Vodafone Cash)
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");

  // Copy-to-clipboard feedback for account details
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
  };

  useEffect(() => {
    fetch("/api/checkout-config")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            zones: Zone[];
            payment: PaymentSettings;
          } | null,
        ) => {
          if (!data) return;
          setZones(data.zones);
          setPaymentSettings(data.payment);
        },
      )
      .catch(() => {});
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { freeShippingThreshold?: number } | null) => {
        if (data && typeof data.freeShippingThreshold === "number") {
          setFreeThreshold(data.freeShippingThreshold);
        }
      })
      .catch(() => {});
    fetch("/api/payment-accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PaymentAccountsConfig | null) => {
        if (data) {
          setPaymentAccounts(data);
        }
      })
      .catch(() => {});
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "CARD" | "INSTAPAY" | "VODAFONE_CASH"
  >("CASH_ON_DELIVERY");
  const [placed, setPlaced] = useState<{
    orderId: string;
    orderNumber: string;
  } | null>(null);
  const [error, setError] = useState<
    | "GENERIC"
    | "UNAVAILABLE"
    | "STOCK"
    | "COUPON_INVALID"
    | "PAYMENT_UNAVAILABLE"
    | "VALIDATION"
    | "RATE_LIMITED"
    | null
  >(null);
  const [isPending, startTransition] = useTransition();

  const discount = coupon?.discount ?? 0;

  const schema = z.object({
    name: z.string().trim().min(2, dict.checkout.validation.name).max(120),
    phone: z
      .string()
      .trim()
      .min(10, dict.checkout.validation.phone)
      .refine(isValidEgyptianPhone, dict.checkout.validation.phone),
    governorateId: z
      .string()
      .trim()
      .min(1, dict.checkout.validation.governorate)
      .max(60),
    regionId: z.string().trim().min(1, dict.checkout.validation.region).max(60),
    address: z
      .string()
      .trim()
      .min(5, dict.checkout.validation.address)
      .max(300),
  });

  // Effective prefill: session profile (initialValues) wins; guests fall back
  // to the last details saved on this device (localStorage autofill).
  const [autofill, setAutofill] = useState<InitialValues | undefined>(
    initialValues,
  );
  useEffect(() => {
    if (isLoggedIn) return;
    try {
      const raw = window.localStorage.getItem(AUTOFILL_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<InitialValues>;
      if (!saved || typeof saved !== "object") return;
      setAutofill({
        name: saved.name ?? "",
        phone: saved.phone ?? "",
        governorateName: saved.governorateName ?? "",
        regionName: saved.regionName ?? "",
        address: saved.address ?? "",
      });
    } catch {
      // Corrupted autofill — ignore and let the shopper type fresh values.
    }
  }, [isLoggedIn]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: autofill?.name ?? "",
      phone: autofill?.phone ?? "",
      governorateId: "",
      regionId: "",
      address: autofill?.address ?? "",
    },
  });

  const selectedGovernorate = watch("governorateId");
  const selectedRegion = watch("regionId");

  const activeRegions =
    zones.find((z) => z.id === selectedGovernorate)?.regions ?? [];
  const activeRegion = activeRegions.find((r) => r.id === selectedRegion);

  // Match the last saved address (by name) to a zone id once zones load, so
  // returning customers (or guests with saved details) get their governorate
  // and region prefilled too.
  useEffect(() => {
    if (!zones.length || !autofill) return;
    const govName = autofill.governorateName.trim();
    const regName = autofill.regionName.trim();
    if (!govName) return;
    const gov = zones.find(
      (z) =>
        z.nameAr === govName ||
        z.nameEn === govName ||
        z.nameAr.includes(govName) ||
        govName.includes(z.nameAr),
    );
    if (!gov) return;
    setValue("governorateId", gov.id);
    if (regName) {
      const region = gov.regions.find(
        (r) =>
          r.nameAr === regName ||
          r.nameEn === regName ||
          r.nameAr.includes(regName) ||
          regName.includes(r.nameAr),
      );
      if (region) setValue("regionId", region.id);
    }
  }, [zones, autofill, setValue]);

  // Shipping fee: per-region when available, else flat; free above threshold.
  const shippingFee =
    freeThreshold !== null && subtotal - discount >= freeThreshold
      ? 0
      : (activeRegion?.shippingFee ?? 0);

  const total = subtotal - discount + shippingFee;

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
          {isLoggedIn && (
            <Button
              render={<Link href={`/${locale}/account`} />}
              size="lg"
              className="rounded-full px-8"
            >
              {dict.checkout.viewOrders}
            </Button>
          )}
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

  const focusFirstError = (fields: Record<string, { message?: string }>) => {
    const firstKey = Object.keys(fields)[0];
    if (!firstKey) return;
    // react-hook-form names are dot-free here, so querySelector with [name=...]
    // is safe; guard against unexpected characters anyway.
    const el = document.querySelector<HTMLElement>(`[name="${firstKey}"]`) as
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const onSubmit = handleSubmit((data) => {
    setError(null);
    startTransition(async () => {
      // Convert receipt file to base64 if present
      let receiptDataUrl: string | undefined;
      if (receiptFile) {
        try {
          const reader = new FileReader();
          receiptDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(receiptFile);
          });
        } catch {
          // If conversion fails, proceed without receipt
          receiptDataUrl = undefined;
        }
      }

      const result = await createOrder({
        locale,
        items,
        name: data.name,
        phone: data.phone,
        governorateId: data.governorateId,
        regionId: data.regionId,
        address: data.address,
        paymentMethod,
        idempotencyKey:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        couponCode: coupon?.code,
        receiptData: receiptDataUrl,
        transactionRef: transactionRef || undefined,
      });
      if (result.ok) {
        // Remember these details for the next checkout (guest autofill) —
        // saves on the device only; a signed-in profile always takes priority.
        try {
          const gov = zones.find((z) => z.id === data.governorateId);
          const region = gov?.regions.find((r) => r.id === data.regionId);
          window.localStorage.setItem(
            AUTOFILL_KEY,
            JSON.stringify({
              name: data.name,
              phone: data.phone,
              governorateName: gov
                ? locale === "ar"
                  ? gov.nameAr
                  : gov.nameEn
                : "",
              regionName: region
                ? locale === "ar"
                  ? region.nameAr
                  : region.nameEn
                : "",
              address: data.address,
            }),
          );
        } catch {
          // Storage unavailable — the order still succeeded.
        }
        clearCart();
        setPlaced({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
        });
      } else {
        setError(result.error);
      }
    });
  }, focusFirstError);

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
              {error === "RATE_LIMITED"
                ? dict.checkout.errors.too_many_attempts
                : dict.checkout.errors[
                    error.toLowerCase() as
                      | "generic"
                      | "unavailable"
                      | "stock"
                      | "coupon_invalid"
                      | "payment_unavailable"
                      | "validation"
                  ]}
            </span>
          </div>
        )}

        {/* Shipping info */}
        <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6">
          <legend className="px-2 text-sm font-semibold">
            {dict.checkout.shippingInfo}
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={dict.checkout.fullName}
              error={errors.name?.message}
              required
            >
              <input
                type="text"
                {...register("name")}
                className={inputClass(!!errors.name)}
                aria-invalid={!!errors.name}
                placeholder={dict.account.namePlaceholder}
              />
            </Field>
            <Field
              label={dict.checkout.phone}
              error={errors.phone?.message}
              required
            >
              <input
                type="tel"
                inputMode="tel"
                {...register("phone")}
                className={inputClass(!!errors.phone)}
                aria-invalid={!!errors.phone}
                placeholder="+20 100 000 0000"
                dir="ltr"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={dict.checkout.governorate}
              error={errors.governorateId?.message}
              required
            >
              <select
                {...register("governorateId")}
                className={inputClass(!!errors.governorateId)}
                aria-invalid={!!errors.governorateId}
              >
                <option value="">
                  {locale === "ar" ? "اختر المحافظة" : "Select governorate"}
                </option>
                {zones.map((g) => (
                  <option key={g.id} value={g.id}>
                    {locale === "ar" ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={dict.checkout.region}
              error={errors.regionId?.message}
              required
            >
              <select
                {...register("regionId")}
                className={inputClass(!!errors.regionId)}
                aria-invalid={!!errors.regionId}
                disabled={!selectedGovernorate}
              >
                <option value="">
                  {locale === "ar" ? "اختر المنطقة" : "Select region / area"}
                </option>
                {activeRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {locale === "ar" ? r.nameAr : r.nameEn}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            label={dict.checkout.address}
            error={errors.address?.message}
            required
          >
            <textarea
              rows={3}
              {...register("address")}
              className={cn(inputClass(!!errors.address), "resize-none")}
              aria-invalid={!!errors.address}
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
            active={paymentMethod === "CASH_ON_DELIVERY"}
            onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
            icon={<Banknote className="size-5" />}
            title={dict.checkout.cashOnDelivery}
            hint={dict.checkout.cashOnDeliveryHint}
          />
          <PaymentOption
            active={paymentMethod === "INSTAPAY"}
            onClick={() => setPaymentMethod("INSTAPAY")}
            icon={<Smartphone className="size-5" />}
            title={dict.checkout.instapay}
            hint={dict.checkout.instapayHint}
          />
          <PaymentOption
            active={paymentMethod === "VODAFONE_CASH"}
            onClick={() => setPaymentMethod("VODAFONE_CASH")}
            icon={<Smartphone className="size-5" />}
            title={dict.checkout.vodafoneCash}
            hint={dict.checkout.vodafoneCashHint}
          />
          <PaymentOption
            active={paymentMethod === "CARD"}
            onClick={() => setPaymentMethod("CARD")}
            icon={<CreditCard className="size-5" />}
            title={dict.checkout.card}
            hint={dict.checkout.cardHint}
            disabled={!paymentSettings.cardEnabled}
          />

          {/* Payment instructions for InstaPay and Vodafone Cash */}
          {(paymentMethod === "INSTAPAY" ||
            paymentMethod === "VODAFONE_CASH") && (
            <div className="mt-4 space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-primary">
                {dict.checkout.paymentInstructions}
              </h3>

              <div className="flex items-center justify-between rounded-lg bg-background/60 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {dict.checkout.amountToTransfer}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(total)}{" "}
                    <span className="text-sm font-medium">
                      {dict.product.currency}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {dict.checkout.transferTo}
                </p>

                <div className="space-y-2">
                  <AccountRow
                    label={dict.checkout.accountNumber}
                    value={
                      paymentMethod === "INSTAPAY"
                        ? paymentAccounts.instapayNumber
                        : paymentAccounts.vodafoneCashNumber
                    }
                    copiedKey={copiedKey}
                    copyText={copyText}
                    copyLabel={dict.checkout.paymentCopy}
                    copiedLabel={dict.checkout.paymentCopied}
                    dir="ltr"
                    mono
                  />
                  {paymentMethod === "INSTAPAY" && (
                    <AccountRow
                      label={dict.checkout.accountPhone}
                      value={paymentAccounts.instapayPhone}
                      copiedKey={copiedKey}
                      copyText={copyText}
                      copyLabel={dict.checkout.paymentCopy}
                      copiedLabel={dict.checkout.paymentCopied}
                      dir="ltr"
                      mono
                    />
                  )}
                  <AccountRow
                    label={dict.checkout.accountName}
                    value={
                      paymentMethod === "INSTAPAY"
                        ? paymentAccounts.instapayName
                        : locale === "ar"
                          ? paymentAccounts.vodafoneCashNameAr
                          : paymentAccounts.vodafoneCashNameEn
                    }
                    copiedKey={copiedKey}
                    copyText={copyText}
                    copyLabel={dict.checkout.paymentCopy}
                    copiedLabel={dict.checkout.paymentCopied}
                  />
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  {dict.checkout.stepsTitle}
                </p>
                <ol className="space-y-1.5 text-xs text-muted-foreground">
                  {(paymentMethod === "INSTAPAY"
                    ? dict.checkout.stepsInstapay
                    : dict.checkout.stepsVodafone
                  ).map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-xs text-muted-foreground">
                {dict.checkout.paymentPendingHint}
              </p>

              <PaymentProofUpload
                onReceiptChange={setReceiptFile}
                onTransactionRefChange={setTransactionRef}
                labels={{
                  uploadReceipt: dict.checkout.uploadReceipt,
                  uploadReceiptHint: dict.checkout.uploadReceiptHint,
                  uploadBadType: dict.checkout.uploadBadType,
                  uploadTooLarge: dict.checkout.uploadTooLarge,
                  uploadAlt: dict.checkout.uploadAlt,
                  uploadClick: dict.checkout.uploadClick,
                  uploadDragDrop: dict.checkout.uploadDragDrop,
                  uploadFormats: dict.checkout.uploadFormats,
                  transactionRef: dict.checkout.transactionRef,
                  transactionRefHint: dict.checkout.transactionRefHint,
                }}
              />
            </div>
          )}
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
            <li key={cartItemKey(item)} className="flex items-center gap-3">
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
              {shippingFee === 0
                ? dict.cart.shippingFree
                : formatPrice(shippingFee)}
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
    "h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:border-ring placeholder:text-muted-foreground/60",
    hasError ? "border-destructive" : "border-border",
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
      {error && (
        <span
          role="alert"
          className="flex items-start gap-1 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}

function AccountRow({
  label,
  value,
  copiedKey,
  copyText,
  copyLabel,
  copiedLabel,
  dir,
  mono,
}: {
  label: string;
  value: string;
  copiedKey: string | null;
  copyText: (key: string, text: string) => void;
  copyLabel: string;
  copiedLabel: string;
  dir?: "ltr";
  mono?: boolean;
}) {
  const key = `${label}:${value}`;
  const isCopied = copiedKey === key;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}:</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-end font-semibold",
          mono && "font-mono",
        )}
        dir={dir}
      >
        {value || "—"}
      </span>
      {value && (
        <button
          type="button"
          onClick={() => copyText(key, value)}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
            isCopied
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {isCopied ? (
            <>
              <Check className="size-3" />
              {copiedLabel}
            </>
          ) : (
            <>
              <Copy className="size-3" />
              {copyLabel}
            </>
          )}
        </button>
      )}
    </div>
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
