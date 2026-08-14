import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Upload the logged-in customer's profile picture. Stored in the DB and
// served privately via /api/account/avatar/[id] — only the owner can read it.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "BAD_TYPE" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "BAD_SIZE" }, { status: 400 });
  }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { image: true },
      });
      const created = await tx.uploadedImage.create({
        data: {
          mimeType: file.type,
          data: Buffer.from(await file.arrayBuffer()),
          isPrivate: true,
          ownerId: session.user.id,
        },
      });
      await tx.user.update({
        where: { id: session.user.id },
        data: { image: `/api/account/avatar/${created.id}` },
      });
      // Delete the previous avatar row so orphaned images don't accumulate.
      const oldId = existing?.image?.match(
        /\/api\/account\/avatar\/([^/?#]+)/,
      )?.[1];
      if (oldId && oldId !== created.id) {
        await tx.uploadedImage.deleteMany({
          where: { id: oldId, ownerId: session.user.id },
        });
      }
      return created;
    });
    return NextResponse.json({ url: `/api/account/avatar/${saved.id}` });
  } catch {
    return NextResponse.json({ error: "WRITE_FAILED" }, { status: 500 });
  }
}
