"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  addSlide,
  updateSlide,
  removeSlide,
  reorderSlide,
  toggleSlideActive,
} from "@/features/admin/slider-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Full home-slider control from the dashboard: pick any product, set a custom
// image + caption, reorder / hide / edit / remove each slide.

type SlideProduct = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  image: string | null;
  collection: string | null;
  isActive: boolean;
};

type SlideRow = {
  id: string;
  position: number;
  isActive: boolean;
  image: string | null;
  captionAr: string | null;
  captionEn: string | null;
  product: SlideProduct;
};

export function SliderManager({
  slides,
  products,
  locale,
  dict,
}: {
  slides: SlideRow[];
  products: Omit<SlideProduct, "isActive">[];
  locale: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const isRtl = locale === "ar";

  const [selectedId, setSelectedId] = useState("");
  const [addImage, setAddImage] = useState("");
  const [addCaptionAr, setAddCaptionAr] = useState("");
  const [addCaptionEn, setAddCaptionEn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline editor state (one slide at a time)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editImage, setEditImage] = useState("");
  const [editCaptionAr, setEditCaptionAr] = useState("");
  const [editCaptionEn, setEditCaptionEn] = useState("");
  const [editPending, setEditPending] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data?.url) return null;
      return data.url as string;
    } catch {
      return null;
    }
  };

  const onPick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (url) setUrl(url);
  };

  const selectedProduct = products.find((p) => p.id === selectedId);

  const onSubmitAdd = async () => {
    if (!selectedId) {
      setError(dict.admin.sliderSelectProduct);
      return;
    }
    setPending(true);
    setError(null);
    const res = await addSlide(selectedId, {
      image: addImage,
      captionAr: addCaptionAr,
      captionEn: addCaptionEn,
    });
    setPending(false);
    if (res.error) {
      setError(dict.admin.errorGeneric);
      return;
    }
    setSelectedId("");
    setAddImage("");
    setAddCaptionAr("");
    setAddCaptionEn("");
    router.refresh();
  };

  const run = async (fn: () => Promise<{ error?: string }>) => {
    if (pending) return;
    setPending(true);
    setError(null);
    await fn();
    setPending(false);
    router.refresh();
  };

  const openEdit = (slide: SlideRow) => {
    setEditingId(slide.id);
    setEditImage(slide.image ?? "");
    setEditCaptionAr(slide.captionAr ?? "");
    setEditCaptionEn(slide.captionEn ?? "");
  };

  const onSubmitEdit = async (id: string) => {
    setEditPending(true);
    setError(null);
    const res = await updateSlide(id, {
      image: editImage,
      captionAr: editCaptionAr,
      captionEn: editCaptionEn,
    });
    setEditPending(false);
    if (res.error) {
      setError(dict.admin.errorGeneric);
      return;
    }
    setEditingId(null);
    router.refresh();
  };

  const iconBtn =
    "inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1.5 rounded-2xl border border-dashed border-border bg-card/20 px-4 py-3">
        <h2 className="text-sm font-semibold">{dict.admin.sliderManage}</h2>
        <p className="text-xs text-muted-foreground">{dict.admin.sliderHint}</p>
      </div>

      {/* ===== Add slide ===== */}
      <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
        <h3 className="mb-1 font-display text-lg font-bold">
          {dict.admin.sliderAdd}
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          {dict.admin.sliderAddHint}
        </p>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.sliderSelectProduct}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{dict.admin.sliderSelectProduct}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {isRtl ? p.name : p.nameEn || p.name}
                {p.collection ? ` — /${p.collection}` : ""}
              </option>
            ))}
          </select>
        </label>
        {products.length === 0 && (
          <p className="mt-2 text-xs text-destructive">
            {dict.admin.sliderNoProducts}
          </p>
        )}

        {selectedProduct && (
          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <span className="text-sm font-medium">
              {isRtl
                ? selectedProduct.name
                : selectedProduct.nameEn || selectedProduct.name}
            </span>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            {dict.admin.sliderCustomImage}
            <input
              type="text"
              value={addImage}
              onChange={(e) => setAddImage(e.target.value)}
              placeholder="/api/uploads/..."
              dir="ltr"
              maxLength={500}
              className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-[11px] font-normal">
              {dict.admin.sliderCustomImageHint}
            </span>
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 self-end rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {dict.admin.uploadImage}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onPick(e, setAddImage)}
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            {dict.admin.sliderCaptionAr}
            <input
              type="text"
              value={addCaptionAr}
              onChange={(e) => setAddCaptionAr(e.target.value)}
              maxLength={300}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void onSubmitAdd()}
            disabled={pending || uploading || !selectedId}
            className="rounded-full px-6"
          >
            {pending ? (
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
        <div className="flex flex-col gap-3">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="rounded-2xl border border-border bg-card/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
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
                    {!slide.product.isActive && (
                      <p className="text-xs text-destructive">
                        {dict.admin.sliderProductInactive}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    onClick={() => void run(() => reorderSlide(slide.id, "up"))}
                    title={dict.admin.moveUp}
                    aria-label={dict.admin.moveUp}
                    className={iconBtn}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === slides.length - 1}
                    onClick={() =>
                      void run(() => reorderSlide(slide.id, "down"))
                    }
                    title={dict.admin.moveDown}
                    aria-label={dict.admin.moveDown}
                    className={iconBtn}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void run(() => toggleSlideActive(slide.id))}
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
                    disabled={pending}
                    onClick={() => openEdit(slide)}
                    title={dict.admin.sliderEdit}
                    aria-label={dict.admin.sliderEdit}
                    className={iconBtn}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(dict.admin.deleteConfirm)) {
                        void run(() => removeSlide(slide.id));
                      }
                    }}
                    title={dict.admin.sliderRemove}
                    aria-label={dict.admin.sliderRemove}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/40 text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {slide.image && (
                <p
                  className="mt-2 truncate font-mono text-[11px] text-muted-foreground"
                  dir="ltr"
                >
                  {slide.image}
                </p>
              )}

              {/* Inline editor */}
              {editingId === slide.id && (
                <div className="mt-4 grid gap-4 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                    {dict.admin.sliderCustomImage}
                    <input
                      type="text"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      placeholder="/api/uploads/..."
                      dir="ltr"
                      maxLength={500}
                      className="h-9 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 self-end rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {dict.admin.uploadImage}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => onPick(e, setEditImage)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                    {dict.admin.sliderCaptionAr}
                    <input
                      type="text"
                      value={editCaptionAr}
                      onChange={(e) => setEditCaptionAr(e.target.value)}
                      maxLength={300}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={editPending}
                      onClick={() => void onSubmitEdit(slide.id)}
                      className="rounded-full px-5"
                    >
                      {editPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {dict.admin.save}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      {dict.admin.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
