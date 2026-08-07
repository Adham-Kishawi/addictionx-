// Email notification layer via Resend.
// Works without keys: if RESEND_API_KEY is missing (or the request fails) it only logs
// and never breaks the order flow — the notification is optional.
import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "ADDICTIONX <no-reply@addictionx.com>";
const SITE_NAME = "ADDICTIONX";

let client: Resend | null = null;
if (API_KEY) {
  client = new Resend(API_KEY);
}

type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(payload: MailPayload): Promise<boolean> {
  if (!client || !payload.to) {
    console.info("[email] skipped (no RESEND_API_KEY or no recipient)", {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    if (error) {
      console.error("[email] resend error", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

// ============================================================
// Simple HTML templates (inline styles — work in every mail client)
// ============================================================

function shell(title: string, body: string): string {
  return `<!doctype html>
<html dir="rtl" lang="ar">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141414;border:1px solid #262626;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 30px;border-bottom:1px solid #262626;">
              <div style="font-size:22px;font-weight:bold;color:#f5c518;letter-spacing:1px;">${SITE_NAME}</div>
              <div style="font-size:12px;color:#8a8a8a;margin-top:4px;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px;color:#e8e8e8;font-size:15px;line-height:1.8;">${body}</td>
          </tr>
          <tr>
            <td style="padding:20px 30px;border-top:1px solid #262626;font-size:11px;color:#666;">
              ADDICTIONX — Feel the Rush · عِش الإحساس<br />
              هذا البريد تلقائي — لو لم تطلب هذا الإشعار يمكنك تجاهله.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function fmt(amountQirsh: number): string {
  return `${(amountQirsh / 100).toLocaleString("ar-EG")} ج.م`;
}

// ============================================================
// Order notifications
// ============================================================

type OrderMailInfo = {
  orderNumber: string;
  totalQirsh: number;
  items: { name: string; qty: number; priceQirsh: number }[];
};

function itemsTable(items: OrderMailInfo["items"]): string {
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#e8e8e8;">${it.name} × ${it.qty}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#c9c9c9;text-align:left;">${fmt(it.priceQirsh * it.qty)}</td>
      </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
    <tr><th style="text-align:right;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">المنتج</th><th style="text-align:left;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">الإجمالي</th></tr>
    ${rows}
    <tr><td style="padding:10px 4px;color:#f5c518;font-weight:bold;font-size:16px;">الإجمالي</td><td style="padding:10px 4px;text-align:left;color:#f5c518;font-weight:bold;font-size:16px;">${fmt(orderTotal(items))}</td></tr>
  </table>`;
}

function orderTotal(items: OrderMailInfo["items"]): number {
  return items.reduce((s, it) => s + it.priceQirsh * it.qty, 0);
}

// Customer notification when an order is created
export function orderConfirmationEmail(info: OrderMailInfo) {
  return shell(
    `تأكيد الطلب ${info.orderNumber}`,
    `<div style="font-size:18px;font-weight:bold;color:#f5c518;">شكرًا لطلبك! 🌟</div>
     <p>تم استلام طلبك بنجاح ونبدأ في تجهيزه فورًا. رقم الطلب: <b style="color:#f5c518;">${info.orderNumber}</b></p>
     ${itemsTable(info.items)}
     <p style="font-size:12px;color:#8a8a8a;">سنتواصل معك هاتفيًا لتأكيد الطلب وترتيب التوصيل.</p>`,
  );
}

// Admin notification for a new order
export function adminNewOrderEmail(info: OrderMailInfo) {
  return shell(
    `طلب جديد — ${info.orderNumber}`,
    `<div style="font-size:16px;font-weight:bold;color:#f5c518;">طلب جديد ورد للتو</div>
     <p>رقم الطلب: <b style="color:#f5c518;">${info.orderNumber}</b> — الإجمالي: <b>${fmt(orderTotal(info.items))}</b></p>
     ${itemsTable(info.items)}
     <p style="font-size:12px;color:#8a8a8a;">تابع إدارة الطلبات من لوحة التحكم.</p>`,
  );
}

// Customer notification for an order status change
const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "تم الإلغاء",
  REFUNDED: "تم استرداد المبلغ",
};

// Admin alert for low stock
export function lowStockEmail(
  items: { name: string; sizeMl: number; stock: number }[],
) {
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#e8e8e8;">${it.name} — ${it.sizeMl}ml</td>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#f43f5e;text-align:left;font-weight:bold;">${it.stock} متبقي</td>
      </tr>`,
    )
    .join("");
  return shell(
    `تنبيه: مخزون منخفض`,
    `<div style="font-size:18px;font-weight:bold;color:#f43f5e;">مخزون منخفض ⚠️</div>
     <p>هذه العطور وصلت إلى حدّ التنبيه — راجع المخزون في لوحة التحكم:</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
       <tr><th style="text-align:right;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">العطر</th><th style="text-align:left;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">المخزون</th></tr>
       ${rows}
     </table>`,
  );
}

// Reused at the stock decrement points: checks whether any variant reached the alert threshold
export async function notifyLowStock(
  variantIds: string[],
  threshold = 5,
): Promise<void> {
  if (!variantIds.length) return;
  // dynamic import to avoid loading prisma when email.ts is imported early
  const { prisma } = await import("@/lib/prisma");
  const low = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, stock: { lte: threshold } },
    include: { product: { select: { name: true } } },
  });
  if (!low.length) return;
  await sendEmail({
    to:
      process.env.ADMIN_EMAIL ||
      (await import("@/config/site")).siteConfig.adminEmail,
    subject: "تنبيه: مخزون منخفض",
    html: lowStockEmail(
      low.map((v) => ({
        name: v.product.name,
        sizeMl: v.sizeMl,
        stock: v.stock,
      })),
    ),
  });
}

// Shipment info (carrier + tracking number)
export function shippingInfoEmail(info: {
  orderNumber: string;
  carrier: string;
  trackingNumber: string | null;
}) {
  return shell(
    `تتبع الطلب ${info.orderNumber}`,
    `<div style="font-size:18px;font-weight:bold;color:#f5c518;">بيانات شحن طلبك</div>
     <p>شركة الشحن: <b>${info.carrier}</b></p>
     ${
       info.trackingNumber
         ? `<p>رقم التتبع: <b style="color:#f5c518;">${info.trackingNumber}</b></p>`
         : "<p style='font-size:12px;color:#8a8a8a;'>سيُرفق رقم التتبع فور توفره.</p>"
     }
     <p>يمكنك تتبع شحنتك من صفحة طلباتك في المتجر.</p>`,
  );
}

// Customer notification for an order cancellation
export function orderCancelledEmail(orderNumber: string) {
  return shell(
    `إلغاء الطلب ${orderNumber}`,
    `<div style="font-size:18px;font-weight:bold;color:#f43f5e;">تم إلغاء طلبك</div>
     <p>طلبك رقم <b style="color:#f5c518;">${orderNumber}</b> تم إلغاؤه.</p>
     <p>لو أتممت أي دفع، سيتم رد المبلغ إليك خلال أيام عمل قليلة.</p>
     <p style="font-size:12px;color:#8a8a8a;">لو كان الإلغاء خطأً، يمكنك إعادة الطلب من المتجر في أي وقت.</p>`,
  );
}

export function orderStatusEmail(
  orderNumber: string,
  status: string,
  extra?: string,
) {
  return shell(
    `تحديث الطلب ${orderNumber}`,
    `<div style="font-size:18px;font-weight:bold;color:#f5c518;">تحديث حالة طلبك</div>
     <p>طلبك رقم <b style="color:#f5c518;">${orderNumber}</b> أصبح الآن: <b>${STATUS_LABELS[status] ?? status}</b></p>
     ${extra ? `<p>${extra}</p>` : ""}
     <p style="font-size:12px;color:#8a8a8a;">لمزيد من التفاصيل، تفضل بزيارة صفحة طلباتك في المتجر.</p>`,
  );
}
