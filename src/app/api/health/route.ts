import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_len: process.env.AUTH_SECRET?.length ?? 0,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_has_channel_binding:
      process.env.DATABASE_URL?.includes("channel_binding") ?? false,
    AUTH_URL: process.env.AUTH_URL ?? null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    NODE_ENV: process.env.NODE_ENV,
  });
}
