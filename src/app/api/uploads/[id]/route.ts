import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves a product image stored in the DB (UploadedImage).
// Public — product images are referenced from the storefront/product cards.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await prisma.uploadedImage.findUnique({ where: { id } });
  if (!image) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
