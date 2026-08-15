"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { parseImageAdjust } from "@/lib/image-adjust";
import { storedImageId } from "@/lib/uploads";

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
  imageAdjust: z.string().trim().max(200).optional().default(""),
});

export type CollectionActionState = {
  error?: string;
  success?: boolean;
  movedCount?: number;
  deletedCount?: number;
  hiddenCount?: number;
};

// Wraps a mutation so DB failures surface as { error: "GENERIC" } (with a
// logged trace) instead of rejecting the server action silently.
const guard = async (
  fn: () => Promise<CollectionActionState>,
): Promise<CollectionActionState> => {
  try {
    return await fn();
  } catch (err) {
    console.error("Collection action failed:", err);
    return { error: "GENERIC" };
  }
};

function readCollectionForm(fd: FormData) {
  return collectionSchema.parse({
    nameAr: fd.get("nameAr"),
    nameEn: fd.get("nameEn"),
    slug: fd.get("slug"),
    image: fd.get("image") || "",
    descriptionAr: fd.get("descriptionAr") || "",
    descriptionEn: fd.get("descriptionEn") || "",
    imageAdjust: fd.get("imageAdjust") || "",
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
  const {
    nameAr,
    nameEn,
    slug,
    image,
    descriptionAr,
    descriptionEn,
    imageAdjust,
  } = parsed;
  const adjust = parseImageAdjust(imageAdjust);

  return guard(async () => {
    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (existing) return { error: "SLUG_TAKEN" };

    await prisma.collection.create({
      data: {
        nameAr,
        nameEn,
        slug,
        image: image || null,
        imageAdjust: adjust ?? Prisma.DbNull,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
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
      imageAdjust: fd.get("imageAdjust") || "",
    });
    if (!parsed.success) return { error: "INVALID" };
  } catch {
    return { error: "INVALID" };
  }

  const { nameAr, nameEn, image, descriptionAr, descriptionEn, imageAdjust } =
    parsed.data;
  const adjust = parseImageAdjust(imageAdjust);

  return guard(async () => {
    const existing = await prisma.collection.findUnique({ where: { slug } });
    if (!existing) return { error: "NOT_FOUND" };

    await prisma.collection.update({
      where: { slug },
      data: {
        nameAr,
        nameEn,
        image: image || null,
        imageAdjust: adjust ?? Prisma.DbNull,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
}

// ============================================================
// Site-wide visibility — hides a collection from the whole site
// (home section, collections hub, footer) without deleting it.
// ============================================================

export async function toggleCollectionActive(
  slug: string,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  return guard(async () => {
    const collection = await prisma.collection.findUnique({ where: { slug } });
    if (!collection) return { error: "NOT_FOUND" };

    await prisma.collection.update({
      where: { slug },
      data: { isActive: !collection.isActive },
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
}

// ============================================================
// Home "Our Collections" section — dashboard controls that mirror
// the product slider manager: pick which collections appear on the
// home page (showInHome), reorder them with drag & drop, hide/show
// them and edit their image + captions. `isActive` (site-wide) is
// untouched here — a collection can be in the home section while
// staying hidden from the rest of the site, or vice versa.
// ============================================================

export async function reorderCollections(
  orderedSlugs: string[],
): Promise<CollectionActionState> {
  await requirePermission("collections");

  const unique = [...new Set(orderedSlugs)];
  if (unique.length < 2 || unique.length !== orderedSlugs.length) {
    return { error: "INVALID" };
  }
  return guard(async () => {
    const existing = await prisma.collection.findMany({
      select: { slug: true },
    });
    const known = new Set(existing.map((c) => c.slug));
    if (unique.some((slug) => !known.has(slug))) return { error: "INVALID" };

    // Renumber every row 10,20,30,… in one transaction so the order stays
    // consistent even when collections share the same sortOrder.
    await prisma.$transaction(
      unique.map((slug, i) =>
        prisma.collection.update({
          where: { slug },
          data: { sortOrder: (i + 1) * 10 },
        }),
      ),
    );

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function addCollectionToHome(
  slug: string,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  return guard(async () => {
    const collection = await prisma.collection.findUnique({ where: { slug } });
    if (!collection) return { error: "NOT_FOUND" };

    await prisma.collection.update({
      where: { slug },
      data: { showInHome: true },
    });

    // Renumber so the freshly-added collection lands last with a clean order.
    const home = await prisma.collection.findMany({
      where: { showInHome: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { slug: true },
    });
    await renumberCollections(home.map((c) => c.slug));

    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function removeCollectionFromHome(
  slug: string,
): Promise<CollectionActionState> {
  await requirePermission("collections");

  return guard(async () => {
    const collection = await prisma.collection.findUnique({ where: { slug } });
    if (!collection) return { error: "NOT_FOUND" };

    await prisma.collection.update({
      where: { slug },
      data: { showInHome: false },
    });

    // Renumber the remaining home list so sortOrder stays dense.
    const home = await prisma.collection.findMany({
      where: { showInHome: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { slug: true },
    });
    await renumberCollections(home.map((c) => c.slug));

    revalidatePath("/", "layout");
    return { success: true };
  });
}

async function renumberCollections(slugs: string[]) {
  await prisma.$transaction(
    slugs.map((s, i) =>
      prisma.collection.update({
        where: { slug: s },
        data: { sortOrder: (i + 1) * 10 },
      }),
    ),
  );
}

const sliderImageSchema = z.object({
  image: z.string().trim().max(500).optional().default(""),
  descriptionAr: z.string().trim().max(300).optional().default(""),
  descriptionEn: z.string().trim().max(300).optional().default(""),
  imageAdjust: z.string().trim().max(200).optional().default(""),
});

const isSafeCollectionImage = (v: string) =>
  v === "" ||
  v.startsWith("/") ||
  v.startsWith("http://") ||
  v.startsWith("https://");

// Inline edit of the home-section card (image + captions), mirroring
// updateSlide on the product slider.
export async function updateCollectionSlider(
  slug: string,
  data: {
    image?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    imageAdjust?: string;
  },
): Promise<CollectionActionState> {
  await requirePermission("collections");

  return guard(async () => {
    const collection = await prisma.collection.findUnique({ where: { slug } });
    if (!collection) return { error: "NOT_FOUND" };

    const parsed = sliderImageSchema.safeParse(data);
    if (!parsed.success) return { error: "INVALID" };
    const { image, descriptionAr, descriptionEn, imageAdjust } = parsed.data;
    if (!isSafeCollectionImage(image)) return { error: "INVALID_IMAGE" };
    const adjust = parseImageAdjust(imageAdjust);

    await prisma.collection.update({
      where: { slug },
      data: {
        image: image || null,
        imageAdjust: adjust ?? Prisma.DbNull,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
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

  return guard(async () => {
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
  });
}
