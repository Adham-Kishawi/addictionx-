"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { savePaymentSettings } from "@/lib/shipping";

export type ZoneActionState = { error?: string; success?: boolean };

const governorateSchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
});

const regionSchema = z.object({
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  shippingFeeEgp: z.coerce.number().nonnegative().max(100000),
});

const paymentSettingsSchema = z.object({
  cardEnabled: z.boolean(),
  walletEnabled: z.boolean(),
});

// ============================================================
// Governorates
// ============================================================

export async function createGovernorate(
  _prev: ZoneActionState | undefined,
  fd: FormData,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  const parsed = governorateSchema.safeParse({
    nameAr: fd.get("nameAr"),
    nameEn: fd.get("nameEn"),
  });
  if (!parsed.success) return { error: "INVALID" };

  const maxSort = await prisma.governorate.aggregate({
    _max: { sortOrder: true },
  });

  await prisma.governorate.create({
    data: {
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleGovernorateActive(
  governorateId: string,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  const row = await prisma.governorate.findUnique({
    where: { id: governorateId },
    select: { isActive: true },
  });
  if (!row) return { error: "INVALID" };

  await prisma.governorate.update({
    where: { id: governorateId },
    data: { isActive: !row.isActive },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteGovernorate(
  governorateId: string,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  await prisma.governorate.deleteMany({ where: { id: governorateId } });
  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Regions
// ============================================================

export async function createRegion(
  governorateId: string,
  _prev: ZoneActionState | undefined,
  fd: FormData,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  const parsed = regionSchema.safeParse({
    nameAr: fd.get("nameAr"),
    nameEn: fd.get("nameEn"),
    shippingFeeEgp: fd.get("shippingFeeEgp"),
  });
  if (!parsed.success) return { error: "INVALID" };

  const maxSort = await prisma.region.aggregate({
    _max: { sortOrder: true },
    where: { governorateId },
  });

  await prisma.region.create({
    data: {
      governorateId,
      nameAr: parsed.data.nameAr,
      nameEn: parsed.data.nameEn,
      shippingFee: Math.round(parsed.data.shippingFeeEgp * 100),
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleRegionActive(
  regionId: string,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  const row = await prisma.region.findUnique({
    where: { id: regionId },
    select: { isActive: true },
  });
  if (!row) return { error: "INVALID" };

  await prisma.region.update({
    where: { id: regionId },
    data: { isActive: !row.isActive },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteRegion(regionId: string): Promise<ZoneActionState> {
  await requirePermission("settings");
  await prisma.region.deleteMany({ where: { id: regionId } });
  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Payment settings (which methods appear at checkout)
// ============================================================

export async function updatePaymentSettings(
  _prev: ZoneActionState | undefined,
  fd: FormData,
): Promise<ZoneActionState> {
  await requirePermission("settings");
  const parsed = paymentSettingsSchema.safeParse({
    cardEnabled: fd.get("cardEnabled") === "on",
    walletEnabled: fd.get("walletEnabled") === "on",
  });
  if (!parsed.success) return { error: "INVALID" };

  await savePaymentSettings({
    cardEnabled: parsed.data.cardEnabled,
    walletEnabled: parsed.data.walletEnabled,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
