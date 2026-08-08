"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

// ADDICTIONX email newsletter — subscribe from the footer without login.

const newsletterSchema = z.string().trim().email();

export type NewsletterState = {
  error?: boolean;
  success?: boolean;
};

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

// Admin management: activate/deactivate or delete a subscriber.

export async function toggleNewsletterEntry(email: string): Promise<void> {
  await requirePermission("newsletter");
  const entry = await prisma.newsletterEntry.findUnique({ where: { email } });
  if (!entry) return;
  await prisma.newsletterEntry.update({
    where: { email },
    data: { isActive: !entry.isActive },
  });
  revalidatePath("/", "layout");
}

export async function deleteNewsletterEntry(email: string): Promise<void> {
  await requirePermission("newsletter");
  await prisma.newsletterEntry.deleteMany({ where: { email } });
  revalidatePath("/", "layout");
}
