"use client";

import { useState } from "react";
import { Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import {
  createCollection,
  type CollectionActionState,
} from "@/features/admin/collections-actions";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { ImageAdjust } from "@/lib/image-adjust";

// Form to add a new collection from the dashboard (image + slider captions AR/EN).
// The picture is required — every collection must have an expressive image.

export function CollectionForm({ dict }: { dict: Dictionary }) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [adjust, setAdjust] = useState<ImageAdjust | null>(null);
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<CollectionActionState>({});

  const deriveSlug = (en: string) =>
    en
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("nameAr", nameAr);
    fd.set("nameEn", nameEn);
    fd.set("slug", slug || deriveSlug(nameEn));
    fd.set("image", image);
    fd.set("imageAdjust", adjust ? JSON.stringify(adjust) : "");
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
      setAdjust(null);
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
        <div className="sm:col-span-2">
          <ImageUploader
            value={image}
            onChange={setImage}
            label={dict.admin.collectionImage}
            required
            dict={dict}
            adjustable
            adjust={adjust}
            onAdjustChange={setAdjust}
            adjustAspect="4 / 5"
          />
        </div>
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
        <Button type="submit" disabled={pending || !image} className="px-4">
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
