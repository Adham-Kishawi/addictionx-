"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { parseImageAdjust } from "@/lib/image-adjust";
import { storedImageId } from "@/lib/uploads";

// ============================================================
// Home slider management from the dashboard (admin → Slider).
// Slides reference any product in the catalog; each slide may
// override the product's image with a custom one and may carry
// AR/EN caption overrides. `position` drives the slide order and
// `isActive` hides a slide without removing it.
//
// Mutations return a light result — the client mirrors the change
// locally (no reload) and reverts on error.
// ============================================================

export type SliderActionState = {
  error?: string;
  success?: boolean;
  id?: string;
};

// Wraps a mutation so DB failures surface as { error: "GENERIC" } (with a
// logged trace) instead of rejecting the server action silently.
const guard = async (
  fn: () => Promise<SliderActionState>,
): Promise<SliderActionState> => {
  try {
    return await fn();
  } catch (err) {
    console.error("Slider action failed:", err);
    return { error: "GENERIC" };
  }
};

// Only accept relative paths (/api/uploads/..., /slider/...) or http(s) URLs.
const isSafeImage = (v: string) =>
  v === "" ||
  v.startsWith("/") ||
  v.startsWith("http://") ||
  v.startsWith("https://");

const readField = (value: string | undefined, max: number) =>
  (value ?? "").trim().slice(0, max);

type SlideData = {
  image?: string;
  captionAr?: string;
  captionEn?: string;
  imageAdjust?: string;
};

function parseSlideData(data: SlideData): {
  ok: boolean;
  image: string;
  captionAr: string;
  captionEn: string;
  adjust: ReturnType<typeof parseImageAdjust>;
} {
  const image = readField(data.image, 500);
  const captionAr = readField(data.captionAr, 300);
  const captionEn = readField(data.captionEn, 300);
  if (!isSafeImage(image))
    return { ok: false, image, captionAr, captionEn, adjust: null };
  return {
    ok: true,
    image,
    captionAr,
    captionEn,
    adjust: parseImageAdjust(data.imageAdjust),
  };
}

export async function addSlide(
  productId: string,
  data: SlideData,
): Promise<SliderActionState> {
  await requirePermission("products");

  const parsed = parseSlideData(data);
  if (!parsed.ok) return { error: "INVALID_IMAGE" };

  const productIdParsed = z.string().trim().min(1).max(64).safeParse(productId);
  if (!productIdParsed.success) return { error: "INVALID" };
  return guard(async () => {
    const product = await prisma.product.findUnique({
      where: { id: productIdParsed.data },
      select: { id: true },
    });
    if (!product) return { error: "NOT_FOUND" };

    // A product can only appear once in the slider.
    const existing = await prisma.homeSlide.findFirst({
      where: { productId: product.id },
      select: { id: true },
    });
    if (existing) return { error: "DUPLICATE" };

    const last = await prisma.homeSlide.aggregate({ _max: { position: true } });
    const created = await prisma.homeSlide.create({
      data: {
        productId: product.id,
        image: parsed.image || null,
        imageAdjust: parsed.adjust ?? Prisma.DbNull,
        captionAr: parsed.captionAr || null,
        captionEn: parsed.captionEn || null,
        position: (last._max.position ?? 0) + 10,
      },
      select: { id: true },
    });

    revalidatePath("/", "layout");
    return { success: true, id: created.id };
  });
}

export async function updateSlide(
  id: string,
  data: SlideData,
): Promise<SliderActionState> {
  await requirePermission("products");

  const parsed = parseSlideData(data);
  if (!parsed.ok) return { error: "INVALID_IMAGE" };

  return guard(async () => {
    const slide = await prisma.homeSlide.findUnique({ where: { id } });
    if (!slide) return { error: "NOT_FOUND" };

    const oldStoredId = storedImageId(slide.image);
    const newStoredId = storedImageId(parsed.image);

    await prisma.$transaction([
      prisma.homeSlide.update({
        where: { id },
        data: {
          image: parsed.image || null,
          imageAdjust: parsed.adjust ?? Prisma.DbNull,
          captionAr: parsed.captionAr || null,
          captionEn: parsed.captionEn || null,
        },
      }),
      // Clean up the previous upload only when it was replaced with a different image.
      ...(oldStoredId && oldStoredId !== newStoredId
        ? [prisma.uploadedImage.deleteMany({ where: { id: oldStoredId } })]
        : []),
    ]);

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function removeSlide(id: string): Promise<SliderActionState> {
  await requirePermission("products");

  return guard(async () => {
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
  });
}

// Reorder by submitting the full desired order of slide ids. Positions are
// renumbered 10,20,30,… so ties can never occur. Rejected when the submitted
// set does not match the current slides exactly (stale UI guard).
export async function reorderSlides(
  orderedIds: string[],
): Promise<SliderActionState> {
  await requirePermission("products");

  const ids = [...new Set(orderedIds.map((s) => s.trim()).filter(Boolean))];
  return guard(async () => {
    const current = await prisma.homeSlide.findMany({ select: { id: true } });
    const currentIds = current.map((c) => c.id);
    if (
      ids.length !== currentIds.length ||
      ids.some((id) => !currentIds.includes(id)) ||
      currentIds.some((id) => !ids.includes(id))
    ) {
      return { error: "INVALID" };
    }

    await prisma.$transaction(
      ids.map((id, i) =>
        prisma.homeSlide.update({
          where: { id },
          data: { position: (i + 1) * 10 },
        }),
      ),
    );

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function toggleSlideActive(
  id: string,
): Promise<SliderActionState> {
  await requirePermission("products");

  return guard(async () => {
    const slide = await prisma.homeSlide.findUnique({ where: { id } });
    if (!slide) return { error: "NOT_FOUND" };

    await prisma.homeSlide.update({
      where: { id },
      data: { isActive: !slide.isActive },
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
}
