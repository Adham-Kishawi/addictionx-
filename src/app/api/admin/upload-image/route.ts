import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";

// رفع صورة منتج من نموذج الأدمن إلى public/uploads —
// تُخزّن محليًا في مرحلة التجريب، ونفس النمط سيعمل عند الاستضافة لاحقًا
// (نفس الآلية باختلاف مجلد التخزين أو التحميل إلى Cloudinary).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

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

  const ext = ALLOWED_EXTENSIONS[file.type];
  const filename = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");

  try {
    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);
  } catch {
    return NextResponse.json({ error: "WRITE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    url: `/uploads/${filename}`,
  });
}
