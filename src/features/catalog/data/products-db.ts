import { prisma } from "@/lib/prisma";
import type { Product } from "./products";
import { collections as staticCollections } from "./products";

// Data layer that reads from the database with the same interface as the static file —
// so the storefront only changes its data source without any change in the interfaces.
// "use server" is not required — it is only called from Server Components.

export interface CollectionRow {
  slug: string;
  nameAr: string;
  nameEn: string;
}

// Collections are managed from the dashboard. When no records exist (new DB without seed)
// we fall back to the static array so the pages never break.
export async function getCollections(): Promise<CollectionRow[]> {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAr: true, nameEn: true },
  });
  if (rows.length === 0) {
    return staticCollections.map((c) => ({
      slug: c.slug,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
    }));
  }
  return rows;
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
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    include,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => productFromRow(row as DbProduct));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { slug }, include });
  return row ? productFromRow(row as DbProduct) : null;
}
