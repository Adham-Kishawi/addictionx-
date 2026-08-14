"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, X, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  updateCollection,
  type CollectionActionState,
} from "@/features/admin/collections-actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Inline edit form for one collection (names, image, slider captions AR/EN).
// The slug is immutable once created — Product.collection holds it as text.

export function CollectionEdit({
  slug,
  initial,
  dict,
}: {
  slug: string;
  initial: {
    nameAr: string;
    nameEn: string;
    image?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  };
  dict: Dictionary;
}) {
  const router = useRouter();
  const [nameAr, setNameAr] = useState(initial.nameAr);
  const [nameEn, setNameEn] = useState(initial.nameEn);
  const [image, setImage] = useState(initial.image ?? "");
  const [descriptionAr, setDescriptionAr] = useState(
    initial.descriptionAr ?? "",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initial.descriptionEn ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<CollectionActionState>({});

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
    fd.set("image", image);
    fd.set("descriptionAr", descriptionAr);
    fd.set("descriptionEn", descriptionEn);
    const res = await updateCollection(slug, undefined, fd);
    setState(res);
    setPending(false);
    if (res.success) router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-border/60 bg-background p-4 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
        {dict.admin.collectionNameAr}
        <input
          type="text"
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          required
          maxLength={60}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
        {dict.admin.collectionNameEn}
        <input
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
          maxLength={60}
          dir="ltr"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
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
          className="h-9 rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
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

      <div className="flex items-center gap-3 sm:col-span-2">
        {image ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image
              src={image}
              alt=""
              fill
              sizes="56px"
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
            <Save className="size-4" />
          )}
          {dict.admin.collectionImageHint}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onPickImage}
          />
        </label>
        <Button
          type="submit"
          disabled={pending || uploading}
          size="sm"
          className="ms-auto rounded-full px-5"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {dict.admin.saveCollection}
        </Button>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        {state.success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" />
            {dict.admin.collectionUpdated}
          </span>
        )}
        {state.error === "INVALID" && (
          <span className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {dict.admin.collectionUpdateError}
          </span>
        )}
      </div>
    </form>
  );
}
