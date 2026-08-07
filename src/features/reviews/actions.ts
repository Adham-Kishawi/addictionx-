"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// تقييمات المنتجات
// - العميل يكتب تقييمًا (مرة واحدة لكل منتج — upsert لتعديل تقييمه)
// - التقييم يُنشر فقط بعد موافقة الأدمن (isApproved)
// - عند أي تغيير معتمد: يُعاد حساب rating/reviewsCount للمنتج
// ============================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");
}

async function recomputeProductStats(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
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

  // لو كان للعميل تقييم معتمد سابقًا، تعديله يوقف اعتماده → يعاد الحساب
  await recomputeProductStats(productId);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function moderateReview(
  reviewId: string,
  approved: boolean,
): Promise<void> {
  await requireAdmin();
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
  await requireAdmin();
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { productId: true },
  });
  if (!review) return;
  await prisma.review.delete({ where: { id: reviewId } });
  await recomputeProductStats(review.productId);
  revalidatePath("/", "layout");
}
