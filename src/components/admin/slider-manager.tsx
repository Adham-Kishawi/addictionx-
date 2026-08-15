"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Save,
  Search,
  GripVertical,
  BarChart3,
  X,
} from "lucide-react";
import {
  addSlide,
  updateSlide,
  removeSlide,
  reorderSlides,
  toggleSlideActive,
} from "@/features/admin/slider-actions";
import {
  SliderPreview,
  type PreviewCollection,
} from "@/components/admin/slider-preview";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { ImageAdjust } from "@/lib/image-adjust";

// Full home-slider control from the dashboard: live preview, smart product
// picker (search + no duplicates), drag-to-reorder, custom image + captions,
// hide / edit / remove. Every change mirrors to the DB server action and the
// list updates locally (no page reload); errors revert the optimistic change.

type SlideProduct = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  image: string | null;
  collection: string | null;
  isActive: boolean;
  price: number;
};

type SlideRow = {
  id: string;
  position: number;
  isActive: boolean;
  image: string | null;
  imageAdjust?: ImageAdjust | null;
  captionAr: string | null;
  captionEn: string | null;
  product: SlideProduct;
};

type ProductOption = Omit<SlideProduct, "isActive">;

export function SliderManager({
  slides: initialSlides,
  products,
  collections,
  locale,
  dict,
}: {
  slides: SlideRow[];
  products: ProductOption[];
  collections: PreviewCollection[];
  locale: string;
  dict: Dictionary;
}) {
  const isRtl = locale === "ar";
  const [slides, setSlides] = useState<SlideRow[]>(initialSlides);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add-slide form
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [addImage, setAddImage] = useState("");
  const [addAdjust, setAddAdjust] = useState<ImageAdjust | null>(null);
  const [addCaptionAr, setAddCaptionAr] = useState("");
  const [addCaptionEn, setAddCaptionEn] = useState("");

  // Inline editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editImage, setEditImage] = useState("");
  const [editAdjust, setEditAdjust] = useState<ImageAdjust | null>(null);
  const [editCaptionAr, setEditCaptionAr] = useState("");
  const [editCaptionEn, setEditCaptionEn] = useState("");

  // Drag & drop
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const alreadyAdded = new Set(slides.map((s) => s.product.id));

  // ============ Mutations (optimistic, revert on error) ============

  const fail = (res: { error?: string }) => {
    if (res.error === "DUPLICATE") {
      setError(dict.admin.sliderAlreadyAdded);
    } else if (res.error === "INVALID_IMAGE") {
      setError(dict.admin.errorGeneric);
    } else {
      setError(dict.admin.errorGeneric);
    }
  };

  const handleAdd = async () => {
    if (!selectedId) return;
    const product = products.find((p) => p.id === selectedId);
    if (!product || alreadyAdded.has(product.id)) return;
    setBusy(true);
    setError(null);
    const res = await addSlide(product.id, {
      image: addImage,
      imageAdjust: addAdjust ? JSON.stringify(addAdjust) : "",
      captionAr: addCaptionAr,
      captionEn: addCaptionEn,
    });
    setBusy(false);
    if (res.error || !res.id) {
      fail(res);
      return;
    }
    setSlides((prev) => [
      ...prev,
      {
        id: res.id!,
        position: prev.length * 10 + 10,
        isActive: true,
        image: addImage || null,
        imageAdjust: addAdjust,
        captionAr: addCaptionAr || null,
        captionEn: addCaptionEn || null,
        product: { ...product, isActive: true },
      },
    ]);
    setSelectedId("");
    setSearch("");
    setAddImage("");
    setAddAdjust(null);
    setAddCaptionAr("");
    setAddCaptionEn("");
  };

  const applyOrder = async (next: SlideRow[]) => {
    const prev = slides;
    setSlides(next);
    setError(null);
    const res = await reorderSlides(next.map((s) => s.id));
    if (res.error) {
      setSlides(prev);
      setError(dict.admin.errorGeneric);
    }
  };

  const moveSlide = (id: string, direction: "up" | "down") => {
    const index = slides.findIndex((s) => s.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    void applyOrder(next);
  };

  const onDropAt = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const from = slides.findIndex((s) => s.id === dragId);
    const to = slides.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    void applyOrder(next);
  };

  const handleToggle = async (id: string) => {
    const prev = slides;
    setSlides((cur) =>
      cur.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
    setError(null);
    const res = await toggleSlideActive(id);
    if (res.error) {
      setSlides(prev);
      setError(dict.admin.errorGeneric);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm(dict.admin.deleteConfirm)) return;
    const prev = slides;
    setSlides((cur) => cur.filter((s) => s.id !== id));
    setError(null);
    const res = await removeSlide(id);
    if (res.error) {
      setSlides(prev);
      setError(dict.admin.errorGeneric);
    }
  };

  const handleEditSave = async (id: string) => {
    const prev = slides;
    setSlides((cur) =>
      cur.map((s) =>
        s.id === id
          ? {
              ...s,
              image: editImage || null,
              imageAdjust: editAdjust,
              captionAr: editCaptionAr || null,
              captionEn: editCaptionEn || null,
            }
          : s,
      ),
    );
    setError(null);
    const res = await updateSlide(id, {
      image: editImage,
      imageAdjust: editAdjust ? JSON.stringify(editAdjust) : "",
      captionAr: editCaptionAr,
      captionEn: editCaptionEn,
    });
    if (res.error) {
      setSlides(prev);
      setError(dict.admin.errorGeneric);
      return;
    }
    setEditingId(null);
  };

  const openEdit = (slide: SlideRow) => {
    setEditingId(slide.id);
    setEditImage(slide.image ?? "");
    setEditAdjust(slide.imageAdjust ?? null);
    setEditCaptionAr(slide.captionAr ?? "");
    setEditCaptionEn(slide.captionEn ?? "");
  };

  // ============ Derived ============

  const visibleCount = slides.filter(
    (s) => s.isActive && s.product.isActive,
  ).length;
  const hiddenCount = slides.length - visibleCount;
  const inactiveProductCount = slides.filter((s) => !s.product.isActive).length;

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nameEn ?? "").toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.collection ?? "").toLowerCase().includes(q)
    );
  });

  const selectedProduct = products.find((p) => p.id === selectedId);

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
        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-2xl font-bold">{slides.length}</p>
          <p className="text-xs text-muted-foreground">{dict.admin.slider}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-2xl font-bold text-emerald-500">{visibleCount}</p>
          <p className="text-xs text-muted-foreground">
            {dict.admin.sliderStatsVisible}
          </p>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-2xl font-bold text-destructive">
            {hiddenCount + inactiveProductCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {dict.admin.sliderStatsHidden}
          </p>
        </div>
      </div>

      {/* ===== Live preview ===== */}
      <div className="mb-6">
        <SliderPreview
          slides={slides.map((s) => ({
            id: s.id,
            image: s.image,
            imageAdjust: s.imageAdjust,
            captionAr: s.captionAr,
            captionEn: s.captionEn,
            product: {
              name: s.product.name,
              nameEn: s.product.nameEn,
              image: s.product.image,
              collection: s.product.collection,
              price: s.product.price,
            },
          }))}
          collections={collections}
          locale={locale}
          dict={dict}
        />
      </div>

      {/* ===== Add slide ===== */}
      <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <h3 className="mb-1 font-display text-lg font-bold">
          {dict.admin.sliderAdd}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {dict.admin.sliderAddHint}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.admin.sliderSearch}
            className={cn(inputCls, "ps-9")}
          />
        </div>

        {/* Product grid */}
        <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pe-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              {search ? dict.admin.sliderNoMatch : dict.admin.sliderNoProducts}
            </p>
          ) : (
            filteredProducts.map((p) => {
              const added = alreadyAdded.has(p.id);
              const active = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={added}
                  onClick={() => setSelectedId(active ? "" : p.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2 text-start transition-colors",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border bg-background hover:border-primary/40",
                    added && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {isRtl ? p.name : p.nameEn || p.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      /{p.slug}
                      {p.collection ? ` · ${p.collection}` : ""}
                    </p>
                  </div>
                  {added && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {dict.admin.sliderAlreadyAdded}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Selected product + image + captions */}
        {selectedProduct && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ImageUploader
                value={addImage}
                onChange={setAddImage}
                label={dict.admin.sliderCustomImage}
                hint={dict.admin.sliderCustomImageHint}
                dict={dict}
                adjustable
                adjust={addAdjust}
                onAdjustChange={setAddAdjust}
                adjustAspect="3 / 5"
              />
            </div>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              {dict.admin.sliderCaptionAr}
              <input
                type="text"
                value={addCaptionAr}
                onChange={(e) => setAddCaptionAr(e.target.value)}
                maxLength={300}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              {dict.admin.sliderCaptionEn}
              <input
                type="text"
                value={addCaptionEn}
                onChange={(e) => setAddCaptionEn(e.target.value)}
                maxLength={300}
                dir="ltr"
                className={inputCls}
              />
            </label>
          </div>
        )}

        <div className="mt-4">
          <Button
            type="button"
            onClick={() => void handleAdd()}
            disabled={busy || !selectedId}
            className="rounded-full px-6"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {dict.admin.sliderAdd}
          </Button>
        </div>
      </div>

      {/* ===== Slides ===== */}
      {slides.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.sliderEmpty}
        </p>
      ) : (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="size-4" />
            {dict.admin.sliderDragHint}
          </p>
          <div className="flex flex-col gap-3">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable={!busy && editingId !== slide.id}
                onDragStart={(e) => {
                  setDragId(slide.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragId !== slide.id) setOverId(slide.id);
                }}
                onDragLeave={() =>
                  setOverId((cur) => (cur === slide.id ? null : cur))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  onDropAt(slide.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "rounded-2xl border border-border bg-card/40 p-4 transition-shadow",
                  overId === slide.id && dragId !== slide.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border",
                  dragId === slide.id && "opacity-40",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/60 active:cursor-grabbing" />
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {(slide.image ?? slide.product.image) ? (
                        <Image
                          src={slide.image ?? slide.product.image ?? ""}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {isRtl
                          ? slide.product.name
                          : slide.product.nameEn || slide.product.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{slide.product.slug}
                        {slide.product.collection
                          ? ` · ${slide.product.collection}`
                          : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {slide.image && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {dict.admin.sliderCustomImage}
                          </span>
                        )}
                        {!slide.isActive && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {dict.admin.slideHidden}
                          </span>
                        )}
                        {!slide.product.isActive && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            {dict.admin.sliderStatsInactive}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || index === 0}
                      onClick={() => moveSlide(slide.id, "up")}
                      title={dict.admin.moveUp}
                      aria-label={dict.admin.moveUp}
                      className={iconBtn}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || index === slides.length - 1}
                      onClick={() => moveSlide(slide.id, "down")}
                      title={dict.admin.moveDown}
                      aria-label={dict.admin.moveDown}
                      className={iconBtn}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleToggle(slide.id)}
                      title={
                        slide.isActive
                          ? dict.admin.slideHidden
                          : dict.admin.slideVisible
                      }
                      aria-label={
                        slide.isActive
                          ? dict.admin.slideHidden
                          : dict.admin.slideVisible
                      }
                      className={`inline-flex size-8 items-center justify-center rounded-lg border transition-colors disabled:pointer-events-none disabled:opacity-30 ${
                        slide.isActive
                          ? "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                          : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                      }`}
                    >
                      {slide.isActive ? (
                        <Eye className="size-4" />
                      ) : (
                        <EyeOff className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(slide)}
                      title={dict.admin.sliderEdit}
                      aria-label={dict.admin.sliderEdit}
                      className={iconBtn}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRemove(slide.id)}
                      title={dict.admin.sliderRemove}
                      aria-label={dict.admin.sliderRemove}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Inline editor */}
                {editingId === slide.id && (
                  <div className="mt-4 grid gap-4 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <ImageUploader
                        value={editImage}
                        onChange={setEditImage}
                        label={dict.admin.sliderCustomImage}
                        hint={dict.admin.sliderCustomImageHint}
                        dict={dict}
                        adjustable
                        adjust={editAdjust}
                        onAdjustChange={setEditAdjust}
                        adjustAspect="3 / 5"
                      />
                    </div>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      {dict.admin.sliderCaptionAr}
                      <input
                        type="text"
                        value={editCaptionAr}
                        onChange={(e) => setEditCaptionAr(e.target.value)}
                        maxLength={300}
                        className={inputCls}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      {dict.admin.sliderCaptionEn}
                      <input
                        type="text"
                        value={editCaptionEn}
                        onChange={(e) => setEditCaptionEn(e.target.value)}
                        maxLength={300}
                        dir="ltr"
                        className={inputCls}
                      />
                    </label>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleEditSave(slide.id)}
                        className="rounded-full px-5"
                      >
                        <Save className="size-4" />
                        {dict.admin.save}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
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
