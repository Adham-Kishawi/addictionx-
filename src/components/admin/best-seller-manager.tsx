"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Flame, AlertCircle } from "lucide-react";
import { ProductArt } from "@/features/catalog/components/product-art";
import { moveBestSeller, toggleBestSeller } from "@/features/admin/actions";
import type { ProductImage } from "@prisma/client";
import type { Locale } from "@/lib/i18n/dictionary";

export type BestSellerRow = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  isBestSeller: boolean;
  bestsellerOrder: number;
  isActive: boolean;
  collection: string | null;
  images: ProductImage[];
  art: unknown;
  price: number;
};

export function BestSellerManager({
  products,
  locale,
  labels,
}: {
  products: BestSellerRow[];
  locale: Locale;
  labels: {
    hint: string;
    moveUp: string;
    moveDown: string;
    add: string;
    remove: string;
    edit: string;
    noBestSellers: string;
    count: string;
    others: string;
    errorGeneric: string;
  };
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bestSellers = products
    .filter((p) => p.isBestSeller)
    .sort((a, b) => a.bestsellerOrder - b.bestsellerOrder);
  const regular = products.filter((p) => !p.isBestSeller);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setPendingId(id);
    setError(null);
    try {
      const res = await fn();
      if (res && typeof res === "object" && "error" in res) {
        setError(labels.errorGeneric);
        return;
      }
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setPendingId(null);
      router.refresh();
    }
  };

  const Row = ({ product, rank }: { product: BestSellerRow; rank: number }) => (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ${
        product.isBestSeller
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card/40"
      }`}
    >
      <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-border">
        <ProductArt
          product={{
            nameEn: product.nameEn || product.name,
            image: product.images?.[0]?.url ?? undefined,
            art: (product.art ?? {
              from: "#1e1b4b",
              to: "#020617",
              glow: "#6366f1",
            }) as { from: string; to: string; glow: string },
          }}
          showName={false}
          className="size-11"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {product.isBestSeller && (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Flame className="size-2.5" />
            </span>
          )}
          {product.name}
        </p>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          {product.nameEn || product.slug}
          {product.isBestSeller && (
            <span className="ms-2 text-primary">
              #{String(rank + 1).padStart(2, "0")}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {product.isBestSeller && (
          <>
            <button
              type="button"
              disabled={pendingId === product.id || rank === 0}
              onClick={() =>
                run(product.id, () => moveBestSeller(product.id, "up"))
              }
              aria-label={labels.moveUp}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              disabled={
                pendingId === product.id || rank >= bestSellers.length - 1
              }
              onClick={() =>
                run(product.id, () => moveBestSeller(product.id, "down"))
              }
              aria-label={labels.moveDown}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowDown className="size-4" />
            </button>
          </>
        )}

        <Link
          href={`/${locale}/admin/products/${product.id}`}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={labels.edit}
        >
          <Pencil className="size-4" />
        </Link>

        <button
          type="button"
          disabled={pendingId === product.id}
          onClick={() => run(product.id, () => toggleBestSeller(product.id))}
          aria-label={product.isBestSeller ? labels.remove : labels.add}
          className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
            product.isBestSeller
              ? "bg-primary text-primary-foreground hover:bg-primary/80"
              : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {product.isBestSeller ? labels.remove : labels.add}
        </button>
      </div>
    </li>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-foreground">
          <Flame className="size-4 text-primary" />
          {labels.count}: {bestSellers.length}
        </p>
      </div>
      {error && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </p>
      )}
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        {labels.hint}
      </p>

      {bestSellers.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {labels.noBestSellers}
        </p>
      ) : (
        <ul className="mb-8 flex flex-col gap-2">
          {bestSellers.map((product, rank) => (
            <Row key={product.id} product={product} rank={rank} />
          ))}
        </ul>
      )}

      {regular.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {labels.others}
          </h2>
          <ul className="flex flex-col gap-2">
            {regular.map((product) => (
              <Row key={product.id} product={product} rank={-1} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
