import { prisma } from "@/lib/prisma";
import type { Product } from "./products";
import {
  collections as staticCollections,
  products as staticProducts,
} from "./products";

// Data layer that reads from the database with the same interface as the static file —
// so the storefront only changes its data source without any change in the interfaces.
// "use server" is not required — it is only called from Server Components.

export interface CollectionRow {
  slug: string;
  nameAr: string;
  nameEn: string;
}

// Collections are managed from the dashboard. The storefront still has a local
// fallback so a temporary database outage does not take the public site offline.
export async function getCollections(): Promise<CollectionRow[]> {
  try {
    const rows = await prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, nameAr: true, nameEn: true },
    });
    if (rows.length > 0) return rows;
  } catch {
    // Use the static catalog while the remote database is unavailable.
  }

  return staticCollections.map((c) => ({
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
  }));
}

const include = {
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" as const },
  },
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { position: "asc" as const }],
  },
};

type DbProduct = NonNullable<
  Awaited<ReturnType<typeof prisma.product.findUnique>>
> & {
  variants: Awaited<ReturnType<typeof prisma.productVariant.findMany>>;
  images?: Awaited<ReturnType<typeof prisma.productImage.findMany>>;
};

export function productFromRow(db: DbProduct): Product {
  const notes = (db.notes ?? {
    top: [],
    heart: [],
    base: [],
  }) as Product["notes"];
  const art = (db.art ?? {
    from: "#1e1b4b",
    to: "#020617",
    glow: "#6366f1",
  }) as Product["art"];

  const price = db.variants[0]?.price ?? db.basePrice;
  const stockTotal = db.variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    id: db.id,
    slug: db.slug,
    nameAr: db.name,
    nameEn: db.nameEn ?? db.name,
    descriptionAr: db.description ?? "",
    descriptionEn: db.descriptionEn ?? db.description ?? "",
    price,
    compareAtPrice: db.compareAtPrice ?? undefined,
    sizeMl: db.variants[0]?.sizeMl,
    gender: (db.gender as string).toLowerCase() as Product["gender"],
    collection: db.collection ?? "rush",
    notes,
    rating: db.rating,
    reviewsCount: db.reviewsCount,
    isNew: db.isNew,
    isBestseller: db.isBestSeller,
    isSoldOut: stockTotal === 0,
    art,
    image: db.images?.[0]?.url ?? undefined,
    images: db.images?.map((img) => img.url) ?? undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include,
      orderBy: { createdAt: "desc" },
    });
    if (rows.length > 0)
      return rows.map((row) => productFromRow(row as DbProduct));
  } catch {
    // Use the static catalog while the remote database is unavailable.
  }

  return staticProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const row = await prisma.product.findUnique({ where: { slug }, include });
    if (row) return productFromRow(row as DbProduct);
  } catch {
    // Use the static catalog while the remote database is unavailable.
  }

  return staticProducts.find((product) => product.slug === slug) ?? null;
}
