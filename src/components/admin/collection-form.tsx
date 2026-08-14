"use client";

import { useState } from "react";
import { Loader2, Plus, CheckCircle2, AlertCircle, X } from "lucide-react";
import Image from "next/image";
import {
  createCollection,
  type CollectionActionState,
} from "@/features/admin/collections-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Form to add a new collection from the dashboard (image + slider captions AR/EN).

export function CollectionForm({ dict }: { dict: Dictionary }) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<CollectionActionState>({});

  const deriveSlug = (en: string) =>
    en
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleImageUpload = async (file: File) => {
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

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await handleImageUpload(file);
    setUploading(false);
    if (url) setImage(url);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("nameAr", nameAr);
    fd.set("nameEn", nameEn);
    fd.set("slug", slug || deriveSlug(nameEn));
    fd.set("image", image);
    fd.set("descriptionAr", descriptionAr);
    fd.set("descriptionEn", descriptionEn);
    const res = await createCollection(undefined, fd);
    setState(res);
    setPending(false);
    if (res.success) {
      setNameAr("");
      setNameEn("");
      setSlug("");
      setImage("");
      setDescriptionAr("");
      setDescriptionEn("");
    }
  };

  const error =
    state.error === "SLUG_TAKEN" || state.error === "INVALID"
      ? dict.admin.collectionCreateError
      : null;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-card/40 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionNameAr}
          <input
            type="text"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
            maxLength={60}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionNameEn}
          <input
            type="text"
            value={nameEn}
            onChange={(e) => {
              setNameEn(e.target.value);
              if (!slug) setSlug(deriveSlug(e.target.value));
            }}
            required
            maxLength={60}
            dir="ltr"
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionSlug}
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            maxLength={60}
            dir="ltr"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionImage}
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="/api/uploads/..."
            dir="ltr"
            maxLength={500}
            className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {/* Image picker — uploads then fills the URL above */}
      <div className="mt-4 flex items-center gap-3">
        {image ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image
              src={image}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setImage("")}
              aria-label={dict.admin.removeImage}
              className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {dict.admin.collectionImageHint}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPickImage}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionDescriptionAr}
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            maxLength={300}
            rows={2}
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
          {dict.admin.collectionDescriptionEn}
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            maxLength={300}
            rows={2}
            dir="ltr"
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full px-6"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {dict.admin.addCollection}
        </Button>
        {state.success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" />
            {dict.admin.collectionCreated}
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
