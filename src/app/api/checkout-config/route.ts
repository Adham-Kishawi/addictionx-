import { NextResponse } from "next/server";
import { getShippingZones, getPaymentSettings } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const [zones, payment] = await Promise.all([
    getShippingZones(),
    getPaymentSettings(),
  ]);
  return NextResponse.json(
    { zones, payment },
    { headers: { "Cache-Control": "no-store" } },
  );
}
