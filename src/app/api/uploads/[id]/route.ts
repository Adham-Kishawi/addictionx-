import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Serves an image stored in the DB (UploadedImage).
// Public product images are served to everyone. Private images (customer
// avatars, payment receipts) are served only to their owner and to admins
// (who verify payment proofs in the dashboard).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await prisma.uploadedImage
    .findUnique({ where: { id } })
    .catch(() => null);
  if (!image) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (image.isPrivate) {
    const session = await auth();
    let allowed = image.ownerId === session?.user?.id;
    if (session?.user && !allowed) {
      // Admin role read fresh from the DB — the JWT role goes stale on demotion.
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      allowed = dbUser?.role === "ADMIN";
    }

    // A guest has no account ownerId. Their receipt remains private, but the
    // confirmation flow gives them a 256-bit capability URL. Only its digest
    // is stored, so a database read alone cannot reveal the URL.
    const token = new URL(request.url).searchParams.get("accessToken");
    if (!allowed && token && image.guestAccessTokenHash) {
      const candidate = createHash("sha256").update(token).digest();
      const stored = Buffer.from(image.guestAccessTokenHash, "hex");
      allowed =
        stored.length === candidate.length &&
        timingSafeEqual(stored, candidate);
    }

    if (!allowed) {
      // Do not disclose whether a private receipt exists.
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
