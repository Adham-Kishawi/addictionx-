import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Pagination bar for the storefront — used by /catalog and /[lang]/collections/:slug.
// Receives the current query string so every page link keeps all active filters.

export function Pagination({
  baseHref,
  query,
  page,
  totalPages,
  labels,
  className,
}: {
  baseHref: string;
  query: string;
  page: number;
  totalPages: number;
  labels: { prev: string; next: string; page: string; of: string };
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(query);
    if (p === 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return `${baseHref}${qs ? `?${qs}` : ""}`;
  };

  const btnCls =
    "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm transition-colors hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-12 flex items-center justify-center gap-3", className)}
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btnCls}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {labels.prev}
        </Link>
      ) : (
        <span className={cn(btnCls, "pointer-events-none")}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {labels.prev}
        </span>
      )}

      <span className="px-2 text-sm text-muted-foreground">
        {labels.page} {page} {labels.of} {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={btnCls}>
          {labels.next}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span className={cn(btnCls, "pointer-events-none")}>
          {labels.next}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
      )}
    </nav>
  );
}
