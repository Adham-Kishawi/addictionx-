"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

// ============================================================
// Home slider management from the dashboard (admin → Slider).
// Slides reference any product in the catalog; each slide may
// override the product's image with a custom one and may carry
// AR/EN caption overrides. `position` drives the slide order and
// `isActive` hides a slide without removing it.
// ============================================================

export type SliderActionState = {
  error?: string;
  success?: boolean;
};

// Returns the UploadedImage id for a DB-backed image URL, or null for static assets.
const storedImageId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const m = url.match(/^\/api\/uploads\/([^/?#]+)$/);
  return m ? m[1] : null;
};

export async function addSlide(
  productId: string,
  data: { image?: string; captionAr?: string; captionEn?: string },
): Promise<SliderActionState> {
  await requirePermission("products");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { error: "NOT_FOUND" };

  const image = z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .parse(data.image ?? "");
  const captionAr = z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .parse(data.captionAr ?? "");
  const captionEn = z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .parse(data.captionEn ?? "");

  const last = await prisma.homeSlide.aggregate({ _max: { position: true } });
  await prisma.homeSlide.create({
    data: {
      productId,
      image: image || null,
      captionAr: captionAr || null,
      captionEn: captionEn || null,
      position: (last._max.position ?? 0) + 10,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateSlide(
  id: string,
  data: { image?: string; captionAr?: string; captionEn?: string },
): Promise<SliderActionState> {
  await requirePermission("products");

  const slide = await prisma.homeSlide.findUnique({ where: { id } });
  if (!slide) return { error: "NOT_FOUND" };

  const image = z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .parse(data.image ?? "");
  const captionAr = z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .parse(data.captionAr ?? "");
  const captionEn = z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .parse(data.captionEn ?? "");

  const oldStoredId = storedImageId(slide.image);
  const newStoredId = storedImageId(image);

  await prisma.$transaction([
    prisma.homeSlide.update({
      where: { id },
      data: {
        image: image || null,
        captionAr: captionAr || null,
        captionEn: captionEn || null,
      },
    }),
    // Clean up the previous upload only when it was replaced with a different image.
    ...(oldStoredId && oldStoredId !== newStoredId
      ? [prisma.uploadedImage.deleteMany({ where: { id: oldStoredId } })]
      : []),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeSlide(id: string): Promise<SliderActionState> {
  await requirePermission("products");

  const slide = await prisma.homeSlide.findUnique({ where: { id } });
  if (!slide) return { error: "NOT_FOUND" };

  const storedId = storedImageId(slide.image);
  await prisma.$transaction([
    prisma.homeSlide.delete({ where: { id } }),
    ...(storedId
      ? [prisma.uploadedImage.deleteMany({ where: { id: storedId } })]
      : []),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function reorderSlide(
  id: string,
  direction: "up" | "down",
): Promise<SliderActionState> {
  await requirePermission("products");

  const list = await prisma.homeSlide.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const index = list.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) {
    return { error: "INVALID" };
  }

  // Swap the positions, then renumber every row 10,20,30,… in one transaction
  // so the order stays consistent even when slides share a position.
  [list[index], list[swapWith]] = [list[swapWith], list[index]];

  await prisma.$transaction(
    list.map((s, i) =>
      prisma.homeSlide.update({
        where: { id: s.id },
        data: { position: (i + 1) * 10 },
      }),
    ),
  );

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleSlideActive(
  id: string,
): Promise<SliderActionState> {
  await requirePermission("products");

  const slide = await prisma.homeSlide.findUnique({ where: { id } });
  if (!slide) return { error: "NOT_FOUND" };

  await prisma.homeSlide.update({
    where: { id },
    data: { isActive: !slide.isActive },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
