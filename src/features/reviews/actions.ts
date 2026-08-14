"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

// ============================================================
// Product reviews
// - The customer writes a review (one per product — upsert to edit their own review)
// - The review is published only after admin approval (isApproved)
// - After any approved change: rating/reviewsCount are recomputed for the product
// ============================================================

async function recomputeProductStats(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true, isHidden: false },
    _avg: { rating: true },
    _count: true,
  });
  const count = agg._count;
  const avg = agg._avg.rating ?? 0;
  await prisma.product.update({
    where: { id: productId },
    data: {
      reviewsCount: count,
      rating: Math.round(avg * 10) / 10,
    },
  });
}

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  content: z.string().trim().min(3).max(1000),
});

export type ReviewActionState = { error?: string; success?: boolean };

export async function createReview(
  _prev: ReviewActionState | undefined,
  fd: FormData,
): Promise<ReviewActionState> {
  const session = await auth();
  if (!session?.user) return { error: "AUTH" };

  const parsed = reviewSchema.safeParse({
    productId: fd.get("productId"),
    rating: fd.get("rating"),
    title: fd.get("title"),
    content: fd.get("content"),
  });
  if (!parsed.success) return { error: "INVALID" };

  const { productId, rating, title, content } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { error: "INVALID" };

  await prisma.review.upsert({
    where: {
      productId_userId: { productId, userId: session.user.id },
    },
    create: {
      productId,
      userId: session.user.id,
      rating,
      title: title || null,
      content,
      isApproved: false,
    },
    update: {
      rating,
      title: title || null,
      content,
      isApproved: false,
    },
  });

  // If the customer had a previously approved review, editing it revokes the approval → recompute
  await recomputeProductStats(productId);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function moderateReview(
  reviewId: string,
  approved: boolean,
): Promise<void> {
  await requirePermission("reviews");
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { productId: true },
  });
  if (!review) return;
  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: approved },
  });
  await recomputeProductStats(review.productId);
  revalidatePath("/", "layout");
}

export async function deleteReview(reviewId: string): Promise<void> {
  await requirePermission("reviews");
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { productId: true },
  });
  if (!review) return;
  await prisma.review.delete({ where: { id: reviewId } });
  await recomputeProductStats(review.productId);
  revalidatePath("/", "layout");
}

export async function toggleReviewVisibility(
  reviewId: string,
): Promise<void> {
  await requirePermission("reviews");
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { isHidden: true, productId: true },
  });
  if (!review) return;
  await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: !review.isHidden },
  });
  await recomputeProductStats(review.productId);
  revalidatePath("/", "layout");
}
