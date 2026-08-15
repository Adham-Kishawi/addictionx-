import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client - falls back to in-memory if no env vars
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;

// Rate limiters with different tiers
export const rateLimiters = {
  // Strict: Login attempts - 5 per 15 minutes per IP
  login: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
        prefix: "ratelimit:login",
      })
    : null,

  // Medium: Order creation - 10 per hour per user
  order: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60 m"),
        analytics: true,
        prefix: "ratelimit:order",
      })
    : null,

  // Lenient: API reads - 100 per minute per IP
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      })
    : null,

  // Admin actions - 30 per minute per admin
  admin: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
        prefix: "ratelimit:admin",
      })
    : null,

  // Password changes - 5 per 15 minutes per user
  passwordChange: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
        prefix: "ratelimit:password",
      })
    : null,

  // Newsletter signups - 10 per 15 minutes per IP
  newsletter: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        analytics: true,
        prefix: "ratelimit:newsletter",
      })
    : null,
};

// Helper to check rate limit and return result
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // If no Redis configured, allow all requests (dev mode)
  if (!limiter) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: new Date(Date.now() + 60000),
    };
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  };
}

// Extract IP from request headers (works with Vercel/proxies)
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
