"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

const sortOptions = [
  { value: "best-sellers", key: "sortPopular" },
  { value: "newest", key: "sortNewest" },
  { value: "price-asc", key: "sortPriceAsc" },
  { value: "price-desc", key: "sortPriceDesc" },
  { value: "top-rated", key: "sortRating" },
] as const;

export function CollectionsSort({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dict = getDictionary(locale);
  const rawCurrent = searchParams.get("sort");
  const current = rawCurrent === "popular" ? "best-sellers" : (rawCurrent ?? "best-sellers");

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    const qs = params.toString();
    router.push(pathname + (qs ? "?" + qs : ""));
  };

  return (
    <select
      id="collections-sort-select"
      aria-label={dict.catalog.sort}
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {dict.catalog[opt.key]}
        </option>
      ))}
    </select>
  );
}
