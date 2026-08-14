"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isValidPassword } from "@/lib/validation";
import { rateLimiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).refine(isValidPassword, "WEAK_PASSWORD"),
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

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "EMAIL_EXISTS" };
  }

  const passwordHash = await hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  return { success: true };
}
