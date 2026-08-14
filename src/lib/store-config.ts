// Store settings editable from the dashboard — read from the DB with default fallbacks
// so everything works even if the keys are missing yet (or a read error occurs).
import { prisma } from "@/lib/prisma";

export const DEFAULT_SHIPPING_FEE = 5000; // 50 EGP in piasters
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150000; // 1500 EGP in piasters
export const DEFAULT_CARRIER = "Bosta";

export type ShippingConfig = {
  shippingFee: number;
  freeShippingThreshold: number;
  carrier: string;
};

// ============================================================
// Server layer (Server Components / Server Actions)
// ============================================================

const cache = new Map<string, { value: number | string; updatedAt: number }>();

async function readSetting(key: string): Promise<string | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.updatedAt < 5000) return String(hit.value);
  const row = await prisma.storeSetting.findUnique({ where: { key } });
  const value = row?.value ?? null;
  if (value !== null) {
    cache.set(key, { value, updatedAt: Date.now() });
  }
  return value;
}

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const [rawFee, rawThreshold, carrier] = await Promise.all([
      readSetting("shipping_fee_qirsh"),
      readSetting("free_shipping_threshold_qirsh"),
      readSetting("default_carrier"),
    ]);
    return {
      // null = setting missing; a stored "0" is a valid zero (never fall back)
      shippingFee:
        rawFee !== null
          ? Number(rawFee) || DEFAULT_SHIPPING_FEE
          : DEFAULT_SHIPPING_FEE,
      freeShippingThreshold:
        rawThreshold !== null
          ? Number(rawThreshold) || DEFAULT_FREE_SHIPPING_THRESHOLD
          : DEFAULT_FREE_SHIPPING_THRESHOLD,
      carrier: carrier || DEFAULT_CARRIER,
    };
  } catch {
    return {
      shippingFee: DEFAULT_SHIPPING_FEE,
      freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
      carrier: DEFAULT_CARRIER,
    };
  }
}

// ============================================================
// Homepage sections — dashboard-controlled visibility + copy.
// The Our Collections (shelf) section can be hidden entirely and
// its eyebrow/title/subtitle overridden per language.
// ============================================================

export type HomeSectionsConfig = {
  showCollections: boolean;
  collectionsEyebrow: { ar: string; en: string };
  collectionsTitle: { ar: string; en: string };
  collectionsSubtitle: { ar: string; en: string };
};

export async function getHomeSectionsConfig(): Promise<HomeSectionsConfig> {
  try {
    const [visible, eyebrowAr, eyebrowEn, titleAr, titleEn, subAr, subEn] =
      await Promise.all([
        readSetting("home_show_collections"),
        readSetting("home_collections_eyebrow_ar"),
        readSetting("home_collections_eyebrow_en"),
        readSetting("home_collections_title_ar"),
        readSetting("home_collections_title_en"),
        readSetting("home_collections_subtitle_ar"),
        readSetting("home_collections_subtitle_en"),
      ]);
    return {
      showCollections: visible !== "0",
      collectionsEyebrow: { ar: eyebrowAr ?? "", en: eyebrowEn ?? "" },
      collectionsTitle: { ar: titleAr ?? "", en: titleEn ?? "" },
      collectionsSubtitle: { ar: subAr ?? "", en: subEn ?? "" },
    };
  } catch {
    return {
      showCollections: true,
      collectionsEyebrow: { ar: "", en: "" },
      collectionsTitle: { ar: "", en: "" },
      collectionsSubtitle: { ar: "", en: "" },
    };
  }
}

// Clear the cache when settings change from the dashboard
export function clearConfigCache() {
  cache.clear();
}

// ============================================================
// Payment settings — InstaPay & Vodafone Cash account numbers
// ============================================================

export type PaymentAccountsConfig = {
  instapayNumber: string;
  instapayName: string;
  vodafoneCashNumber: string;
  vodafoneCashName: string;
};

export async function getPaymentAccountsConfig(): Promise<PaymentAccountsConfig> {
  try {
    const [instapayNum, instapayName, vodafoneNum, vodafoneName] =
      await Promise.all([
        readSetting("instapay_account_number"),
        readSetting("instapay_account_name"),
        readSetting("vodafone_cash_number"),
        readSetting("vodafone_cash_name"),
      ]);
    return {
      instapayNumber: instapayNum ?? "",
      instapayName: instapayName ?? "ADDICTIONX",
      vodafoneCashNumber: vodafoneNum ?? "",
      vodafoneCashName: vodafoneName ?? "ADDICTIONX",
    };
  } catch {
    return {
      instapayNumber: "",
      instapayName: "ADDICTIONX",
      vodafoneCashNumber: "",
      vodafoneCashName: "ADDICTIONX",
    };
  }
}
