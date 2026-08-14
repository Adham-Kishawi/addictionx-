// Shipping zones service — governorate → regions with per-region fees.
// The checkout fee is computed here server-side from the DB; the client only
// passes the chosen governorate/region ids. When no zones are configured the
// flat shipping_fee setting is used as a fallback.
import { prisma } from "@/lib/prisma";
import { getShippingConfig, clearConfigCache } from "@/lib/store-config";

export type RegionDto = {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingFee: number; // piasters
};

export type GovernorateDto = {
  id: string;
  nameAr: string;
  nameEn: string;
  regions: RegionDto[];
};

export type PaymentSettings = {
  cardEnabled: boolean;
  walletEnabled: boolean;
};

// Only active governorates and their active regions, sorted for display.
export async function getShippingZones(): Promise<GovernorateDto[]> {
  const rows = await prisma.governorate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      regions: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return rows.map((g) => ({
    id: g.id,
    nameAr: g.nameAr,
    nameEn: g.nameEn,
    regions: g.regions.map((r) => ({
      id: r.id,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      shippingFee: r.shippingFee,
    })),
  }));
}

export type GovernorateAdminDto = {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  regions: (RegionDto & { isActive: boolean })[];
};

// For the admin panel — includes inactive rows so they can be toggled.
export async function getAllGovernorates(): Promise<GovernorateAdminDto[]> {
  const rows = await prisma.governorate.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      regions: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map((g) => ({
    id: g.id,
    nameAr: g.nameAr,
    nameEn: g.nameEn,
    isActive: g.isActive,
    regions: g.regions.map((r) => ({
      id: r.id,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      shippingFee: r.shippingFee,
      isActive: r.isActive,
    })),
  }));
}

export function nameFor(
  locale: string,
  ar: string | null,
  en: string | null,
): string {
  if (locale === "ar") return ar ?? en ?? "";
  return en ?? ar ?? "";
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const row = await prisma.storeSetting.findUnique({
      where: { key: "payment_settings" },
    });
    if (!row) return { cardEnabled: true, walletEnabled: false };
    const parsed = JSON.parse(row.value) as Partial<PaymentSettings>;
    return {
      cardEnabled: parsed.cardEnabled !== false,
      walletEnabled: parsed.walletEnabled === true,
    };
  } catch {
    return { cardEnabled: true, walletEnabled: false };
  }
}

export async function savePaymentSettings(settings: PaymentSettings) {
  await prisma.storeSetting.upsert({
    where: { key: "payment_settings" },
    create: { key: "payment_settings", value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
  clearConfigCache();
}

export type ShippingQuote = {
  fee: number; // piasters, 0 = free shipping
  governorateId: string | null;
  regionId: string | null;
  governorateAr: string | null;
  governorateEn: string | null;
  regionAr: string | null;
  regionEn: string | null;
};

// Server-side shipping fee: matches the governorate+region the customer picked.
// If they don't exist / are inactive, falls back to the flat fee.
export async function computeShippingFee(input: {
  governorateId?: string | null;
  regionId?: string | null;
  subtotal: number; // piasters, AFTER coupon discount (free-shipping threshold applies to the payable subtotal)
}): Promise<ShippingQuote> {
  const config = await getShippingConfig();

  let matched: {
    governorateId: string;
    regionId: string;
    governorateAr: string;
    governorateEn: string;
    regionAr: string;
    regionEn: string;
    fee: number;
  } | null = null;

  if (input.governorateId && input.regionId) {
    const region = await prisma.region.findFirst({
      where: {
        id: input.regionId,
        isActive: true,
        governorate: { id: input.governorateId, isActive: true },
      },
      include: { governorate: true },
    });
    if (region) {
      matched = {
        governorateId: region.governorate.id,
        regionId: region.id,
        governorateAr: region.governorate.nameAr,
        governorateEn: region.governorate.nameEn,
        regionAr: region.nameAr,
        regionEn: region.nameEn,
        fee: region.shippingFee,
      };
    }
  }

  const baseFee = matched?.fee ?? config.shippingFee;
  const fee = input.subtotal >= config.freeShippingThreshold ? 0 : baseFee;

  return {
    fee,
    governorateId: matched?.governorateId ?? null,
    regionId: matched?.regionId ?? null,
    governorateAr: matched?.governorateAr ?? null,
    governorateEn: matched?.governorateEn ?? null,
    regionAr: matched?.regionAr ?? null,
    regionEn: matched?.regionEn ?? null,
  };
}
