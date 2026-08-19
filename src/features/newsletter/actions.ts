"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { rateLimiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, newsletterCampaignEmail } from "@/lib/email";

// ADDICTIONX email newsletter — subscribe from the footer without login.

const newsletterSchema = z.string().trim().email();

function generateToken(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type NewsletterState = {
  error?: boolean;
  success?: boolean;
};

export async function subscribeNewsletter(
  _prev: NewsletterState | undefined,
  fd: FormData,
): Promise<NewsletterState> {
  // Rate limit: 10 subscriptions per 15 minutes per IP (spam / email flooding)
  const h = await headers();
  const ip = getClientIp(h);
  const rateLimit = await checkRateLimit(rateLimiters.newsletter, `nl:${ip}`);
  if (!rateLimit.success) return { error: true };

  const email = newsletterSchema.safeParse(fd.get("email"));
  if (!email.success) return { error: true };

  const normalized = email.data.toLowerCase();

  const existing = await prisma.newsletterEntry.findUnique({
    where: { email: normalized },
    select: { id: true, unsubscribeToken: true },
  });

  if (existing) {
    // Reactivate if previously unsubscribed; keep existing token
    if (!existing.unsubscribeToken) {
      await prisma.newsletterEntry.update({
        where: { email: normalized },
        data: { isActive: true, unsubscribeToken: generateToken() },
      });
    } else {
      await prisma.newsletterEntry.update({
        where: { email: normalized },
        data: { isActive: true },
      });
    }
  } else {
    await prisma.newsletterEntry.create({
      data: {
        email: normalized,
        isActive: true,
        unsubscribeToken: generateToken(),
      },
    });
  }

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

// ============================================================
// Newsletter campaign — send a broadcast to all active subscribers.
// Each subscriber receives an individual email with a unique
// unsubscribe link so they can opt out at any time.
// ============================================================

export type CampaignResult = {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
  error?: string;
};

export async function sendNewsletterCampaign(
  subject: string,
  body: string,
): Promise<CampaignResult> {
  await requirePermission("newsletter");

  // Validate inputs
  const parsedSubject = z.string().trim().min(3).max(200).safeParse(subject);
  const parsedBody = z.string().trim().min(10).max(50000).safeParse(body);
  if (!parsedSubject.success || !parsedBody.success) {
    return { ok: false, sent: 0, failed: 0, total: 0, error: "validation" };
  }

  // Campaign rate limit: max 3 per hour per IP (prevent accidental double-sends)
  const h = await headers();
  const ip = getClientIp(h);
  const rl = await checkRateLimit(rateLimiters.newsletter, `campaign:${ip}`);
  if (!rl.success) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      total: 0,
      error: "rate_limited",
    };
  }

  // Fetch all active subscribers
  const subscribers = await prisma.newsletterEntry.findMany({
    where: { isActive: true },
    select: { email: true, unsubscribeToken: true },
  });

  if (subscribers.length === 0) {
    return { ok: true, sent: 0, failed: 0, total: 0 };
  }

  // Ensure every subscriber has an unsubscribe token (backfill legacy rows)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://addictionx.vercel.app";

  const prepared = subscribers.map((s) => ({
    email: s.email,
    token: s.unsubscribeToken ?? generateToken(),
    needsToken: !s.unsubscribeToken,
  }));

  // Backfill tokens in one shot (avoid N individual updates)
  const toBackfill = prepared.filter((p) => p.needsToken);
  if (toBackfill.length > 0) {
    await Promise.all(
      toBackfill.map((p) =>
        prisma.newsletterEntry.update({
          where: { email: p.email },
          data: { unsubscribeToken: p.token },
        }),
      ),
    );
  }

  const subjectText = newsletterCampaignEmail("ar").subject(parsedSubject.data);
  const bodyHtml = parsedBody.data.replace(/\n/g, "<br/>");

  let sent = 0;
  let failed = 0;

  // Send individually so each email has a unique unsubscribe link
  for (const sub of prepared) {
    const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe/${sub.token}`;
    const html = newsletterCampaignEmail("ar").html(bodyHtml, unsubscribeUrl);
    const ok = await sendEmail({
      to: sub.email,
      subject: subjectText,
      html,
    });
    if (ok) sent++;
    else failed++;
  }

  revalidatePath("/", "layout");
  return { ok: true, sent, failed, total: prepared.length };
}
