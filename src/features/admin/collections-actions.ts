"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ============================================================
// Collections management from the dashboard (add / delete)
// Product.collection is just a text slug — no FK so readers never break
// ============================================================

const collectionSchema = z.object({
  nameAr: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "INVALID_SLUG"),
});

export type CollectionActionState = {
  error?: string;
  success?: boolean;
};

export async function createCollection(
  _prev: CollectionActionState | undefined,
  fd: FormData,
): Promise<CollectionActionState> {
  const parsed = collectionSchema.safeParse({
    nameAr: fd.get("nameAr"),
    nameEn: fd.get("nameEn"),
    slug: fd.get("slug"),
  });
  if (!parsed.success) return { error: "INVALID" };

  const { nameAr, nameEn, slug } = parsed.data;

  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) return { error: "SLUG_TAKEN" };

  await prisma.collection.create({
    data: { nameAr, nameEn, slug },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

// Deletion is allowed only for empty collections — if it has products we ask
// to move them to another collection first so they don't disappear from "All products".
export async function deleteCollection(slug: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  const productsCount = await prisma.product.count({
    where: { collection: slug },
  });
  if (productsCount > 0) return { error: "NOT_EMPTY" };

  await prisma.collection.delete({ where: { slug } });
  revalidatePath("/", "layout");
  return { success: true };
}
