"use client";

import { useState, useTransition, useRef, useLayoutEffect } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
  FileText,
  Coins,
  Sparkles,
  FlaskConical,
  Palette,
  Image as ImageIcon,
  Boxes,
  Type,
  Link2,
  FolderOpen,
  User,
  Percent,
  Star,
  MessageSquare,
  Package,
  TrendingUp,
  Eye,
  Ruler,
  Barcode,
  Check,
  Save,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
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
  stock: string;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  images: string[];
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
  collection: "",
  gender: "UNISEX",
  basePrice: "",
  compareAtPrice: "",
  discountPercent: "",
  rating: "0",
  reviewsCount: "0",
  stock: "",
  isNew: false,
  isBestSeller: false,
  isFeatured: false,
  isActive: true,
  notesTop: "",
  notesHeart: "",
  notesBase: "",
  images: [] as string[],
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
  const [saved, setSaved] = useState(false);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json()) as { url?: unknown };
      if (!res.ok || typeof data.url !== "string") return null;
      return data.url;
    } catch {
      return null;
    }
  };

  const uploadImages = async (files: File[]) => {
    setError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await handleImageUpload(file);
        if (url) urls.push(url);
      }
      if (files.length > 0 && urls.length === 0) {
        setError(dict.admin.uploadError);
      } else if (urls.length > 0) {
        setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) =>
    set(
      "images",
      form.images.filter((_, i) => i !== index),
    );

  const makePrimary = (index: number) => {
    const next = [...form.images];
    const [primary] = next.splice(index, 1);
    set("images", [primary, ...next]);
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
    setSaved(false);

    if (!form.name.trim() || !form.slug.trim() || !form.basePrice) {
      setError(dict.admin.errorGeneric);
      return;
    }

    const hasInvalidVariant = variants.some(
      (v) =>
        !v.sizeMl || Number(v.sizeMl) <= 0 || !v.price || Number(v.price) <= 0,
    );
    if (hasInvalidVariant) {
      setError(dict.admin.errorInvalidVariant);
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
    fd.set("stock", form.stock);
    fd.set("isNew", form.isNew ? "on" : "");
    fd.set("isBestSeller", form.isBestSeller ? "on" : "");
    fd.set("isFeatured", form.isFeatured ? "on" : "");
    fd.set("isActive", form.isActive ? "on" : "");
    fd.set("notesTop", form.notesTop);
    fd.set("notesHeart", form.notesHeart);
    fd.set("notesBase", form.notesBase);
    form.images.forEach((url) => fd.append("images", url));
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
      } else {
        setSaved(true);
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

  const flags = [
    {
      key: "isActive" as const,
      label: dict.admin.isActive,
      icon: Eye,
      value: form.isActive,
    },
    {
      key: "isNew" as const,
      label: dict.admin.isNew,
      icon: Sparkles,
      value: form.isNew,
    },
    {
      key: "isBestSeller" as const,
      label: dict.admin.isBestseller,
      icon: TrendingUp,
      value: form.isBestSeller,
    },
    {
      key: "isFeatured" as const,
      label: dict.admin.isFeatured,
      icon: Star,
      value: form.isFeatured,
    },
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
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="text-destructive/70 transition-colors hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          <Check className="size-5 shrink-0" />
          <span>{dict.admin.paymentSettingsSaved}</span>
        </div>
      )}

      {/* ============ Basic info ============ */}
      <Section icon={FileText} title={dict.admin.productBasicInfo}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.admin.arabicName} required>
            <IconInput
              icon={Type}
              value={form.name}
              onChange={(v) => set("name", v)}
              placeholder={dict.admin.arabicName}
              required
            />
          </Field>
          <Field label={dict.admin.englishName}>
            <IconInput
              icon={Type}
              value={form.nameEn}
              onChange={(v) => set("nameEn", v)}
              placeholder={dict.admin.englishName}
              dir="ltr"
            />
          </Field>
          <Field label={dict.admin.slug} required>
            <IconInput
              icon={Link2}
              value={form.slug}
              onChange={(v) =>
                set(
                  "slug",
                  v
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-"),
                )
              }
              placeholder={dict.admin.collectionSlug}
              dir="ltr"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={dict.catalog.collectionFilter}>
              <IconSelect
                icon={FolderOpen}
                value={form.collection}
                onChange={(v) => set("collection", v)}
                options={[
                  { value: "", label: dict.admin.noCollection },
                  ...collectionOptions.map((c) => ({
                    value: c.slug,
                    label: `${c.slug} — ${locale === "ar" ? c.nameAr : c.nameEn}`,
                  })),
                ]}
              />
            </Field>
            <Field label={dict.product.gender}>
              <IconSelect
                icon={User}
                value={form.gender}
                onChange={(v) => set("gender", v)}
                options={[
                  { value: "MALE", label: dict.product.male },
                  { value: "FEMALE", label: dict.product.female },
                  { value: "UNISEX", label: dict.product.unisex },
                ]}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ============ Descriptions ============ */}
      <Section icon={FileText} title={dict.admin.productDescription}>
        <div className="grid gap-4">
          <Field label={dict.admin.arabicDescription}>
            <AutoTextarea
              value={form.description}
              onChange={(v) => set("description", v)}
              locale={locale}
              charLabel={dict.admin.charactersCount}
              placeholder={dict.admin.arabicDescription}
            />
          </Field>
          <Field label={dict.admin.englishDescription}>
            <AutoTextarea
              value={form.descriptionEn}
              onChange={(v) => set("descriptionEn", v)}
              locale={locale}
              charLabel={dict.admin.charactersCount}
              dir="ltr"
              placeholder={dict.admin.englishDescription}
            />
          </Field>
        </div>
      </Section>

      {/* ============ Pricing ============ */}
      <Section icon={Coins} title={dict.admin.productPricing}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={dict.admin.basePriceEgp} required>
            <IconInput
              icon={Coins}
              type="number"
              step="0.01"
              min="0"
              value={form.basePrice}
              onChange={(v) => set("basePrice", v)}
              suffix="EGP"
              dir="ltr"
              required
            />
          </Field>
          <Field label={dict.admin.compareAtPriceEgp}>
            <IconInput
              icon={Coins}
              type="number"
              step="0.01"
              min="0"
              value={form.compareAtPrice}
              onChange={(v) => set("compareAtPrice", v)}
              suffix="EGP"
              dir="ltr"
            />
          </Field>
          <Field
            label={dict.admin.discountPercent}
            hint={dict.admin.discountPercentHint}
          >
            <IconInput
              icon={Percent}
              type="number"
              step="1"
              min="0"
              max="90"
              value={form.discountPercent}
              onChange={(v) => set("discountPercent", v)}
              suffix="%"
              dir="ltr"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={dict.admin.rating}>
              <IconInput
                icon={Star}
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(v) => set("rating", v)}
                dir="ltr"
              />
            </Field>
            <Field label={dict.admin.reviewsCount}>
              <IconInput
                icon={MessageSquare}
                type="number"
                min="0"
                value={form.reviewsCount}
                onChange={(v) => set("reviewsCount", v)}
                dir="ltr"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ============ Flags ============ */}
      <Section icon={Sparkles} title={dict.admin.productFlags}>
        <div className="grid gap-3 sm:grid-cols-2">
          {flags.map((flag) => (
            <ToggleCard
              key={flag.key}
              icon={flag.icon}
              label={flag.label}
              checked={flag.value}
              onChange={(v) => set(flag.key, v)}
            />
          ))}
        </div>
      </Section>

      {/* ============ Notes ============ */}
      <Section icon={FlaskConical} title={dict.admin.productNotes}>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["notesTop", dict.admin.notesTop],
              ["notesHeart", dict.admin.notesHeart],
              ["notesBase", dict.admin.notesBase],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <AutoTextarea
                value={form[key]}
                onChange={(v) => set(key, v)}
                locale={locale}
                charLabel={dict.admin.charactersCount}
                placeholder={label}
              />
            </Field>
          ))}
        </div>
      </Section>

      {/* ============ Design colors ============ */}
      <Section icon={Palette} title={dict.admin.productDesign}>
        <div className="grid gap-4 sm:grid-cols-3">
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
        </div>
      </Section>

      {/* ============ Images ============ */}
      <Section icon={ImageIcon} title={dict.admin.productImage}>
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div
                key={i}
                className="group relative size-24 shrink-0 overflow-hidden rounded-xl border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(i)}
                      title={dict.admin.makePrimary}
                      aria-label={dict.admin.makePrimary}
                      className="grid size-7 place-items-center rounded-md bg-white/15 text-white transition-colors hover:bg-primary"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    title={dict.admin.removeImage}
                    aria-label={dict.admin.removeImage}
                    className="grid size-7 place-items-center rounded-md bg-white/15 text-white transition-colors hover:bg-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {i === 0 && (
                  <span className="absolute start-0 top-0 flex items-center gap-1 rounded-ee-lg bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Check className="size-3" />
                    {dict.admin.primaryImage}
                  </span>
                )}
              </div>
            ))}
            {form.images.length === 0 && (
              <div className="grid size-24 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="size-5" />
                  {dict.admin.noImage}
                </div>
              </div>
            )}
          </div>

          {form.images.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {dict.admin.primaryHint}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-within:ring-2 focus-within:ring-ring">
                <Upload className="size-4" />
                {uploading ? dict.admin.uploading : dict.admin.addImages}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) uploadImages(files);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.images.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => makePrimary(1)}
                  className="text-primary hover:bg-primary/10"
                >
                  <Star className="size-4" />
                  {dict.admin.makePrimary}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dict.admin.uploadHint}
            </p>
          </div>
        </div>
      </Section>

      {/* ============ Variants ============ */}
      <Section
        icon={Boxes}
        title={dict.admin.variants}
        action={
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
        }
      >
        {/* Variant-less products: stock lives on the product itself */}
        <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <Field label={dict.admin.productStock}>
            <IconInput
              icon={Package}
              type="number"
              min="0"
              value={form.stock}
              onChange={(v) => set("stock", v)}
              dir="ltr"
            />
          </Field>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {dict.admin.noVariantsHint}
          </p>
        </div>

        {variants.length > 0 && (
          <div className="mb-3 hidden grid-cols-[90px_1fr_1fr_1fr_auto] gap-3 px-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
            <span>{dict.admin.variantSizeMl}</span>
            <span>{dict.admin.variantPriceEgp}</span>
            <span>{dict.admin.variantStock}</span>
            <span>{dict.admin.variantSku}</span>
            <span />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {variants.map((variant, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/50 p-4 sm:grid-cols-[90px_1fr_1fr_1fr_auto] sm:items-end"
            >
              <Field label={dict.admin.variantSizeMl}>
                <IconInput
                  icon={Ruler}
                  type="number"
                  min="0"
                  value={variant.sizeMl}
                  onChange={(v) => updateVariant(i, "sizeMl", v)}
                  suffix="ml"
                  dir="ltr"
                />
              </Field>
              <Field label={dict.admin.variantPriceEgp}>
                <IconInput
                  icon={Coins}
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.price}
                  onChange={(v) => updateVariant(i, "price", v)}
                  suffix="EGP"
                  dir="ltr"
                />
              </Field>
              <Field label={dict.admin.variantStock}>
                <IconInput
                  icon={Package}
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(v) => updateVariant(i, "stock", v)}
                  dir="ltr"
                />
              </Field>
              <Field label={dict.admin.variantSku}>
                <IconInput
                  icon={Barcode}
                  value={variant.sku}
                  onChange={(v) => updateVariant(i, "sku", v)}
                  dir="ltr"
                />
              </Field>
              <div className="col-span-2 flex items-center justify-end sm:col-span-1 sm:pb-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() =>
                    setVariants((rows) => rows.filter((_, ri) => ri !== i))
                  }
                  aria-label={dict.admin.removeVariant}
                  title={dict.admin.removeVariant}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {variants.length === 0 && (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {dict.admin.noVariantsHint}
            </p>
          )}
        </div>
      </Section>

      {/* ============ Actions ============ */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          render={<a href={`/${locale}/admin/products`} />}
        >
          {dict.admin.cancel}
        </Button>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {dict.common.loading}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {dict.admin.save}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
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
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function IconInput({
  icon: Icon,
  suffix,
  dir,
  className,
  value,
  onChange,
  ...props
}: {
  icon: React.ElementType;
  suffix?: string;
  dir?: "ltr";
  className?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "dir"
>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <input
        {...props}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "ps-9", suffix && "pe-14", className)}
      />
      {suffix && (
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

function IconSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "appearance-none ps-9 pe-9 cursor-pointer")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function AutoTextarea({
  value,
  onChange,
  locale,
  charLabel,
  dir,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  charLabel: string;
  dir?: "ltr";
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        placeholder={placeholder}
        rows={3}
        className={cn(inputClass, "min-h-24 resize-none pb-7 leading-relaxed")}
      />
      <span className="pointer-events-none absolute bottom-2 end-3 text-[11px] tabular-nums text-muted-foreground/70">
        {value.length.toLocaleString(locale)} {charLabel}
      </span>{" "}
    </div>
  );
}

function ToggleCard({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer select-none items-center gap-3 rounded-xl border p-3.5 transition-all",
        checked
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-background hover:border-primary/30",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
          checked
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
        {label}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute start-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-full rtl:-translate-x-full",
          )}
        />
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
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
        <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "font-mono uppercase")}
          dir="ltr"
        />
      </div>
    </Field>
  );
}
