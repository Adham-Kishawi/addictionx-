"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createProduct,
  updateProduct,
  type AdminActionState,
} from "@/features/admin/actions";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

type VariantRow = { sizeMl: string; price: string; stock: string; sku: string };

export type ProductFormInitial = {
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  collection: string;
  gender: string;
  basePrice: string;
  compareAtPrice: string;
  discountPercent: string;
  rating: string;
  reviewsCount: string;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  image: string;
  artFrom: string;
  artTo: string;
  artGlow: string;
  variants: VariantRow[];
};

const emptyInitial: ProductFormInitial = {
  name: "",
  nameEn: "",
  slug: "",
  description: "",
  descriptionEn: "",
  collection: "rush",
  gender: "UNISEX",
  basePrice: "",
  compareAtPrice: "",
  discountPercent: "",
  rating: "0",
  reviewsCount: "0",
  isNew: false,
  isBestSeller: false,
  isFeatured: false,
  isActive: true,
  notesTop: "",
  notesHeart: "",
  notesBase: "",
  image: "",
  artFrom: "#1e1b4b",
  artTo: "#020617",
  artGlow: "#6366f1",
  variants: [{ sizeMl: "100", price: "", stock: "10", sku: "" }],
};

export function ProductForm({
  locale,
  dict,
  mode,
  productId,
  collections,
  initial = emptyInitial,
}: {
  locale: Locale;
  dict: Dictionary;
  mode: "create" | "edit";
  productId?: string;
  collections?: { slug: string; nameAr: string; nameEn: string }[];
  initial?: ProductFormInitial;
}) {
  const [form, setForm] = useState<ProductFormInitial>(initial);
  const [variants, setVariants] = useState<VariantRow[]>(initial.variants);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        setError(dict.admin.uploadError);
        return;
      }
      set("image", data.url);
    } catch {
      setError(dict.admin.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const set = <K extends keyof ProductFormInitial>(
    key: K,
    value: ProductFormInitial[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const updateVariant = (index: number, key: keyof VariantRow, value: string) =>
    setVariants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );

  const onSubmit = () => {
    setError(null);

    if (!form.name.trim() || !form.slug.trim() || !form.basePrice) {
      setError(dict.admin.errorGeneric);
      return;
    }

    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("name", form.name);
    fd.set("nameEn", form.nameEn);
    fd.set("slug", form.slug);
    fd.set("description", form.description);
    fd.set("descriptionEn", form.descriptionEn);
    fd.set("collection", form.collection);
    fd.set("gender", form.gender);
    fd.set("basePrice", form.basePrice);
    fd.set("compareAtPrice", form.compareAtPrice);
    fd.set("discountPercent", form.discountPercent);
    fd.set("rating", form.rating);
    fd.set("reviewsCount", form.reviewsCount);
    fd.set("isNew", form.isNew ? "on" : "");
    fd.set("isBestSeller", form.isBestSeller ? "on" : "");
    fd.set("isFeatured", form.isFeatured ? "on" : "");
    fd.set("isActive", form.isActive ? "on" : "");
    fd.set("notesTop", form.notesTop);
    fd.set("notesHeart", form.notesHeart);
    fd.set("notesBase", form.notesBase);
    fd.set("image", form.image);
    fd.set("artFrom", form.artFrom);
    fd.set("artTo", form.artTo);
    fd.set("artGlow", form.artGlow);
    fd.set(
      "variants",
      JSON.stringify(
        variants.map((v) => ({
          sizeMl: Number(v.sizeMl),
          price: Number(v.price),
          stock: Number(v.stock || 0),
          sku: v.sku,
        })),
      ),
    );

    startTransition(async () => {
      let result: AdminActionState;
      if (mode === "create") {
        result = await createProduct(undefined, fd);
      } else {
        result = await updateProduct(productId!, undefined, fd);
      }
      if (result?.error) {
        setError(
          result.error === "SLUG_EXISTS"
            ? dict.admin.errorSlugExists
            : dict.admin.errorGeneric,
        );
      }
    });
  };

  const collectionOptions =
    collections && collections.length > 0
      ? collections
      : [
          { slug: "rush", nameAr: "الإحساس", nameEn: "The Rush" },
          { slug: "noir", nameAr: "الليل", nameEn: "Noir" },
          { slug: "gold", nameAr: "الذهبي", nameEn: "Golden Hour" },
        ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Basic info */}
      <section className="grid gap-4 rounded-2xl border border-border bg-card/40 p-5 sm:grid-cols-2">
        <Field label={dict.admin.arabicName} required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label={dict.admin.englishName}>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => set("nameEn", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.slug} required>
          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              set(
                "slug",
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .replace(/-+/g, "-"),
              )
            }
            className={inputClass}
            dir="ltr"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={dict.catalog.collectionFilter}>
            <select
              value={form.collection}
              onChange={(e) => set("collection", e.target.value)}
              className={inputClass}
            >
              {collectionOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.slug} — {locale === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </Field>
          <Field label={dict.product.gender}>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={inputClass}
            >
              <option value="MALE">{dict.product.male}</option>
              <option value="FEMALE">{dict.product.female}</option>
              <option value="UNISEX">{dict.product.unisex}</option>
            </select>
          </Field>
        </div>
        <Field label={dict.admin.arabicDescription}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={cn(inputClass, "min-h-24 resize-y")}
            rows={3}
          />
        </Field>
        <Field label={dict.admin.englishDescription}>
          <textarea
            value={form.descriptionEn}
            onChange={(e) => set("descriptionEn", e.target.value)}
            className={cn(inputClass, "min-h-24 resize-y")}
            rows={3}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.basePriceEgp} required>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
            className={inputClass}
            dir="ltr"
            required
          />
        </Field>
        <Field label={dict.admin.compareAtPriceEgp}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.compareAtPrice}
            onChange={(e) => set("compareAtPrice", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.discountPercent}>
          <input
            type="number"
            step="1"
            min="0"
            max="90"
            value={form.discountPercent}
            onChange={(e) => set("discountPercent", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
          <span className="text-xs text-muted-foreground">
            {dict.admin.discountPercentHint}
          </span>
        </Field>
        <Field label={dict.admin.rating}>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label={dict.admin.reviewsCount}>
          <input
            type="number"
            min="0"
            value={form.reviewsCount}
            onChange={(e) => set("reviewsCount", e.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
      </section>

      {/* Flags */}
      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card/40 p-5 sm:grid-cols-4">
        <CheckboxField
          label={dict.admin.isActive}
          checked={form.isActive}
          onChange={(v) => set("isActive", v)}
        />
        <CheckboxField
          label={dict.admin.isNew}
          checked={form.isNew}
          onChange={(v) => set("isNew", v)}
        />
        <CheckboxField
          label={dict.admin.isBestseller}
          checked={form.isBestSeller}
          onChange={(v) => set("isBestSeller", v)}
        />
        <CheckboxField
          label={dict.admin.isFeatured}
          checked={form.isFeatured}
          onChange={(v) => set("isFeatured", v)}
        />
      </section>

      {/* Notes */}
      <section className="grid gap-4 rounded-2xl border border-border bg-card/40 p-5 sm:grid-cols-3">
        <Field label={dict.admin.notesTop}>
          <textarea
            value={form.notesTop}
            onChange={(e) => set("notesTop", e.target.value)}
            className={cn(inputClass, "min-h-24 resize-y")}
            placeholder={dict.admin.notesTop}
          />
        </Field>
        <Field label={dict.admin.notesHeart}>
          <textarea
            value={form.notesHeart}
            onChange={(e) => set("notesHeart", e.target.value)}
            className={cn(inputClass, "min-h-24 resize-y")}
            placeholder={dict.admin.notesHeart}
          />
        </Field>
        <Field label={dict.admin.notesBase}>
          <textarea
            value={form.notesBase}
            onChange={(e) => set("notesBase", e.target.value)}
            className={cn(inputClass, "min-h-24 resize-y")}
            placeholder={dict.admin.notesBase}
          />
        </Field>
      </section>

      {/* Design colors */}
      <section className="grid gap-4 rounded-2xl border border-border bg-card/40 p-5 sm:grid-cols-3">
        <ColorField
          label={dict.admin.colorFrom}
          value={form.artFrom}
          onChange={(v) => set("artFrom", v)}
        />
        <ColorField
          label={dict.admin.colorTo}
          value={form.artTo}
          onChange={(v) => set("artTo", v)}
        />
        <ColorField
          label={dict.admin.colorGlow}
          value={form.artGlow}
          onChange={(v) => set("artGlow", v)}
        />
      </section>

      {/* Product image */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="mb-3 text-sm font-semibold">
          {dict.admin.productImage}
        </h2>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {form.image ? (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="grid size-24 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
              {dict.admin.noImage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring">
                <Upload className="size-4" />
                {uploading
                  ? dict.admin.uploading
                  : form.image
                    ? dict.admin.changeImage
                    : dict.admin.uploadImage}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set("image", "")}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                  {dict.admin.removeImage}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dict.admin.uploadHint}
            </p>
          </div>
        </div>
      </section>

      {/* Variants (sizes) */}
      <section className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{dict.admin.variants}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setVariants((rows) => [
                ...rows,
                { sizeMl: "100", price: "", stock: "10", sku: "" },
              ])
            }
          >
            <Plus className="size-4" />
            {dict.admin.addVariant}
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {variants.map((variant, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={dict.admin.variantSizeMl}>
                <input
                  type="number"
                  min="0"
                  value={variant.sizeMl}
                  onChange={(e) => updateVariant(i, "sizeMl", e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
              <Field label={dict.admin.variantPriceEgp}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.price}
                  onChange={(e) => updateVariant(i, "price", e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
              <Field label={dict.admin.variantStock}>
                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(e) => updateVariant(i, "stock", e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
              <div className="flex items-end gap-2">
                <Field label={dict.admin.variantSku} className="flex-1">
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    className={inputClass}
                    dir="ltr"
                  />
                </Field>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mb-0.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setVariants((rows) => rows.filter((_, ri) => ri !== i))
                    }
                    aria-label={dict.admin.removeVariant}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          render={<a href={`/${locale}/admin/products`} />}
        >
          {dict.admin.cancel}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? dict.common.loading : dict.admin.save}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-background p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          dir="ltr"
        />
      </div>
    </Field>
  );
}
