import { ImageResponse } from "next/og";
import { getCollections } from "@/features/catalog/data/products-db";
import { ogCard, ogFonts, OG_SIZE } from "@/app/og-card";

export const alt = "ADDICTIONX — The Collection";
export const size = OG_SIZE;
export const contentType = "image/png";

export const dynamic = "force-dynamic";

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const collections = await getCollections();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) {
    return new ImageResponse(
      ogCard({ eyebrow: "The Collection", title: "ADDICTIONX" }),
      { ...size, fonts: ogFonts },
    );
  }
  return new ImageResponse(
    ogCard({
      eyebrow: "The Collection",
      title: collection.nameEn,
      subtitle: "ADDICTIONX",
    }),
    { ...size, fonts: ogFonts },
  );
}
