import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, MapPin, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import { CancelOrderButton } from "@/features/account/components/cancel-order-button";
import { statusLabel, statusStyles } from "@/features/admin/status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const session = await auth();
  if (!session?.user) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/account`)}`,
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      address: true,
      items: true,
      shipment: true,
    },
  });
  if (!order || order.userId !== session.user.id) notFound();

  const paymentLabel =
    order.paymentMethod === "CASH_ON_DELIVERY"
      ? dict.checkout.cashOnDelivery
      : order.paymentMethod === "CARD"
        ? dict.checkout.card
        : order.paymentMethod;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/${locale}/account`}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4 rtl:rotate-180" />
          {dict.account.tabOrders}
        </Link>
        <span>/</span>
        <span dir="ltr">#{order.orderNumber}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" dir="ltr">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString(
              locale === "ar" ? "ar-EG" : "en-EG",
              { dateStyle: "long", timeStyle: "short" },
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}
          >
            {statusLabel(dict.admin, order.status)}
          </span>
          {order.status === "PENDING" && (
            <CancelOrderButton orderId={order.id} dict={dict} />
          )}
        </div>
      </div>

      {/* Shipment tracking */}
      <section className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-primary" />
          {dict.account.tracking}
        </div>
        {order.shipment ? (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {dict.account.carrier}
              </span>
              <span className="font-medium">{order.shipment.carrier}</span>
            </div>
            {order.shipment.trackingNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {dict.account.trackingNumber}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium" dir="ltr">
                    {order.shipment.trackingNumber}
                  </span>
                  {(() => {
                    const carrier = (
                      order.shipment.carrier ?? ""
                    ).toLowerCase();
                    const tn = encodeURIComponent(
                      order.shipment.trackingNumber,
                    );
                    if (carrier.includes("bosta")) {
                      return (
                        <a
                          href={`https://app.bosta.co/tracking?trackingNumber=${tn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {dict.account.trackBosta}
                        </a>
                      );
                    }
                    if (carrier.includes("aramex")) {
                      return (
                        <a
                          href={`https://www.aramex.com/us/en/track/results?ShipmentNumber=${tn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {dict.account.trackAramex}
                        </a>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{dict.admin.status}</span>
              <span className="font-medium">
                {shipmentLabel(dict, order.shipment.status)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dict.account.noShipmentYet}
          </p>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Address */}
        {order.address && (
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-primary" />
              {dict.account.deliveryAddress}
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span className="text-foreground">{order.address.fullName}</span>
              <span>
                {order.address.governorate} — {order.address.city}
              </span>
              <span>{order.address.street}</span>
              <span dir="ltr" className="text-start text-xs">
                {order.address.phone}
              </span>
            </div>
          </section>
        )}

        {/* Summary */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="text-sm font-semibold">
            {dict.checkout.orderSummary}
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{dict.admin.subtotal}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {dict.admin.shippingFee}
            </span>
            <span>{formatPrice(order.shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span className="font-medium">{dict.cart.total}</span>
            <span className="font-display text-xl font-bold text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {dict.admin.paymentMethod}:
            </span>
            <span className="font-medium">{paymentLabel}</span>
          </div>
          {order.paymentMethod !== "CASH_ON_DELIVERY" && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {dict.admin.paymentStatus}:
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : order.paymentStatus === "FAILED" ||
                        order.paymentStatus === "REFUNDED"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-yellow-500/10 text-yellow-600",
                )}
              >
                {paymentStatusLabel(dict.checkout, order.paymentStatus)}
              </span>
            </div>
          )}
          {order.paidAt && (
            <p className="text-xs text-muted-foreground">
              {dict.checkout.paymentStatusPaid}:{" "}
              {new Date(order.paidAt).toLocaleString(
                locale === "ar" ? "ar-EG" : "en-EG",
                { dateStyle: "medium", timeStyle: "short" },
              )}
            </p>
          )}
        </section>
      </div>

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="mb-4 text-sm font-semibold">
          {dict.account.orderItems}
          <span className="ms-2 text-muted-foreground">
            ({order.items.length})
          </span>
        </h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sizeMl ? `${item.sizeMl}ml` : "—"} ·{" "}
                  {dict.admin.quantity}: {item.quantity}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="font-medium">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function shipmentLabel(dict: ReturnType<typeof getDictionary>, status: string) {
  switch (status) {
    case "SHIPPED":
      return dict.admin.shipmentStatusShipped;
    case "IN_TRANSIT":
      return dict.admin.shipmentStatusInTransit;
    case "OUT_FOR_DELIVERY":
      return dict.admin.shipmentStatusOutForDelivery;
    case "DELIVERED":
      return dict.admin.shipmentStatusDelivered;
    default:
      return dict.admin.shipmentStatusCreated;
  }
}

function paymentStatusLabel(
  checkout: ReturnType<typeof getDictionary>["checkout"],
  status: string,
) {
  switch (status) {
    case "PAID":
      return checkout.paymentStatusPaid;
    case "FAILED":
      return checkout.paymentStatusFailed;
    case "REFUNDED":
      return checkout.paymentStatusRefunded;
    default:
      return checkout.paymentStatusPending;
  }
}
