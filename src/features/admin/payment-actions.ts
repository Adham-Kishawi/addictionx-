"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { paymentStatusEmail, sendEmail } from "@/lib/email";
import type { Locale } from "@/lib/i18n/dictionary";

const rejectionNoteSchema = z.string().trim().min(1).max(500).default("");

/**
 * Verify a payment proof and mark the order as PAID.
 * Only admins with "orders" permission can verify payments.
 * Uses conditional updates so a proof can only be processed once —
 * a second click, a stale tab, or a race cannot double-verify.
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
    let customerEmail: string | undefined;
    let orderNumber: string | undefined;

    await prisma.$transaction(async (tx) => {
      // Only a PENDING proof can be verified — guards against double-processing
      const proof = await tx.paymentProof.updateMany({
        where: { id: proofId, orderId, status: "PENDING" },
        data: {
          status: "VERIFIED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
        },
      });
      if (proof.count === 0) {
        throw new Error("ALREADY_PROCESSED");
      }

      const order = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: { not: "PAID" } },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
        },
      });
      if (order.count === 0) {
        throw new Error("ALREADY_PAID");
      }

      const orderRow = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          user: { select: { email: true } },
        },
      });
      orderNumber = orderRow?.orderNumber;
      customerEmail = orderRow?.user?.email ?? undefined;

      await tx.transaction.create({
        data: {
          orderId,
          provider: "manual_verification",
          amount: 0, // Amount is already in the order
          status: "VERIFIED",
        },
      });
    });

    // Customer notification — never fails the admin action
    if (customerEmail && orderNumber) {
      await sendEmail({
        to: customerEmail,
        subject: paymentStatusEmail(locale).subject(orderNumber),
        html: paymentStatusEmail(locale).html({
          orderNumber,
          status: "PAID",
        }),
      }).catch(() => {});
    }

    revalidatePath(`/${locale}/admin/payment-verification`);
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${orderId}`);
    revalidatePath(`/${locale}/account/orders/${orderId}`);

    return { ok: true };
  } catch (error) {
    console.error("Failed to verify payment proof:", error);
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return { ok: false, error: "ALREADY_PROCESSED" };
    }
    return { ok: false, error: "VERIFICATION_FAILED" };
  }
}

/**
 * Reject a payment proof with a reason note.
 * Uses a conditional update so the proof can only be processed once.
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

  const parsedNote = rejectionNoteSchema.parse(rejectionNote);

  try {
    let customerEmail: string | undefined;
    let orderNumber: string | undefined;

    await prisma.$transaction(async (tx) => {
      const proof = await tx.paymentProof.updateMany({
        where: { id: proofId, status: "PENDING" },
        data: {
          status: "REJECTED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          rejectionNote: parsedNote,
        },
      });
      if (proof.count === 0) {
        throw new Error("ALREADY_PROCESSED");
      }

      const row = await tx.paymentProof.findUnique({
        where: { id: proofId },
        select: {
          orderId: true,
          order: {
            select: { orderNumber: true, user: { select: { email: true } } },
          },
        },
      });
      orderNumber = row?.order?.orderNumber;
      customerEmail = row?.order?.user?.email ?? undefined;

      if (row?.orderId) {
        await tx.transaction.create({
          data: {
            orderId: row.orderId,
            provider: "manual_verification",
            amount: 0,
            status: "REJECTED",
          },
        });
      }
    });

    // Customer notification — never fails the admin action
    if (customerEmail && orderNumber) {
      await sendEmail({
        to: customerEmail,
        subject: paymentStatusEmail(locale).subject(orderNumber),
        html: paymentStatusEmail(locale).html({
          orderNumber,
          status: "REJECTED",
          rejectionNote: parsedNote,
        }),
      }).catch(() => {});
    }

    revalidatePath(`/${locale}/admin/payment-verification`);
    revalidatePath(`/${locale}/admin/orders`);
    if (orderNumber) {
      revalidatePath(`/${locale}/admin/orders/${orderNumber}`);
    }

    return { ok: true };
  } catch (error) {
    console.error("Failed to reject payment proof:", error);
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return { ok: false, error: "ALREADY_PROCESSED" };
    }
    return { ok: false, error: "REJECTION_FAILED" };
  }
}
