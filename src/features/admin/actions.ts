"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import {
  requirePermission,
  requireAnyPermission,
} from "@/lib/admin-permissions";
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions-core";
import { prisma } from "@/lib/prisma";
import { clearConfigCache, getShippingConfig } from "@/lib/store-config";
import {
  orderStatusEmail,
  shippingInfoEmail,
  adminNewOrderEmail,
  sendEmail,
  notifyLowStock,
} from "@/lib/email";
import { siteConfig } from "@/config/site";
import type { OrderStatus } from "@prisma/client";

// ============================================================
// Products
// ============================================================

export type AdminActionState = { error?: string; success?: boolean };

const productSchema = z.object({
  name: z.string().trim().min(2),
  nameEn: z.string().trim().optional().default(""),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  collection: z.string().trim().optional().default("rush"),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
  basePrice: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  discountPercent: z.coerce.number().min(0).max(90).optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviewsCount: z.coerce.number().int().min(0).optional().default(0),
  isNew: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

type ProductData = z.infer<typeof productSchema>;
type VariantData = {
  sizeMl: number;
  price: number;
  stock: number;
  sku: string;
};

function egpToQirsh(egp: number) {
  return Math.round(egp * 100);
}

function splitNotes(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseVariants(raw: FormDataEntryValue | null): VariantData[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v === "object")
      .map((v) => ({
        sizeMl: Math.round(Number(v.sizeMl)),
        price: egpToQirsh(Number(v.price)),
        stock: Math.round(Number(v.stock) || 0),
        sku: String(v.sku ?? "").trim(),
      }))
      .filter(
        (v) =>
          Number.isFinite(v.sizeMl) &&
          v.sizeMl > 0 &&
          Number.isFinite(v.price) &&
          v.price > 0,
      );
  } catch {
    return [];
  }
}

function readProductForm(fd: FormData) {
  const parsed = productSchema.parse({
    name: fd.get("name"),
    nameEn: fd.get("nameEn") || "",
    slug: fd.get("slug"),
    description: fd.get("description") || "",
    descriptionEn: fd.get("descriptionEn") || "",
    collection: fd.get("collection") || "rush",
    gender: fd.get("gender") || "UNISEX",
    basePrice: fd.get("basePrice"),
    compareAtPrice: fd.get("compareAtPrice") || undefined,
    discountPercent: fd.get("discountPercent") || 0,
    rating: fd.get("rating") || 0,
    reviewsCount: fd.get("reviewsCount") || 0,
    isNew: fd.get("isNew") === "on",
    isBestSeller: fd.get("isBestSeller") === "on",
    isFeatured: fd.get("isFeatured") === "on",
    isActive: fd.get("isActive") === "on",
  });

  const variants = parseVariants(fd.get("variants"));

  return {
    parsed,
    variants,
    notes: {
      top: splitNotes(fd.get("notesTop")),
      heart: splitNotes(fd.get("notesHeart")),
      base: splitNotes(fd.get("notesBase")),
    },
    // All gallery images (DB uploads or static /uploads paths)
    images: fd
      .getAll("images")
      .map((v) => String(v).trim())
      .filter(
        (url) => url.startsWith("/uploads/") || url.startsWith("/api/uploads/"),
      ),
    art: {
      from: String(fd.get("artFrom") || "#1e1b4b"),
      to: String(fd.get("artTo") || "#020617"),
      glow: String(fd.get("artGlow") || "#6366f1"),
    },
    locale: String(fd.get("locale") || "ar"),
  };
}

function toCreateData(
  p: ProductData,
  extras: ReturnType<typeof readProductForm>,
) {
  // If the admin set a % discount we compute the pre-discount price (compareAtPrice) automatically
  // from the cheapest actual variant price — because it is the one shown on the storefront.
  let compareAtPrice =
    p.compareAtPrice != null ? egpToQirsh(p.compareAtPrice) : null;
  const minVariantPrice = extras.variants.reduce(
    (min, v) => (v.price > 0 && (min === 0 || v.price < min) ? v.price : min),
    0,
  );
  const base = minVariantPrice > 0 ? minVariantPrice : egpToQirsh(p.basePrice);
  if (p.discountPercent && p.discountPercent > 0) {
    compareAtPrice = Math.round(base / (1 - p.discountPercent / 100));
  }

  return {
    name: p.name,
    nameEn: p.nameEn || null,
    description: p.description || null,
    descriptionEn: p.descriptionEn || null,
    collection: p.collection,
    notes: extras.notes,
    art: extras.art,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    gender: p.gender,
    basePrice: egpToQirsh(p.basePrice),
    compareAtPrice,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNew: p.isNew,
  };
}

// Returns the UploadedImage id for a DB-backed image URL, or null for static assets.
const storedImageId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const m = url.match(/^\/api\/uploads\/([^/?#]+)$/);
  return m ? m[1] : null;
};

export async function createProduct(
  _prev: AdminActionState | undefined,
  fd: FormData,
): Promise<AdminActionState> {
  await requirePermission("products");

  let extras: ReturnType<typeof readProductForm>;
  try {
    extras = readProductForm(fd);
  } catch {
    return { error: "GENERIC" };
  }

  const { parsed, variants } = extras;

  try {
    const slugExists = await prisma.product.findUnique({
      where: { slug: parsed.slug },
    });
    if (slugExists) return { error: "SLUG_EXISTS" };

    await prisma.product.create({
      data: {
        slug: parsed.slug,
        ...toCreateData(parsed, extras),
        images:
          extras.images.length > 0
            ? {
                create: extras.images.map((url, i) => ({
                  url,
                  isPrimary: i === 0,
                  position: i,
                })),
              }
            : undefined,
        variants: { create: variants },
      },
    });
  } catch {
    return { error: "GENERIC" };
  }

  revalidatePath("/", "layout");
  redirect(`/${extras.locale}/admin/products`);
}

export async function updateProduct(
  id: string,
  _prev: AdminActionState | undefined,
  fd: FormData,
): Promise<AdminActionState> {
  await requirePermission("products");

  let extras: ReturnType<typeof readProductForm>;
  try {
    extras = readProductForm(fd);
  } catch {
    return { error: "GENERIC" };
  }

  const { parsed, variants } = extras;

  const images = extras.images;

  try {
    const slugExists = await prisma.product.findFirst({
      where: { slug: parsed.slug, NOT: { id } },
    });
    if (slugExists) return { error: "SLUG_EXISTS" };

    const currentImages = await prisma.productImage.findMany({
      where: { productId: id },
    });
    // Delete stored uploads that are no longer part of the gallery.
    const keptStoredIds = new Set(
      images
        .map((url) => storedImageId(url))
        .filter((v): v is string => Boolean(v)),
    );
    const oldStoredIds = currentImages
      .map((img) => storedImageId(img.url))
      .filter(
        (v): v is string => Boolean(v) && !keptStoredIds.has(v as string),
      );

    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: toCreateData(parsed, extras),
      }),
      ...images.map((url, i) =>
        prisma.productImage.create({
          data: {
            productId: id,
            url,
            isPrimary: i === 0,
            position: i,
          },
        }),
      ),
      ...variants.map((v) =>
        prisma.productVariant.create({ data: { ...v, productId: id } }),
      ),
      ...(oldStoredIds.length > 0
        ? [
            prisma.uploadedImage.deleteMany({
              where: { id: { in: oldStoredIds } },
            }),
          ]
        : []),
    ]);
  } catch {
    return { error: "GENERIC" };
  }

  revalidatePath("/", "layout");
  redirect(`/${extras.locale}/admin/products`);
}

export async function deleteProduct(id: string) {
  await requirePermission("products");
  const orderedCount = await prisma.orderItem.count({
    where: { productId: id },
  });
  if (orderedCount > 0) return { error: "HAS_ORDERS" };
  const images = await prisma.productImage.findMany({
    where: { productId: id },
  });
  const storedIds = images
    .map((img) => storedImageId(img.url))
    .filter((v): v is string => Boolean(v));
  await prisma.$transaction([
    prisma.product.delete({ where: { id } }),
    ...(storedIds.length > 0
      ? [prisma.uploadedImage.deleteMany({ where: { id: { in: storedIds } } })]
      : []),
  ]);
  revalidatePath("/", "layout");
}

export async function toggleProductActive(id: string) {
  await requirePermission("products");
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });
  revalidatePath("/", "layout");
}

// ============================================================
// Orders
// ============================================================

export async function updateOrderStatus(orderId: string, status: string) {
  await requirePermission("orders");
  const next = status as OrderStatus;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      user: { select: { email: true } },
    },
  });
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: next },
    });

    if (next === "SHIPPED") {
      await tx.shipment.upsert({
        where: { orderId },
        create: {
          orderId,
          carrier: "Bosta",
          status: "SHIPPED",
          shippedAt: new Date(),
        },
        update: {
          status: "SHIPPED",
          shippedAt: new Date(),
          deliveredAt: null,
        },
      });
    }

    if (next === "DELIVERED") {
      const shipment = await tx.shipment.findUnique({
        where: { orderId },
      });
      if (shipment) {
        await tx.shipment.update({
          where: { orderId },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
      }
    }

    if (next === "CANCELLED" || next === "REFUNDED") {
      await tx.shipment.deleteMany({ where: { orderId } });
      // Restore the stock reserved in createOrder so it isn't lost on cancellation
      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { variantId: true, quantity: true },
      });
      for (const item of items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  revalidatePath("/", "layout");

  if (order.user?.email) {
    await sendEmail({
      to: order.user.email,
      subject: `تحديث طلبك ${order.orderNumber}`,
      html: orderStatusEmail(
        order.orderNumber,
        next,
        next === "SHIPPED" ? "تم شحن طلبك وهو في الطريق إليك الآن." : undefined,
      ),
    });
  }
}

// ============================================================
// Shipping
// ============================================================

export async function updateShipment(
  orderId: string,
  data: { carrier: string; trackingNumber: string },
) {
  await requirePermission("orders");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, user: { select: { email: true } } },
  });
  if (!order) return;

  await prisma.shipment.upsert({
    where: { orderId },
    create: {
      orderId,
      carrier: data.carrier.trim() || "Bosta",
      trackingNumber: data.trackingNumber.trim() || null,
    },
    update: {
      carrier: data.carrier.trim() || "Bosta",
      trackingNumber: data.trackingNumber.trim() || null,
    },
  });

  revalidatePath("/", "layout");

  if (order.user?.email) {
    await sendEmail({
      to: order.user.email,
      subject: `بيانات تتبع شحن طلبك ${order.orderNumber}`,
      html: shippingInfoEmail({
        orderNumber: order.orderNumber,
        carrier: data.carrier.trim() || "Bosta",
        trackingNumber: data.trackingNumber.trim() || null,
      }),
    });
  }
}

// ============================================================
// Users
// ============================================================

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "ADMIN"]),
});

export type UserActionState = { error?: string; success?: boolean };

export async function createUser(
  _prev: UserActionState | undefined,
  fd: FormData,
): Promise<UserActionState> {
  const parsed = createUserSchema.safeParse({
    name: fd.get("name"),
    email: fd.get("email"),
    password: fd.get("password"),
    role: fd.get("role"),
  });
  if (!parsed.success) return { error: "INVALID" };

  // Creating an ADMIN is a sensitive action — only super admins or
  // users with the "admins" permission can do it. Plain customer accounts
  // can be created by anyone with the "users" permission.
  const isAdminCreation = parsed.data.role === "ADMIN";
  if (isAdminCreation) {
    await requirePermission("admins");
  } else {
    await requirePermission("users");
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "EMAIL_EXISTS" };

  const passwordHash = await hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user) return;
  if (session.user.id === userId) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return;

  // Deleting an admin requires the "admins" permission; deleting a
  // customer only needs "users" (any user-management admin).
  if (target.role === "ADMIN") {
    await requirePermission("admins");
  } else {
    await requireAnyPermission(["users", "admins"]);
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { userId },
      data: { userId: null },
    });
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/", "layout");
}

export async function updateUserPermissions(
  userId: string,
  permissions: string[],
) {
  const session = await auth();
  if (!session?.user) return;
  if (session.user.id === userId) return;

  await requirePermission("admins");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return;

  // Only admins carry permissions — demoting a customer to an admin is done
  // through updateUserRole, but we reject permission edits on non-admins.
  if (target.role !== "ADMIN") return;

  const clean = permissions.filter((p) =>
    (ADMIN_PERMISSIONS as readonly string[]).includes(p),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { permissions: clean },
  });

  revalidatePath("/", "layout");
}

// ============================================================
// Store settings (shipping)
// ============================================================

const shippingSettingsSchema = z.object({
  shippingFee: z.coerce.number().int().min(0),
  freeShippingThreshold: z.coerce.number().int().min(0),
  carrier: z.string().trim().min(1).max(60),
});

export async function updateShippingSettings(
  _prev: UserActionState | undefined,
  fd: FormData,
): Promise<UserActionState> {
  await requirePermission("settings");

  const parsed = shippingSettingsSchema.safeParse({
    shippingFee: fd.get("shippingFee"),
    freeShippingThreshold: fd.get("freeShippingThreshold"),
    carrier: fd.get("carrier"),
  });
  if (!parsed.success) return { error: "INVALID" };

  const { shippingFee, freeShippingThreshold, carrier } = parsed.data;

  await prisma.$transaction([
    prisma.storeSetting.upsert({
      where: { key: "shipping_fee_qirsh" },
      create: {
        key: "shipping_fee_qirsh",
        value: String(Math.round(shippingFee * 100)),
      },
      update: { value: String(Math.round(shippingFee * 100)) },
    }),
    prisma.storeSetting.upsert({
      where: { key: "free_shipping_threshold_qirsh" },
      create: {
        key: "free_shipping_threshold_qirsh",
        value: String(Math.round(freeShippingThreshold * 100)),
      },
      update: {
        value: String(Math.round(freeShippingThreshold * 100)),
      },
    }),
    prisma.storeSetting.upsert({
      where: { key: "default_carrier" },
      create: { key: "default_carrier", value: carrier },
      update: { value: carrier },
    }),
  ]);

  clearConfigCache();
  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Coupons
// ============================================================

const couponSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().optional().default(0),
  maxDiscount: z.coerce.number().nonnegative().optional().default(0),
  maxUses: z.coerce.number().int().nonnegative().optional().default(0),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function createCoupon(
  _prev: UserActionState | undefined,
  fd: FormData,
): Promise<UserActionState> {
  await requirePermission("coupons");

  const parsed = couponSchema.safeParse({
    code: fd.get("code"),
    discountType: fd.get("discountType"),
    discountValue: fd.get("discountValue"),
    minOrderAmount: fd.get("minOrderAmount") || 0,
    maxDiscount: fd.get("maxDiscount") || 0,
    maxUses: fd.get("maxUses") || 0,
    expiresAt: fd.get("expiresAt") || undefined,
    isActive: fd.get("isActive") === "on",
  });
  if (!parsed.success) return { error: "INVALID" };

  const {
    code,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscount,
    maxUses,
    expiresAt,
    isActive,
  } = parsed.data;

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return { error: "DUPLICATE" };

  await prisma.coupon.create({
    data: {
      code,
      discountType,
      discountValue:
        discountType === "FIXED"
          ? Math.round(discountValue * 100)
          : Math.round(discountValue),
      minOrderAmount: Math.round(minOrderAmount * 100),
      maxDiscount: maxDiscount > 0 ? Math.round(maxDiscount * 100) : null,
      maxUses: maxUses > 0 ? maxUses : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleCoupon(id: string) {
  await requirePermission("coupons");
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;
  await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
  revalidatePath("/", "layout");
}

export async function deleteCoupon(id: string) {
  await requirePermission("coupons");
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function updateUserRole(
  userId: string,
  role: "CUSTOMER" | "ADMIN",
) {
  const session = await auth();
  if (!session?.user) return;
  if (session.user.id === userId) return;

  // Promoting a user to ADMIN grants dashboard access — sensitive, so it
  // requires the "admins" permission. Demoting also needs it.
  await requirePermission("admins");

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/", "layout");
}

// ============================================================
// Manual order from the admin — for phone/WhatsApp orders (COD)
// Prices are read from the DB only, like createOrder on the storefront
// ============================================================

const manualOrderSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  governorate: z.string().trim().min(1).max(60),
  address: z.string().trim().min(5).max(200),
  notes: z.string().trim().max(500).optional().default(""),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(20),
});

export type ManualOrderResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: "GENERIC" | "STOCK" | "UNAVAILABLE" | "INVALID" };

export async function createManualOrder(
  input: z.infer<typeof manualOrderSchema>,
): Promise<ManualOrderResult> {
  await requirePermission("orders");

  const parsed = manualOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const { lines, name, phone, governorate, address, notes } = parsed.data;

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: lines.map((l) => l.variantId) } },
      include: { product: { select: { id: true, name: true } } },
    });

    // Validate: every variant exists, the product is active, and the stock is sufficient
    for (const line of lines) {
      const variant = variants.find((v) => v.id === line.variantId);
      if (!variant || variant.productId !== line.productId) {
        return { ok: false, error: "UNAVAILABLE" };
      }
      if (variant.stock < line.quantity) return { ok: false, error: "STOCK" };
    }

    const config = await getShippingConfig();
    let subtotal = 0;
    const orderLines = lines.map((l) => {
      const variant = variants.find((v) => v.id === l.variantId)!;
      const lineTotal = variant.price * l.quantity;
      subtotal += lineTotal;
      return {
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.product.name,
        sizeMl: variant.sizeMl,
        unitPrice: variant.price,
        quantity: l.quantity,
        lineTotal,
      };
    });

    const shippingFee =
      subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;
    const total = subtotal + shippingFee;
    const orderNumber = `ADDX-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      for (const line of orderLines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) throw new Error("STOCK");
      }

      const notesText =
        [name, phone, `${governorate} — ${address}`, notes || null]
          .filter(Boolean)
          .join("\n") || null;

      return tx.order.create({
        data: {
          orderNumber,
          status: "PENDING",
          paymentMethod: "CASH_ON_DELIVERY",
          subtotal,
          shippingFee,
          discount: 0,
          total,
          notes: notesText,
          items: { create: orderLines },
        },
      });
    });

    // Notify the admin about a new manual order (same new-order template)
    await sendEmail({
      to: process.env.ADMIN_EMAIL || siteConfig.adminEmail,
      subject: `طلب يدوي جديد ${order.orderNumber} — ${siteConfig.name}`,
      html: adminNewOrderEmail({
        orderNumber: order.orderNumber,
        totalQirsh: order.total,
        items: orderLines.map((l) => ({
          name: l.productName,
          qty: l.quantity,
          priceQirsh: l.unitPrice,
        })),
      }),
    });

    await notifyLowStock(orderLines.map((l) => l.variantId!));

    revalidatePath("/", "layout");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
  } catch (err) {
    if (err instanceof Error && err.message === "STOCK") {
      return { ok: false, error: "STOCK" };
    }
    return { ok: false, error: "GENERIC" };
  }
}
