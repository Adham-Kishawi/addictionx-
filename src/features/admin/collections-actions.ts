"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

// ============================================================
// Collections management from the dashboard (add / edit / delete)
// Product.collection is just a text slug — no FK so readers never break.
// Deleting a collection is FREE: the admin chooses what happens to its
// products — move them to another collection, or delete them entirely
// (products tied to orders are hidden instead of hard-deleted so order
// history stays intact).
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
  image: z.string().trim().max(500).optional().default(""),
  descriptionAr: z.string().trim().max(300).optional().default(""),
  descriptionEn: z.string().trim().max(300).optional().default(""),
});

export type CollectionActionState = {
  error?: string;
  success?: boolean;
  movedCount?: number;
  deletedCount?: number;
  hiddenCount?: number;
};

// Returns the UploadedImage id for a DB-backed image URL, or null for static assets.
const storedImageId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const m = url.match(/^\/api\/uploads\/([^/?#]+)$/);
  return m ? m[1] : null;
};

function readCollectionForm(fd: FormData) {
  return collectionSchema.parse({
    nameAr: fd.get("nameAr"),
    nameEn: fd.get("nameEn"),
    slug: fd.get("slug"),
    image: fd.get("image") || "",
    descriptionAr: fd.get("descriptionAr") || "",
    descriptionEn: fd.get("descriptionEn") || "",
  });
}

export async function createCollection(
  _prev: CollectionActionState | undefined,
  fd: FormData,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  let parsed;
  try {
    parsed = readCollectionForm(fd);
  } catch {
    return { error: "INVALID" };
  }
  const { nameAr, nameEn, slug, image, descriptionAr, descriptionEn } = parsed;

  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) return { error: "SLUG_TAKEN" };

  await prisma.collection.create({
    data: {
      nameAr,
      nameEn,
      slug,
      image: image || null,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

// Slug is the product link (Product.collection holds it as text) so it is
// immutable once created — only the names / image / descriptions are editable.
export async function updateCollection(
  slug: string,
  _prev: CollectionActionState | undefined,
  fd: FormData,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  let parsed;
  try {
    parsed = collectionSchema.omit({ slug: true }).safeParse({
      nameAr: fd.get("nameAr"),
      nameEn: fd.get("nameEn"),
      image: fd.get("image") || "",
      descriptionAr: fd.get("descriptionAr") || "",
      descriptionEn: fd.get("descriptionEn") || "",
    });
    if (!parsed.success) return { error: "INVALID" };
  } catch {
    return { error: "INVALID" };
  }

  const { nameAr, nameEn, image, descriptionAr, descriptionEn } = parsed.data;

  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (!existing) return { error: "NOT_FOUND" };

  await prisma.collection.update({
    where: { slug },
    data: {
      nameAr,
      nameEn,
      image: image || null,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Home slider slide management — reorder + show/hide.
// The home slider is built from the collections (one slide each), so the
// dashboard controls the slide order (sortOrder) and which slides appear at
// all (isActive).
// ============================================================

export async function reorderCollection(
  slug: string,
  direction: "up" | "down",
): Promise<CollectionActionState> {
  await requirePermission("collections");

  const list = await prisma.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { slug: true },
  });
  const index = list.findIndex((c) => c.slug === slug);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) {
    return { error: "INVALID" };
  }

  // Swap the positions, then renumber every row 10,20,30,… in one transaction.
  // Renumbering (instead of swapping two values) keeps the order consistent
  // even when collections share the same sortOrder.
  [list[index], list[swapWith]] = [list[swapWith], list[index]];

  await prisma.$transaction(
    list.map((c, i) =>
      prisma.collection.update({
        where: { slug: c.slug },
        data: { sortOrder: (i + 1) * 10 },
      }),
    ),
  );

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleCollectionActive(
  slug: string,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) return { error: "NOT_FOUND" };

  await prisma.collection.update({
    where: { slug },
    data: { isActive: !collection.isActive },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

// Free deletion. When the collection has products the caller must tell us what
// to do with them:
//   { moveTo: "<targetSlug>" }        → move its products to another collection
//   { deleteProducts: true }          → delete them (order-linked ones are hidden)
// Passing neither while products exist returns { error: "NEED_CHOICE" } so the
// UI can offer the two options.
export async function deleteCollection(
  slug: string,
  opts: { moveTo?: string; deleteProducts?: boolean } = {},
): Promise<CollectionActionState> {
  await requirePermission("collections");

  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) return { error: "NOT_FOUND" };

  const products = await prisma.product.findMany({
    where: { collection: slug },
    select: { id: true, slug: true },
  });

  if (products.length > 0) {
    if (opts.moveTo && opts.moveTo !== slug) {
      const target = await prisma.collection.findUnique({
        where: { slug: opts.moveTo },
        select: { id: true },
      });
      if (!target) return { error: "TARGET_NOT_FOUND" };
      await prisma.product.updateMany({
        where: { collection: slug },
        data: { collection: opts.moveTo },
      });
    } else if (opts.deleteProducts) {
      const productIds = products.map((p) => p.id);
      const ordered = await prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true },
      });
      const orderedIds = new Set(ordered.map((o) => o.productId));
      const deletable = products.filter((p) => !orderedIds.has(p.id));
      const hidden = products.filter((p) => orderedIds.has(p.id));

      if (deletable.length > 0) {
        const deletableIds = deletable.map((p) => p.id);
        const imageRows = await prisma.productImage.findMany({
          where: { productId: { in: deletableIds } },
        });
        const storedIds = imageRows
          .map((img) => storedImageId(img.url))
          .filter((v): v is string => Boolean(v));

        await prisma.$transaction([
          prisma.productVariant.deleteMany({
            where: { productId: { in: deletableIds } },
          }),
          prisma.product.deleteMany({ where: { id: { in: deletableIds } } }),
          ...(storedIds.length > 0
            ? [
                prisma.uploadedImage.deleteMany({
                  where: { id: { in: storedIds } },
                }),
              ]
            : []),
        ]);
      }

      // Products that appear in orders cannot be hard-deleted (order history
      // keeps a reference) — they are hidden so they vanish from the store.
      if (hidden.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: hidden.map((p) => p.id) } },
          data: { isActive: false },
        });
      }
    } else {
      return { error: "NEED_CHOICE", movedCount: products.length };
    }
  }

  // Clean up the collection's own stored image (if it was an upload).
  const storedImage = storedImageId(collection.image);
  await prisma.$transaction([
    prisma.collection.delete({ where: { slug } }),
    ...(storedImage
      ? [prisma.uploadedImage.deleteMany({ where: { id: storedImage } })]
      : []),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}
