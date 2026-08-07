// إعدادات المتجر القابلة للتعديل من اللوحة — تُقرأ من الـ DB مع بدائل افتراضية
// حتى يعمل كل شيء حتى لو المفاتيح غير موجودة بعد (أو حدث خطأ قراءة).
import { prisma } from "@/lib/prisma";

export const DEFAULT_SHIPPING_FEE = 5000; // 50 ج.م بالقروش
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 150000; // 1500 ج.م بالقروش
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
      shippingFee: rawFee
        ? Number(rawFee) || DEFAULT_SHIPPING_FEE
        : DEFAULT_SHIPPING_FEE,
      freeShippingThreshold: rawThreshold
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

// لتصفية الكاش عند التحديث من اللوحة
export function clearConfigCache() {
  cache.clear();
}
