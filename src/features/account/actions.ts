"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderCancelledEmail, sendEmail } from "@/lib/email";

async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user.id;
}

export async function toggleWishlist(productId: string) {
  const userId = await requireUser();

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
  }

  revalidatePath("/", "layout");
}

export async function removeWishlistItem(productId: string) {
  const userId = await requireUser();
  await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });
  revalidatePath("/", "layout");
}

// ============================================================
// Customer addresses (CRUD) — personal account
// ============================================================

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  governorate: z.string().trim().min(1).max(60),
  city: z.string().trim().min(1).max(60),
  district: z.string().trim().max(60),
  street: z.string().trim().min(1).max(100),
  building: z.string().trim().max(40),
  apartment: z.string().trim().max(40),
  landmark: z.string().trim().max(100),
  isDefault: z.coerce.boolean().default(false),
});

type AddressState = { error?: string; success?: boolean };

function toAddressData(data: z.infer<typeof addressSchema>) {
  const { isDefault, ...fields } = data;
  return {
    ...fields,
    district: fields.district || null,
    building: fields.building || null,
    apartment: fields.apartment || null,
    landmark: fields.landmark || null,
    isDefault,
  };
}

export async function createAddress(
  _prev: AddressState | undefined,
  fd: FormData,
): Promise<AddressState> {
  const userId = await requireUser();
  const parsed = addressSchema.safeParse({
    fullName: fd.get("fullName"),
    phone: fd.get("phone"),
    governorate: fd.get("governorate"),
    city: fd.get("city"),
    district: fd.get("district"),
    street: fd.get("street"),
    building: fd.get("building"),
    apartment: fd.get("apartment"),
    landmark: fd.get("landmark"),
    isDefault: fd.get("isDefault"),
  });
  if (!parsed.success) return { error: "INVALID" };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: { userId, ...toAddressData(parsed.data) },
    });
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateAddress(
  addressId: string,
  _prev: AddressState | undefined,
  fd: FormData,
): Promise<AddressState> {
  const userId = await requireUser();
  const parsed = addressSchema.safeParse({
    fullName: fd.get("fullName"),
    phone: fd.get("phone"),
    governorate: fd.get("governorate"),
    city: fd.get("city"),
    district: fd.get("district"),
    street: fd.get("street"),
    building: fd.get("building"),
    apartment: fd.get("apartment"),
    landmark: fd.get("landmark"),
    isDefault: fd.get("isDefault"),
  });
  if (!parsed.success) return { error: "INVALID" };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const result = await tx.address.updateMany({
      where: { id: addressId, userId },
      data: toAddressData(parsed.data),
    });
    if (result.count === 0) throw new Error("NOT_OWNED");
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAddress(addressId: string): Promise<void> {
  const userId = await requireUser();
  await prisma.address.deleteMany({ where: { id: addressId, userId } });
  revalidatePath("/", "layout");
}

// ============================================================
// Order cancellation (customer)
// - Only the order owner, and only while the order is PENDING
// - Reverse of createOrder: return the order to CANCELLED + restore stock
// ============================================================

export async function cancelOrder(orderId: string): Promise<{
  error?: "NOT_FOUND" | "NOT_CANCELLABLE" | "GENERIC";
  success?: boolean;
}> {
  const userId = await requireUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      status: true,
      orderNumber: true,
      user: { select: { email: true } },
    },
  });
  if (!order || order.userId !== userId) return { error: "NOT_FOUND" };
  if (order.status !== "PENDING") return { error: "NOT_CANCELLABLE" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      await tx.shipment.deleteMany({ where: { orderId } });

      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { variantId: true, quantity: true },
      });
      for (const item of items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  } catch {
    return { error: "GENERIC" };
  }

  revalidatePath("/", "layout");

  if (order.user?.email) {
    await sendEmail({
      to: order.user.email,
      subject: `إلغاء الطلب ${order.orderNumber}`,
      html: orderCancelledEmail(order.orderNumber),
    });
  }

  return { success: true };
}
