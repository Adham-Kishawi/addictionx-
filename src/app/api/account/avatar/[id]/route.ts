import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Serves the logged-in customer's avatar. Private — only the owner can read it.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const image = await prisma.uploadedImage.findUnique({ where: { id } });
  if (!image || !image.isPrivate || image.ownerId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}
