// Public API route — returns payment account numbers (InstaPay + Vodafone Cash)
// for the checkout form. Read from StoreSetting with cache.
import { NextResponse } from "next/server";
import { getPaymentAccountsConfig } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPaymentAccountsConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to fetch payment accounts config:", error);
    return NextResponse.json(
      {
        instapayNumber: "",
        instapayName: "ADDICTIONX",
        vodafoneCashNumber: "",
        vodafoneCashName: "ADDICTIONX",
      },
      { status: 200 }, // Always 200 so checkout doesn't break
    );
  }
}
