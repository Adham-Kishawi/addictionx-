"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isValidPassword, isValidEgyptianPhone } from "@/lib/validation";
import { rateLimiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).refine(isValidPassword, "WEAK_PASSWORD"),
  // Optional — filled in automatically when the customer checked out as a
  // guest with this number (their guest orders get linked to the account).
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export type RegisterState = { error?: string; success?: boolean };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // Rate limit: 5 registration attempts per 15 minutes per IP
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const rateLimit = await checkRateLimit(rateLimiters.login, `register:${ip}`);

  if (!rateLimit.success) {
    return {
      error: "TOO_MANY_ATTEMPTS",
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      error:
        firstIssue?.message === "WEAK_PASSWORD"
          ? "WEAK_PASSWORD"
          : "INVALID_INPUT",
    };
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "EMAIL_EXISTS" };
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone && isValidEgyptianPhone(phone) ? phone : null,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  // Link guest orders made with the same phone number to the new account, so
  // a customer who paid without an account keeps their order history.
  if (user.phone) {
    await linkGuestOrders(user.id, user.phone);
  }

  return { success: true };
}

// Guest checkout orders (userId null) store the shopper's phone on the address
// row. After sign-up/login with a matching phone we attach those orders to the
// account and take ownership of the saved addresses too.
async function linkGuestOrders(userId: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return;

  const guestOrders = await prisma.order.findMany({
    where: { userId: null },
    select: {
      id: true,
      address: { select: { id: true, phone: true } },
    },
  });

  const orderIds = guestOrders
    .filter((o) => {
      const p = o.address?.phone ?? "";
      return p.replace(/\D/g, "").endsWith(digits.slice(-10));
    })
    .map((o) => o.id);

  if (orderIds.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { userId },
    });
  }

  const addressIds = guestOrders
    .filter((o) => o.address)
    .map((o) => o.address!.id);
  if (addressIds.length > 0) {
    await prisma.address.updateMany({
      where: { id: { in: addressIds } },
      data: { userId },
    });
  }
}
