"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

// Search input — submits to /:lang/catalog?q=... so the catalog page
// (a Server Component) filters the products by name.
export function SearchBox({
  locale,
  labels,
  fullWidth = false,
}: {
  locale: string;
  labels: { placeholder: string };
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    const qs = params.toString();
    router.push(`/${locale}/catalog${qs ? `?${qs}` : ""}`);
  };

  return (
    <form onSubmit={onSubmit} role="search" className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        className={
          fullWidth
            ? "h-10 w-full rounded-lg border border-border bg-background/60 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "h-9 w-36 rounded-lg border border-border bg-background/60 pl-8 pr-3 text-sm outline-none transition-[width] duration-300 focus:w-52 focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
        }
      />
      <Search
        aria-hidden
        className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </form>
  );
}
