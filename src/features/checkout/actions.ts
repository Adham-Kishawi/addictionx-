"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import {
  orderConfirmationEmail,
  adminNewOrderEmail,
  sendEmail,
  notifyLowStock,
} from "@/lib/email";
import {
  computeShippingFee,
  getPaymentSettings,
  nameFor,
} from "@/lib/shipping";
import { isValidEgyptianPhone } from "@/lib/validation";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import type { CartItem } from "@/stores/cart-store";
import { isLocale, type Locale } from "@/lib/i18n/dictionary";

// ============================================================
// Create an order from the cart.
// - Prices, stock, coupon discount and shipping are all read from the DB.
//   The client's price/coupon/shipping numbers are never trusted.
// - Payment status is recorded server-side only; it is never set from the
//   client (prevents fake/manipulated "paid" states).
// - An idempotencyKey makes double submits safe: a duplicate key reuses the
//   first order instead of placing a second one.
// ============================================================

const inputSchema = z.object({
  locale: z.string().refine(isLocale),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        // Optional: products without variants have no size. When present it
        // must match a real variant of the product (validated against the DB).
        sizeMl: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(50),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).refine(isValidEgyptianPhone, "PHONE"),
  governorateId: z.string().trim().min(1).max(60),
  regionId: z.string().trim().min(1).max(60),
  address: z.string().trim().min(5).max(300),
  paymentMethod: z.enum([
    "CASH_ON_DELIVERY",
    "CARD",
    "WALLET",
    "INSTAPAY",
    "VODAFONE_CASH",
  ]),
  idempotencyKey: z.string().trim().min(8).max(80),
  couponCode: z.string().trim().toUpperCase().optional().default(""),
  receiptData: z.string().optional(),
  transactionRef: z.string().trim().max(100).optional().default(""),
});

export type CreateOrderInput = {
  locale: Locale;
  items: CartItem[];
  name: string;
  phone: string;
  governorateId: string;
  regionId: string;
  address: string;
  paymentMethod:
    "CASH_ON_DELIVERY" | "CARD" | "WALLET" | "INSTAPAY" | "VODAFONE_CASH";
  idempotencyKey: string;
  couponCode?: string;
  receiptData?: string;
  transactionRef?: string;
};

export type CreateOrderResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      discount: number;
      duplicate?: boolean;
    }
  | {
      ok: false;
      error:
        | "GENERIC"
        | "UNAVAILABLE"
        | "STOCK"
        | "COUPON_INVALID"
        | "PAYMENT_UNAVAILABLE"
        | "VALIDATION"
        | "RATE_LIMITED";
    };

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await auth();
  if (!session?.user) {
    redirect(
      `/${input.locale}/login?callbackUrl=${encodeURIComponent(
        `/${input.locale}/checkout`,
      )}`,
    );
  }

  // Rate limit: 10 orders per hour per user
  const rateLimit = await checkRateLimit(
    rateLimiters.order,
    `order:${session.user.id}`,
  );

  if (!rateLimit.success) {
    return { ok: false, error: "RATE_LIMITED" };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }

  const {
    items,
    name,
    phone,
    governorateId,
    regionId,
    address,
    paymentMethod,
    idempotencyKey,
    couponCode,
    receiptData,
    transactionRef,
  } = parsed.data;
  const locale = parsed.data.locale;

  try {
    const paymentSettings = await getPaymentSettings();
    if (
      (paymentMethod === "CARD" && !paymentSettings.cardEnabled) ||
      (paymentMethod === "WALLET" && !paymentSettings.walletEnabled)
    ) {
      return { ok: false, error: "PAYMENT_UNAVAILABLE" };
    }

    const ids = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { variants: { where: { isActive: true } } },
    });

    // Build the order lines with the actual price from the DB — either the
    // selected variant's price or, for variant-less products, the base price.
    const lines: {
      productId: string;
      variantId: string | null;
      productName: string;
      sizeMl: number | null;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    let subtotal = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return { ok: false, error: "UNAVAILABLE" };

      if (item.sizeMl != null) {
        // Strict match on the requested size — never silently charge another size.
        const variant = product.variants.find((v) => v.sizeMl === item.sizeMl);
        if (!variant) return { ok: false, error: "UNAVAILABLE" };

        const lineTotal = variant.price * item.quantity;
        subtotal += lineTotal;
        lines.push({
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          sizeMl: variant.sizeMl,
          unitPrice: variant.price,
          quantity: item.quantity,
          lineTotal,
        });
      } else {
        // Variant-less product: the base price is the selling price and the
        // product-level stock is the only inventory to check.
        const lineTotal = product.basePrice * item.quantity;
        subtotal += lineTotal;
        lines.push({
          productId: product.id,
          variantId: null,
          productName: product.name,
          sizeMl: null,
          unitPrice: product.basePrice,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    if (subtotal <= 0) return { ok: false, error: "GENERIC" };

    // Validate the coupon and compute the discount — from the DB only.
    let discount = 0;
    let appliedCouponCode: string | null = null;
    let couponId: string | null = null;
    let couponMaxUses: number | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      const now = new Date();
      const valid =
        coupon &&
        coupon.isActive &&
        (!coupon.startsAt || coupon.startsAt <= now) &&
        (!coupon.expiresAt || coupon.expiresAt > now) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
        subtotal >= (coupon.minOrderAmount ?? 0);
      if (!valid) return { ok: false, error: "COUPON_INVALID" };
      if (coupon.discountType === "PERCENT") {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      appliedCouponCode = coupon.code;
      couponId = coupon.id;
      couponMaxUses = coupon.maxUses;
    }

    // Shipping is computed from the DB shipping zones (or the flat fallback).
    const quote = await computeShippingFee({
      governorateId,
      regionId,
      subtotal: subtotal - discount,
    });
    const shippingFee = quote.fee;
    const total = subtotal - discount + shippingFee;
    const orderNumber = `ADDX-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const governorateNameAr = quote.governorateAr ?? null;
    const governorateNameEn = quote.governorateEn ?? null;
    const regionNameAr = quote.regionAr ?? null;
    const regionNameEn = quote.regionEn ?? null;

    const govName = nameFor(locale, governorateNameAr, governorateNameEn);
    const regName = nameFor(locale, regionNameAr, regionNameEn);

    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;

    try {
      order = await prisma.$transaction(async (tx) => {
        // Decrement stock atomically — if the stock is insufficient the whole order fails
        for (const line of lines) {
          if (line.variantId) {
            const updated = await tx.productVariant.updateMany({
              where: { id: line.variantId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });
            if (updated.count === 0) {
              throw new Error("STOCK");
            }
          } else {
            // Variant-less product — decrement the product-level stock.
            const updated = await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });
            if (updated.count === 0) {
              throw new Error("STOCK");
            }
          }
        }

        if (couponId) {
          // Atomic maxUses enforcement — the check and increment share one conditional update.
          if (couponMaxUses != null) {
            const updated = await tx.coupon.updateMany({
              where: { id: couponId, usedCount: { lt: couponMaxUses } },
              data: { usedCount: { increment: 1 } },
            });
            if (updated.count === 0) throw new Error("COUPON");
          } else {
            await tx.coupon.update({
              where: { id: couponId },
              data: { usedCount: { increment: 1 } },
            });
          }
        }

        const addressRow = await tx.address.create({
          data: {
            userId: session.user.id,
            fullName: name,
            phone,
            governorate: govName,
            city: regName,
            district: null,
            street: address,
          },
        });

        const created = await tx.order.create({
          data: {
            orderNumber,
            userId: session.user.id,
            status: "PENDING",
            paymentMethod,
            paymentStatus: "PENDING",
            idempotencyKey,
            subtotal,
            shippingFee,
            discount,
            total,
            couponCode: appliedCouponCode,
            addressId: addressRow.id,
            items: { create: lines },
            // Every order gets an immutable audit row — the payment lifecycle is tracked here.
            transactions: {
              create: {
                provider:
                  paymentMethod === "CASH_ON_DELIVERY" ? "COD" : paymentMethod,
                status: "PENDING",
                amount: total,
              },
            },
          },
        });

        // For InstaPay/Vodafone Cash, create PaymentProof if receipt was uploaded
        if (
          (paymentMethod === "INSTAPAY" || paymentMethod === "VODAFONE_CASH") &&
          receiptData
        ) {
          // Save receipt image to UploadedImage
          const buffer = Buffer.from(receiptData.split(",")[1], "base64");
          const mimeType = receiptData.split(";")[0].split(":")[1];

          const uploadedImage = await tx.uploadedImage.create({
            data: {
              data: buffer,
              mimeType,
              isPrivate: true,
              ownerId: session.user.id,
            },
          });

          // Create PaymentProof record
          await tx.paymentProof.create({
            data: {
              orderId: created.id,
              receiptUrl: `/api/uploads/${uploadedImage.id}`,
              transactionRef: transactionRef || null,
              paymentMethod,
              status: "PENDING",
            },
          });
        }

        return created;
      });
    } catch (txErr) {
      // Idempotency: a duplicate submit for the same checkout key reuses the first order.
      if (
        txErr instanceof Error &&
        (txErr as { code?: string }).code === "P2002" &&
        String(
          (txErr as { meta?: { target?: unknown } }).meta?.target ?? "",
        ).includes("idempotencyKey")
      ) {
        const existing = await prisma.order.findUnique({
          where: { idempotencyKey },
          select: { id: true, orderNumber: true, discount: true },
        });
        if (existing) {
          return {
            ok: true,
            orderId: existing.id,
            orderNumber: existing.orderNumber,
            discount: existing.discount,
            duplicate: true,
          };
        }
        return { ok: false, error: "GENERIC" };
      }
      throw txErr;
    }

    revalidatePath("/", "layout");

    const mailInfo = {
      orderNumber: order.orderNumber,
      totalQirsh: order.total,
      items: lines.map((l) => ({
        name: l.productName,
        qty: l.quantity,
        priceQirsh: l.unitPrice,
      })),
    };
    // Notifications never fail the order — they are sent after successful creation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    await Promise.allSettled([
      user?.email
        ? sendEmail({
            to: user.email,
            subject: orderConfirmationEmail(locale).subject(order.orderNumber),
            html: orderConfirmationEmail(locale).html(mailInfo),
          })
        : Promise.resolve(),
      sendEmail({
        to: process.env.ADMIN_EMAIL || siteConfig.adminEmail,
        subject: adminNewOrderEmail(locale).subject(order.orderNumber),
        html: adminNewOrderEmail(locale).html(mailInfo),
      }),
      notifyLowStock(
        lines.filter((l) => l.variantId).map((l) => l.variantId as string),
      ),
    ]);

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      discount,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "STOCK") {
      return { ok: false, error: "STOCK" };
    }
    if (err instanceof Error && err.message === "COUPON") {
      return { ok: false, error: "COUPON_INVALID" };
    }
    console.error("createOrder failed:", err);
    return { ok: false, error: "GENERIC" };
  }
}

// ============================================================
// Instant coupon validation (for the UI) — the final check happens inside createOrder
// ============================================================

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<{
  ok: boolean;
  discount?: number;
  reason?: "INVALID" | "MIN_ORDER" | "EXPIRED" | "NOT_STARTED" | "USES";
}> {
  const parsed = z.string().trim().min(3).max(30).safeParse(code);
  if (!parsed.success) return { ok: false, reason: "INVALID" };

  const coupon = await prisma.coupon.findUnique({
    where: { code: parsed.data.toUpperCase() },
  });
  const now = new Date();
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.expiresAt && coupon.expiresAt <= now)
  ) {
    return { ok: false, reason: "INVALID" };
  }
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: "NOT_STARTED" };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "USES" };
  }
  if (subtotal < (coupon.minOrderAmount ?? 0)) {
    return { ok: false, reason: "MIN_ORDER" };
  }

  let discount: number;
  if (coupon.discountType === "PERCENT") {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return { ok: true, discount };
}
