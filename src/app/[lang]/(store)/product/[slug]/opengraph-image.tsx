import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/features/catalog/data/products-db";
import { formatPrice } from "@/features/catalog/data/products";
import { ogCard, ogFonts, OG_SIZE } from "@/app/og-card";

export const alt = "ADDICTIONX fragrance";
export const size = OG_SIZE;
export const contentType = "image/png";

export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return new ImageResponse(
      ogCard({ eyebrow: "ADDICTIONX", title: "A Scent of Your Own" }),
      { ...size, fonts: ogFonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: "ADDICTIONX",
      title: product.nameEn,
      subtitle: `${formatPrice(product.price)} EGP`,
      accent: product.art.glow,
    }),
    { ...size, fonts: ogFonts },
  );
}
