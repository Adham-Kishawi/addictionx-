"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { getShippingConfig } from "@/lib/store-config";
import {
  orderConfirmationEmail,
  adminNewOrderEmail,
  sendEmail,
  notifyLowStock,
} from "@/lib/email";
import type { CartItem } from "@/stores/cart-store";
import type { Locale } from "@/lib/i18n/dictionary";

// ============================================================
// إنشاء طلب من السلة — الأسعار تُقرأ من الـ DB ولا يُثق في سعر العميل
// ============================================================

const inputSchema = z.object({
  locale: z.string().min(2),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        sizeMl: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(50),
  name: z.string().trim().min(2),
  phone: z
    .string()
    .trim()
    .min(10)
    .regex(/^[0-9+\s-]+$/),
  governorate: z.string().trim().min(1),
  address: z.string().trim().min(5),
  paymentMethod: z.literal("CASH_ON_DELIVERY"),
  couponCode: z.string().trim().toUpperCase().optional().default(""),
});

export type CreateOrderInput = {
  locale: Locale;
  items: CartItem[];
  name: string;
  phone: string;
  governorate: string;
  address: string;
  paymentMethod: "CASH_ON_DELIVERY";
  couponCode?: string;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; discount: number }
  | {
      ok: false;
      error: "GENERIC" | "UNAVAILABLE" | "STOCK" | "COUPON_INVALID";
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

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "GENERIC" };
  }

  const { items, name, phone, governorate, address, couponCode } = parsed.data;
  const config = await getShippingConfig();

  try {
    const ids = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { variants: { where: { isActive: true } } },
    });

    // تجهيز بنود الطلب بسعر الـ variant الفعلي من الـ DB
    const lines: {
      productId: string;
      variantId: string;
      productName: string;
      sizeMl: number;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    let subtotal = 0;
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return { ok: false, error: "UNAVAILABLE" };

      const variant =
        product.variants.find((v) => v.sizeMl === item.sizeMl) ??
        product.variants[0];
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
    }

    // التحقق من الكوبون وحساب الخصم — من الـ DB حصرًا
    let discount = 0;
    let appliedCouponCode: string | null = null;
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      const now = new Date();
      const valid =
        coupon &&
        coupon.isActive &&
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
    }

    const shippingFee =
      subtotal - discount >= config.freeShippingThreshold
        ? 0
        : config.shippingFee;
    const total = subtotal - discount + shippingFee;
    const orderNumber = `ADDX-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      // خصم المخزون بشكل ذرّي — لو المخزون غير كافٍ يُفشل الطلب بالكامل
      for (const line of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new Error("STOCK");
        }
      }

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const addressRow = await tx.address.create({
        data: {
          userId: session.user.id,
          fullName: name,
          phone,
          governorate,
          city: governorate,
          street: address,
        },
      });

      return tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: "PENDING",
          paymentMethod: "CASH_ON_DELIVERY",
          subtotal,
          shippingFee,
          discount,
          total,
          couponCode: appliedCouponCode,
          addressId: addressRow.id,
          items: { create: lines },
        },
      });
    });

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
    // الإشعارات لا تُفشل الطلب أبدًا — تُرسل بعد نجاح الإنشاء
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    await Promise.allSettled([
      user?.email
        ? sendEmail({
            to: user.email,
            subject: `تأكيد طلبك ${order.orderNumber} — ${siteConfig.name}`,
            html: orderConfirmationEmail(mailInfo),
          })
        : Promise.resolve(),
      sendEmail({
        to: process.env.ADMIN_EMAIL || siteConfig.adminEmail,
        subject: `طلب جديد ${order.orderNumber} — ${siteConfig.name}`,
        html: adminNewOrderEmail(mailInfo),
      }),
      notifyLowStock(lines.map((l) => l.variantId)),
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
    return { ok: false, error: "GENERIC" };
  }
}

// ============================================================
// تحقق فوري من الكوبون (للواجهة) — التحقق النهائي يتم داخل createOrder
// ============================================================

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<{
  ok: boolean;
  discount?: number;
  reason?: "INVALID" | "MIN_ORDER" | "EXPIRED" | "USES";
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
