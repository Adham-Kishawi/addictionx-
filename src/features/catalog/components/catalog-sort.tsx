"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

const sortOptions = [
  { value: "popular", key: "sortPopular" },
  { value: "newest", key: "sortNewest" },
  { value: "price-asc", key: "sortPriceAsc" },
  { value: "price-desc", key: "sortPriceDesc" },
  { value: "rating", key: "sortRating" },
] as const;

export function CatalogSort({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);
  const current = (searchParams.get("sort") ?? "popular") as string;

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "popular") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(`/${locale}/catalog${qs ? `?${qs}` : ""}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {dict.catalog[opt.key]}
        </option>
      ))}
    </select>
  );
}
