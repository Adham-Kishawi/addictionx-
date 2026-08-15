"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Save,
  Search,
  GripVertical,
  BarChart3,
  X,
  Home,
} from "lucide-react";
import {
  addCollectionToHome,
  removeCollectionFromHome,
  reorderCollections,
  updateCollectionSlider,
} from "@/features/admin/collections-actions";
import {
  CollectionPreview,
  type PreviewCollectionCard,
} from "@/components/admin/collection-preview";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

// Home "Our Collections" section manager — the same experience as the product
// slider manager: live preview, a searchable picker (no duplicates), drag to
// reorder, and inline editing of each card's image + captions. Every change
// mirrors to the DB and updates locally (no page reload); errors revert.

export type HomeCollectionRow = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  showInHome: boolean;
  isActive: boolean;
};

export function HomeCollectionsManager({
  collections,
  locale,
  dict,
}: {
  collections: HomeCollectionRow[];
  locale: string;
  dict: Dictionary;
}) {
  const isRtl = locale === "ar";
  const [items, setItems] = useState<HomeCollectionRow[]>(collections);
  const [order, setOrder] = useState<string[]>(
    collections.filter((c) => c.showInHome).map((c) => c.slug),
  );

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Picker
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");

  // Inline editor
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editImage, setEditImage] = useState("");
  const [editDescAr, setEditDescAr] = useState("");
  const [editDescEn, setEditDescEn] = useState("");

  // Drag & drop
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const [overSlug, setOverSlug] = useState<string | null>(null);

  const homeRows = order
    .map((slug) => items.find((c) => c.slug === slug))
    .filter((c): c is HomeCollectionRow => Boolean(c));
  const notInHome = items.filter((c) => !order.includes(c.slug));

  const inHomeCount = homeRows.length;
  const hiddenFromHomeCount = items.length - inHomeCount;
  const inactiveSiteCount = items.filter((c) => !c.isActive).length;

  const homePreview: PreviewCollectionCard[] = homeRows.map((c) => ({
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    image: c.image,
    descriptionAr: c.descriptionAr,
    descriptionEn: c.descriptionEn,
    showInHome: true,
    isActive: c.isActive,
  }));

  const patch = (slug: string, update: Partial<HomeCollectionRow>) =>
    setItems((cur) =>
      cur.map((c) => (c.slug === slug ? { ...c, ...update } : c)),
    );

  // ============ Mutations (optimistic, revert on error) ============

  const handleAdd = async (slug: string) => {
    const prev = { order, items };
    setOrder((cur) => [...cur, slug]);
    patch(slug, { showInHome: true });
    setSelectedSlug("");
    setSearch("");
    setError(null);
    setBusy(true);
    const res = await addCollectionToHome(slug);
    setBusy(false);
    if (res.error) {
      setItems(prev.items);
      setOrder(prev.order);
      setError(dict.admin.errorGeneric);
    }
  };

  const handleRemove = async (slug: string) => {
    const prev = { order, items };
    setOrder((cur) => cur.filter((s) => s !== slug));
    patch(slug, { showInHome: false });
    setError(null);
    setBusy(true);
    const res = await removeCollectionFromHome(slug);
    setBusy(false);
    if (res.error) {
      setItems(prev.items);
      setOrder(prev.order);
      setError(dict.admin.errorGeneric);
    }
  };

  const applyOrder = async (next: string[]) => {
    const prev = order;
    setOrder(next);
    setError(null);
    setBusy(true);
    const res = await reorderCollections(next);
    setBusy(false);
    if (res.error) {
      setOrder(prev);
      setError(dict.admin.errorGeneric);
    }
  };

  const move = (slug: string, direction: "up" | "down") => {
    const index = order.indexOf(slug);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    void applyOrder(next);
  };

  const onDropAt = (targetSlug: string) => {
    if (!dragSlug || dragSlug === targetSlug) {
      setDragSlug(null);
      setOverSlug(null);
      return;
    }
    const from = order.indexOf(dragSlug);
    const to = order.indexOf(targetSlug);
    if (from < 0 || to < 0) {
      setDragSlug(null);
      setOverSlug(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragSlug(null);
    setOverSlug(null);
    void applyOrder(next);
  };

  const handleEditSave = async (slug: string) => {
    const prev = items;
    patch(slug, {
      image: editImage || null,
      descriptionAr: editDescAr || null,
      descriptionEn: editDescEn || null,
    });
    setError(null);
    setBusy(true);
    const res = await updateCollectionSlider(slug, {
      image: editImage,
      descriptionAr: editDescAr,
      descriptionEn: editDescEn,
    });
    setBusy(false);
    if (res.error) {
      setItems(prev);
      setError(dict.admin.errorGeneric);
      return;
    }
    setEditingSlug(null);
  };

  const openEdit = (collection: HomeCollectionRow) => {
    setEditingSlug(collection.slug);
    setEditImage(collection.image ?? "");
    setEditDescAr(collection.descriptionAr ?? "");
    setEditDescEn(collection.descriptionEn ?? "");
  };

  // ============ Picker ============

  const filteredNotInHome = notInHome.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  const iconBtn =
    "inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30";

  const inputCls =
    "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ===== Stats bar ===== */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-2xl font-bold text-emerald-500">{inHomeCount}</p>
          <p className="text-xs text-muted-foreground">
            {dict.admin.homeCollectionsStatsInHome}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-2xl font-bold">{hiddenFromHomeCount}</p>
          <p className="text-xs text-muted-foreground">
            {dict.admin.homeCollectionsStatsHidden}
          </p>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-2xl font-bold text-destructive">
            {inactiveSiteCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {dict.admin.homeCollectionsStatsInactive}
          </p>
        </div>
      </div>

      {/* ===== Live preview ===== */}
      <div className="mb-6">
        <CollectionPreview
          collections={homePreview}
          locale={locale}
          dict={dict}
        />
      </div>

      {/* ===== Add to section ===== */}
      <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
          <Home className="size-4 text-primary" />
          {dict.admin.homeCollectionsAdd}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {dict.admin.homeCollectionsAddHint}
        </p>

        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.admin.homeCollectionsSearch}
            className={cn(inputCls, "ps-9")}
          />
        </div>

        {filteredNotInHome.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search
              ? dict.admin.homeCollectionsNoMatch
              : dict.admin.homeCollectionsAllAdded}
          </p>
        ) : (
          <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pe-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotInHome.map((c) => {
              const active = selectedSlug === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  disabled={!c.isActive}
                  onClick={() => setSelectedSlug(active ? "" : c.slug)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2 text-start transition-colors",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border bg-background hover:border-primary/40",
                    !c.isActive && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {isRtl ? c.nameAr : c.nameEn}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      /{c.slug}
                    </p>
                  </div>
                  {!c.isActive && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {dict.admin.homeCollectionsInactive}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <Button
            type="button"
            onClick={() =>
              selectedSlug ? void handleAdd(selectedSlug) : undefined
            }
            disabled={busy || !selectedSlug}
            className="rounded-full px-6"
          >
            <Plus className="size-4" />
            {dict.admin.homeCollectionsAdd}
          </Button>
        </div>
      </div>

      {/* ===== In-home list ===== */}
      {homeRows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {dict.admin.homeCollectionsEmpty}
        </p>
      ) : (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="size-4" />
            {dict.admin.homeCollectionsDragHint}
          </p>
          <div className="flex flex-col gap-3">
            {homeRows.map((collection, index) => (
              <div
                key={collection.slug}
                draggable={!busy && editingSlug !== collection.slug}
                onDragStart={(e) => {
                  setDragSlug(collection.slug);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragSlug !== collection.slug)
                    setOverSlug(collection.slug);
                }}
                onDragLeave={() =>
                  setOverSlug((cur) => (cur === collection.slug ? null : cur))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  onDropAt(collection.slug);
                }}
                onDragEnd={() => {
                  setDragSlug(null);
                  setOverSlug(null);
                }}
                className={cn(
                  "rounded-2xl border border-border bg-card/40 p-4 transition-shadow",
                  overSlug === collection.slug &&
                    dragSlug !== collection.slug &&
                    "border-primary ring-2 ring-primary/30",
                  dragSlug === collection.slug && "opacity-40",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing" />
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {collection.image ? (
                        <Image
                          src={collection.image}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {isRtl ? collection.nameAr : collection.nameEn}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{collection.slug}
                      </p>
                      {!collection.isActive && (
                        <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          {dict.admin.homeCollectionsInactiveSite}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => move(collection.slug, "up")}
                      title={dict.admin.moveUp}
                      aria-label={dict.admin.moveUp}
                      className={iconBtn}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === homeRows.length - 1}
                      onClick={() => move(collection.slug, "down")}
                      title={dict.admin.moveDown}
                      aria-label={dict.admin.moveDown}
                      className={iconBtn}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(collection)}
                      title={dict.admin.homeCollectionsEdit}
                      aria-label={dict.admin.homeCollectionsEdit}
                      className={iconBtn}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRemove(collection.slug)}
                      title={dict.admin.homeCollectionsRemove}
                      aria-label={dict.admin.homeCollectionsRemove}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Inline editor */}
                {editingSlug === collection.slug && (
                  <div className="mt-4 grid gap-4 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">
                      {dict.admin.homeCollectionsImage}
                      <input
                        type="text"
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        placeholder="/api/uploads/..."
                        dir="ltr"
                        maxLength={500}
                        className={cn(inputCls, "font-mono")}
                      />
                      <span className="text-[11px] font-normal">
                        {dict.admin.homeCollectionsImageNote}
                      </span>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      {dict.admin.homeCollectionsDescAr}
                      <input
                        type="text"
                        value={editDescAr}
                        onChange={(e) => setEditDescAr(e.target.value)}
                        maxLength={300}
                        className={inputCls}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      {dict.admin.homeCollectionsDescEn}
                      <input
                        type="text"
                        value={editDescEn}
                        onChange={(e) => setEditDescEn(e.target.value)}
                        maxLength={300}
                        dir="ltr"
                        className={inputCls}
                      />
                    </label>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleEditSave(collection.slug)}
                        className="rounded-full px-5"
                      >
                        <Save className="size-4" />
                        {dict.admin.save}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSlug(null)}
                      >
                        <X className="size-4" />
                        {dict.admin.cancel}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
