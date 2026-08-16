// Email notification layer via Brevo (free transactional email, no custom
// domain required — a single sender email is verified by clicking a link).
// Works without keys: if BREVO_API_KEY is missing (or the request fails) it
// only logs and never breaks the order flow — the notification is optional.
// Templates are bilingual: English by default, Arabic when the user's locale is ar.
import { escapeHtml } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/dictionary";

const API_KEY = process.env.BREVO_API_KEY;
const SITE_NAME = "ADDICTIONX";
// EMAIL_FROM must be the Brevo-verified sender, e.g. "ADDICTIONX <me@myemail>".
const EMAIL_FROM = process.env.EMAIL_FROM;

function senderFrom(from: string | undefined): { name: string; email: string } {
  const m = from?.match(/^\s*([^<]+)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: SITE_NAME, email: from?.trim() ?? "" };
}

const sender = senderFrom(EMAIL_FROM);

type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(payload: MailPayload): Promise<boolean> {
  if (!API_KEY || !sender.email || !payload.to) {
    console.info("[email] skipped (no BREVO_API_KEY/sender or no recipient)", {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify({
        sender,
        to: to.map((email) => ({ email })),
        subject: payload.subject,
        htmlContent: payload.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] brevo error", res.status, await res.text());
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

const t = {
  en: {
    dir: "ltr" as const,
    lang: "en",
    tagline: "Feel the Rush",
    auto: "This is an automated message — you can ignore it if you didn't expect it.",
    product: "Product",
    total: "Total",
    subtotal: "Subtotal",
    egp: "EGP",
  },
  ar: {
    dir: "rtl" as const,
    lang: "ar",
    tagline: "عِش الإحساس",
    auto: "هذا البريد تلقائي — لو لم تطلب هذا الإشعار يمكنك تجاهله.",
    product: "المنتج",
    total: "الإجمالي",
    subtotal: "الإجمالي",
    egp: "ج.م",
  },
};

function shell(locale: Locale, title: string, body: string): string {
  const tt = t[locale];
  return `<!doctype html>
<html dir="${tt.dir}" lang="${tt.lang}">
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
              ADDICTIONX — ${tt.tagline}<br />
              ${tt.auto}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function fmt(locale: Locale, amountQirsh: number): string {
  const tt = t[locale];
  return `${(amountQirsh / 100).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} ${tt.egp}`;
}

// ============================================================
// Order notifications
// ============================================================

type OrderMailInfo = {
  orderNumber: string;
  totalQirsh: number;
  items: { name: string; qty: number; priceQirsh: number }[];
};

function itemsTable(
  locale: Locale,
  items: OrderMailInfo["items"],
  grandTotalQirsh: number,
): string {
  const tt = t[locale];
  const align = locale === "ar" ? "right" : "left";
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#e8e8e8;">${escapeHtml(it.name)} × ${it.qty}</td>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#c9c9c9;text-align:${align};">${fmt(locale, it.priceQirsh * it.qty)}</td>
      </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
    <tr><th style="text-align:${align};color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">${tt.product}</th><th style="text-align:${align};color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">${tt.subtotal}</th></tr>
    ${rows}
    <tr><td style="padding:10px 4px;color:#f5c518;font-weight:bold;font-size:16px;">${tt.total}</td><td style="padding:10px 4px;text-align:${align};color:#f5c518;font-weight:bold;font-size:16px;">${fmt(locale, grandTotalQirsh)}</td></tr>
  </table>`;
}

// Customer notification when an order is created
export function orderConfirmationEmail(locale: Locale) {
  const isAr = locale === "ar";
  return {
    subject(orderNumber: string) {
      return isAr
        ? `تأكيد الطلب ${orderNumber} — ${SITE_NAME}`
        : `Order confirmation ${orderNumber} — ${SITE_NAME}`;
    },
    html(info: OrderMailInfo) {
      return shell(
        locale,
        isAr
          ? `تأكيد الطلب ${info.orderNumber}`
          : `Order confirmation ${info.orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:#f5c518;">${
          isAr ? "شكرًا لطلبك! 🌟" : "Thank you for your order! 🌟"
        }</div>
         <p>${
           isAr
             ? "تم استلام طلبك بنجاح ونبدأ في تجهيزه فورًا. رقم الطلب:"
             : "We received your order and are preparing it now. Order number:"
         } <b style="color:#f5c518;">${info.orderNumber}</b></p>
         ${itemsTable(locale, info.items, info.totalQirsh)}
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "سنتواصل معك هاتفيًا لتأكيد الطلب وترتيب التوصيل."
             : "We will call you to confirm the order and arrange delivery."
         }</p>`,
      );
    },
  };
}

// Admin notification for a new order
export function adminNewOrderEmail(locale: Locale) {
  const isAr = locale === "ar";
  return {
    subject(orderNumber: string) {
      return isAr ? `طلب جديد — ${orderNumber}` : `New order — ${orderNumber}`;
    },
    html(info: OrderMailInfo) {
      return shell(
        locale,
        isAr
          ? `طلب جديد — ${info.orderNumber}`
          : `New order — ${info.orderNumber}`,
        `<div style="font-size:16px;font-weight:bold;color:#f5c518;">${
          isAr ? "طلب جديد ورد للتو" : "A new order just arrived"
        }</div>
         <p>${isAr ? "رقم الطلب:" : "Order number:"} <b style="color:#f5c518;">${info.orderNumber}</b> — ${isAr ? "الإجمالي:" : "Total:"} <b>${fmt(locale, info.totalQirsh)}</b></p>
         ${itemsTable(locale, info.items, info.totalQirsh)}
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "تابع إدارة الطلبات من لوحة التحكم."
             : "Manage this order from the admin dashboard."
         }</p>`,
      );
    },
  };
}

const STATUS_LABELS_EN: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_LABELS_AR: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "تم التأكيد",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "تم الإلغاء",
  REFUNDED: "تم استرداد المبلغ",
};

// Admin alert for low stock (admin-facing, English)
export function lowStockEmail(
  items: { name: string; sizeMl: number; stock: number }[],
) {
  const rows = items
    .map(
      (it) => `<tr>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#e8e8e8;">${escapeHtml(it.name)} — ${it.sizeMl}ml</td>
        <td style="padding:8px 4px;border-bottom:1px solid #222;color:#f43f5e;text-align:left;font-weight:bold;">${it.stock} left</td>
      </tr>`,
    )
    .join("");
  return shell(
    "en",
    "Low stock alert",
    `<div style="font-size:18px;font-weight:bold;color:#f43f5e;">Low stock ⚠️</div>
     <p>These perfumes reached the alert threshold — review stock in the dashboard:</p>
     <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
       <tr><th style="text-align:left;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">Perfume</th><th style="text-align:left;color:#8a8a8a;font-weight:normal;font-size:12px;padding:4px;">Stock</th></tr>
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
  const { getAdminNotificationEmail } = await import("@/lib/store-config");
  await sendEmail({
    to: await getAdminNotificationEmail(),
    subject: "Low stock alert",
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
export function shippingInfoEmail(locale: Locale) {
  const isAr = locale === "ar";
  return {
    subject(orderNumber: string) {
      return isAr
        ? `بيانات تتبع شحن طلبك ${orderNumber}`
        : `Tracking details for order ${orderNumber}`;
    },
    html(info: {
      orderNumber: string;
      carrier: string;
      trackingNumber: string | null;
    }) {
      return shell(
        locale,
        isAr
          ? `تتبع الطلب ${info.orderNumber}`
          : `Order tracking ${info.orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:#f5c518;">${
          isAr ? "بيانات شحن طلبك" : "Your shipment details"
        }</div>
         <p>${isAr ? "شركة الشحن:" : "Carrier:"} <b>${info.carrier}</b></p>
         ${
           info.trackingNumber
             ? `<p>${isAr ? "رقم التتبع:" : "Tracking number:"} <b style="color:#f5c518;">${info.trackingNumber}</b></p>`
             : `<p style='font-size:12px;color:#8a8a8a;'>${
                 isAr
                   ? "سيُرفق رقم التتبع فور توفره."
                   : "A tracking number will be attached as soon as it's available."
               }</p>`
         }
         <p>${isAr ? "يمكنك تتبع شحنتك من صفحة طلباتك في المتجر." : "You can track your shipment from your orders page."}</p>`,
      );
    },
  };
}

// Customer notification for an order cancellation
export function orderCancelledEmail(locale: Locale) {
  const isAr = locale === "ar";
  return {
    subject(orderNumber: string) {
      return isAr
        ? `إلغاء الطلب ${orderNumber}`
        : `Order cancelled ${orderNumber}`;
    },
    html(orderNumber: string) {
      return shell(
        locale,
        isAr ? `إلغاء الطلب ${orderNumber}` : `Order cancelled ${orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:#f43f5e;">${
          isAr ? "تم إلغاء طلبك" : "Your order was cancelled"
        }</div>
         <p>${isAr ? "طلبك رقم" : "Your order"} <b style="color:#f5c518;">${orderNumber}</b> ${
           isAr ? "تم إلغاؤه." : "has been cancelled."
         }</p>
         <p>${
           isAr
             ? "لو أتممت أي دفع، سيتم رد المبلغ إليك خلال أيام عمل قليلة."
             : "If you already paid, the amount will be refunded within a few business days."
         }</p>
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "لو كان الإلغاء خطأً، يمكنك إعادة الطلب من المتجر في أي وقت."
             : "If the cancellation was a mistake, you can place a new order anytime."
         }</p>`,
      );
    },
  };
}

// Admin alert when a manual payment (InstaPay / Vodafone Cash) needs verification
export function adminManualPaymentEmail(locale: Locale) {
  const isAr = locale === "ar";
  const methodLabel = (m: string) =>
    m === "INSTAPAY" ? "InstaPay" : isAr ? "فودافون كاش" : "Vodafone Cash";
  return {
    subject(method: string, orderNumber: string) {
      return isAr
        ? `دفع يدوي بانتظار المراجعة — ${orderNumber}`
        : `Manual payment awaiting verification — ${orderNumber}`;
    },
    html(info: {
      orderNumber: string;
      totalQirsh: number;
      method: string;
      transactionRef: string | null;
      customerName: string | null;
    }) {
      return shell(
        locale,
        isAr
          ? `دفع يدوي بانتظار المراجعة — ${info.orderNumber}`
          : `Manual payment awaiting verification — ${info.orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:#f5c518;">${
          isAr
            ? "دفع يدوي بانتظار المراجعة ⏳"
            : "Manual payment awaiting verification ⏳"
        }</div>
         <p>${isAr ? "طريقة الدفع:" : "Payment method:"} <b>${methodLabel(info.method)}</b></p>
         <p>${isAr ? "رقم الطلب:" : "Order number:"} <b style="color:#f5c518;">${info.orderNumber}</b> — ${isAr ? "الإجمالي:" : "Total:"} <b>${fmt(locale, info.totalQirsh)}</b></p>
         <p>${isAr ? "العميل:" : "Customer:"} <b>${escapeHtml(info.customerName ?? "-")}</b></p>
         ${
           info.transactionRef
             ? `<p>${isAr ? "رقم العملية:" : "Transaction ref:"} <b style="color:#f5c518;">${escapeHtml(info.transactionRef)}</b></p>`
             : ""
         }
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "راجع الإيصال من صفحة التحقق من الدفع في لوحة التحكم."
             : "Review the receipt from the payment verification page in the dashboard."
         }</p>`,
      );
    },
  };
}

// Customer notification when their payment was approved or rejected
export function paymentStatusEmail(locale: Locale) {
  const isAr = locale === "ar";
  return {
    subject(orderNumber: string) {
      return isAr
        ? `تحديث حالة الدفع — ${orderNumber}`
        : `Payment status update — ${orderNumber}`;
    },
    html(info: {
      orderNumber: string;
      status: "PAID" | "REJECTED";
      rejectionNote?: string;
    }) {
      const paid = info.status === "PAID";
      return shell(
        locale,
        isAr
          ? `تحديث حالة الدفع — ${info.orderNumber}`
          : `Payment status update — ${info.orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:${paid ? "#10b981" : "#f43f5e"};">${
          paid
            ? isAr
              ? "تم تأكيد الدفع ✅"
              : "Payment confirmed ✅"
            : isAr
              ? "لم يتم تأكيد الدفع ❌"
              : "Payment was not accepted ❌"
        }</div>
         <p>${isAr ? "طلبك رقم" : "Your order"} <b style="color:#f5c518;">${info.orderNumber}</b> ${
           paid
             ? isAr
               ? "تم التحقق من دفعته بنجاح."
               : "— its payment has been verified."
             : isAr
               ? "لم يتم اعتماد دفعته."
               : "— its payment was not accepted."
         }</p>
         ${
           !paid && info.rejectionNote
             ? `<p style="font-size:12px;color:#8a8a8a;">${
                 isAr ? "السبب:" : "Reason:"
               } ${escapeHtml(info.rejectionNote)}</p>`
             : ""
         }
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "لو كان الرفض خطأً، تواصل معنا وسنحل الأمر بسرعة."
             : "If this was a mistake, contact us and we'll fix it quickly."
         }</p>`,
      );
    },
  };
}

export function orderStatusEmail(locale: Locale) {
  const isAr = locale === "ar";
  const labels = isAr ? STATUS_LABELS_AR : STATUS_LABELS_EN;
  return {
    subject(orderNumber: string) {
      return isAr
        ? `تحديث الطلب ${orderNumber}`
        : `Order update ${orderNumber}`;
    },
    html(info: { orderNumber: string; status: string; extra?: string }) {
      return shell(
        locale,
        isAr
          ? `تحديث الطلب ${info.orderNumber}`
          : `Order update ${info.orderNumber}`,
        `<div style="font-size:18px;font-weight:bold;color:#f5c518;">${
          isAr ? "تحديث حالة طلبك" : "Your order status"
        }</div>
         <p>${isAr ? "طلبك رقم" : "Your order"} <b style="color:#f5c518;">${info.orderNumber}</b> ${
           isAr ? "أصبح الآن:" : "is now:"
         } <b>${labels[info.status] ?? info.status}</b></p>
         ${info.extra ? `<p>${escapeHtml(info.extra)}</p>` : ""}
         <p style="font-size:12px;color:#8a8a8a;">${
           isAr
             ? "لمزيد من التفاصيل، تفضل بزيارة صفحة طلباتك في المتجر."
             : "For more details, visit your orders page."
         }</p>`,
      );
    },
  };
}
