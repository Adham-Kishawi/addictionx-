import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Serves an image stored in the DB (UploadedImage).
// Public product images are served to everyone. Private images (customer
// avatars, payment receipts) are served only to their owner and to admins
// (who verify payment proofs in the dashboard).

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

  if (image.isPrivate) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (image.ownerId !== session.user.id) {
      // Admin role read fresh from the DB — the JWT role goes stale on demotion.
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (dbUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
