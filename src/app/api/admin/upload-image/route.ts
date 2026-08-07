import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Upload a product image from the admin form — stored directly in the database
// (UploadedImage) instead of the runtime filesystem, because serverless
// deployments (Vercel) do not persist anything written to disk.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
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
    const saved = await prisma.uploadedImage.create({
      data: {
        mimeType: file.type,
        data: Buffer.from(await file.arrayBuffer()),
      },
    });
    return NextResponse.json({
      url: `/api/uploads/${saved.id}`,
    });
  } catch {
    return NextResponse.json({ error: "WRITE_FAILED" }, { status: 500 });
  }
}
