import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  User as UserIcon,
  CreditCard,
  Truck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import {
  statusLabel,
  statusStyles,
  canTransition,
} from "@/features/admin/status";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { ShipmentForm } from "@/components/admin/shipment-form";
import { CancelOrderButton } from "@/components/admin/cancel-order-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("orders", locale);
  const dict = getDictionary(locale);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: true,
      shipment: true,
    },
  });
  if (!order) notFound();

  const paymentLabel =
    order.paymentMethod === "CASH_ON_DELIVERY"
      ? dict.checkout.cashOnDelivery
      : order.paymentMethod === "CARD"
        ? dict.checkout.card
        : order.paymentMethod;

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/${locale}/admin/orders`}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4 rtl:rotate-180" />
          {dict.admin.backToOrders}
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
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[order.status]}`}
          >
            {statusLabel(dict.admin, order.status)}
          </span>
          <OrderStatusSelect
            orderId={order.id}
            status={order.status}
            dict={dict}
          />
          {canTransition(order.status, "CANCELLED") && (
            <CancelOrderButton
              orderId={order.id}
              label={dict.admin.cancelOrder}
              confirmLabel={dict.admin.cancelOrderConfirm}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Customer and address */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserIcon className="size-4 text-primary" />
            {dict.admin.customer}
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="text-foreground">
              {order.user?.name ?? order.address?.fullName ?? "—"}
            </span>
            <span dir="ltr" className="text-start">
              {order.user?.email ?? order.address?.phone ?? "—"}
            </span>
          </div>

          {order.address && (
            <div className="flex flex-col gap-1 border-t border-border/60 pt-3 text-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {dict.checkout.shippingInfo}
              </div>
              <span>{order.address.fullName}</span>
              <span>
                {order.address.governorate} — {order.address.city}
              </span>
              <span>{order.address.street}</span>
              <span dir="ltr" className="text-start text-xs">
                {order.address.phone}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-sm">
            <CreditCard className="size-4 text-primary" />
            <span className="text-muted-foreground">
              {dict.admin.paymentMethod}:
            </span>
            <span className="font-medium">{paymentLabel}</span>
            {order.paymentMethod !== "CASH_ON_DELIVERY" && (
              <span
                className={cn(
                  "ms-auto rounded-full px-2.5 py-0.5 text-xs font-medium",
                  order.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : order.paymentStatus === "FAILED" ||
                        order.paymentStatus === "REFUNDED"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-yellow-500/10 text-yellow-600",
                )}
              >
                {paymentStatusLabel(dict.admin, order.paymentStatus)}
              </span>
            )}
            {order.paidAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(order.paidAt).toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-EG",
                  { dateStyle: "medium", timeStyle: "short" },
                )}
              </span>
            )}
          </div>
        </section>

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
          {order.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-destructive">
              <span className="text-muted-foreground line-through">
                {dict.cart.subtotal}
              </span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <span className="font-medium">{dict.cart.total}</span>
            <span className="font-display text-xl font-bold text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
          {order.notes && (
            <div className="flex flex-col gap-1 border-t border-border/60 pt-3 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">
                {dict.admin.orderNotes}
              </span>
              <span>{order.notes}</span>
            </div>
          )}
        </section>
      </div>

      {/* Shipment */}
      <section className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Truck className="size-4 text-primary" />
          {dict.admin.shipment}
          {order.shipment && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                order.shipment.status === "DELIVERED"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-cyan-500/10 text-cyan-500"
              }`}
            >
              {shipmentLabel(dict, order.shipment.status)}
            </span>
          )}
        </div>

        {order.shipment ? (
          <ShipmentForm
            orderId={order.id}
            initialCarrier={order.shipment.carrier}
            initialTracking={order.shipment.trackingNumber ?? ""}
            dict={dict}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {dict.admin.shipmentEmpty}
            </p>
            <ShipmentForm
              orderId={order.id}
              initialCarrier="Bosta"
              initialTracking=""
              dict={dict}
            />
          </div>
        )}
      </section>

      {/* Items */}
      <section className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="mb-4 text-sm font-semibold">
          {dict.admin.items}
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
    </div>
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
  admin: ReturnType<typeof getDictionary>["admin"],
  status: string,
) {
  switch (status) {
    case "PAID":
      return admin.paymentStatusPaid;
    case "FAILED":
      return admin.paymentStatusFailed;
    case "REFUNDED":
      return admin.paymentStatusRefunded;
    default:
      return admin.paymentStatusPending;
  }
}
