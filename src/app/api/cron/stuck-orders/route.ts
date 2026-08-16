import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { findStuckOrders } from "@/features/admin/stuck-orders";
import { getAdminNotificationEmail } from "@/lib/store-config";
import { stuckOrdersEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Runs on a schedule (see vercel.json crons) and on demand. Finds orders that
// have been stuck in a live stage past their threshold and emails the admin.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const authorized =
    request.headers.get("authorization") === `Bearer ${secret}` ||
    (!!secret && url.searchParams.get("secret") === secret);
  if (secret && !authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stuck = await findStuckOrders();
  if (stuck.length === 0) {
    return NextResponse.json({ ok: true, notified: 0, count: 0 });
  }

  const adminEmail = await getAdminNotificationEmail();
  const sent = await sendEmail({
    to: adminEmail,
    subject: stuckOrdersEmail("ar").subject(stuck.length),
    html: stuckOrdersEmail("ar", `${siteConfig.url}/ar/admin/orders`).html(
      stuck.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        stuckHours: o.stuckHours,
        totalQirsh: o.total,
        customerName: o.customerName,
        phone: o.phone,
      })),
    ),
  });

  return NextResponse.json({
    ok: sent,
    notified: sent ? stuck.length : 0,
    count: stuck.length,
  });
}
