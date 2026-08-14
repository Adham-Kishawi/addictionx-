"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import type { Locale } from "@/lib/i18n/dictionary";

/**
 * Verify a payment proof and mark the order as PAID.
 * Only admins with "orders" permission can verify payments.
 */
export async function verifyPaymentProof(
  proofId: string,
  orderId: string,
  locale: Locale,
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await requirePermission("orders", locale);

  try {
    await prisma.$transaction(async (tx) => {
      // Update the payment proof status
      await tx.paymentProof.update({
        where: { id: proofId },
        data: {
          status: "VERIFIED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
        },
      });

      // Update the order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });

      // Create a transaction record
      await tx.transaction.create({
        data: {
          orderId,
          provider: "manual_verification",
          amount: 0, // Amount is already in the order
          status: "VERIFIED",
        },
      });
    });

    revalidatePath(`/${locale}/admin/payment-verification`);
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${orderId}`);

    return { ok: true };
  } catch (error) {
    console.error("Failed to verify payment proof:", error);
    return { ok: false, error: "VERIFICATION_FAILED" };
  }
}

/**
 * Reject a payment proof with a reason note.
 */
export async function rejectPaymentProof(
  proofId: string,
  rejectionNote: string,
  locale: Locale,
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await requirePermission("orders", locale);

  try {
    await prisma.paymentProof.update({
      where: { id: proofId },
      data: {
        status: "REJECTED",
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        rejectionNote,
      },
    });

    revalidatePath(`/${locale}/admin/payment-verification`);

    return { ok: true };
  } catch (error) {
    console.error("Failed to reject payment proof:", error);
    return { ok: false, error: "REJECTION_FAILED" };
  }
}
