import type { Prisma } from "@prisma/client";
import type { Product } from "@/features/catalog/data/products";

const defaultArt = { from: "#1e1b4b", to: "#020617", glow: "#6366f1" } as const;

type DbProductRow = Prisma.ProductGetPayload<{ include: { variants: true } }>;

// Converts a product row from the database into the storefront shape (display fields only)
export function toStorefrontProduct(p: DbProductRow): Product {
  return {
    id: p.id,
    slug: p.slug,
    nameAr: p.name,
    nameEn: p.nameEn ?? p.name,
    descriptionAr: p.description ?? "",
    descriptionEn: p.descriptionEn ?? p.description ?? "",
    price: p.basePrice,
    gender: (p.gender as string).toLowerCase() as Product["gender"],
    collection: p.collection ?? "rush",
    notes: { top: [], heart: [], base: [] },
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    isNew: p.isNew,
    isBestseller: p.isBestSeller,
    art: (p.art as Product["art"]) ?? defaultArt,
  };
}
