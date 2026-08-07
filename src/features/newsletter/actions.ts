"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// نشرة ADDICTIONX البريدية — الاشتراك من الفوتر بلا تسجيل دخول.

const newsletterSchema = z.string().trim().email();

export type NewsletterState = {
  error?: boolean;
  success?: boolean;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");
}

export async function subscribeNewsletter(
  _prev: NewsletterState | undefined,
  fd: FormData,
): Promise<NewsletterState> {
  const email = newsletterSchema.safeParse(fd.get("email"));
  if (!email.success) return { error: true };

  const normalized = email.data.toLowerCase();

  await prisma.newsletterEntry.upsert({
    where: { email: normalized },
    update: { isActive: true },
    create: { email: normalized, isActive: true },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

// إدارة الأدمن: إيقاف/تفعيل أو حذف مشترك.

export async function toggleNewsletterEntry(email: string): Promise<void> {
  await requireAdmin();
  const entry = await prisma.newsletterEntry.findUnique({ where: { email } });
  if (!entry) return;
  await prisma.newsletterEntry.update({
    where: { email },
    data: { isActive: !entry.isActive },
  });
  revalidatePath("/", "layout");
}

export async function deleteNewsletterEntry(email: string): Promise<void> {
  await requireAdmin();
  await prisma.newsletterEntry.deleteMany({ where: { email } });
  revalidatePath("/", "layout");
}
