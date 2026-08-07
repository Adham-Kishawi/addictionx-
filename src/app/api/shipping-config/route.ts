import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getShippingConfig();
  return NextResponse.json(config, {
    headers: { "Cache-Control": "no-store" },
  });
}
