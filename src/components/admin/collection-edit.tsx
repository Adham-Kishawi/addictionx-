"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  updateCollection,
  type CollectionActionState,
} from "@/features/admin/collections-actions";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { ImageAdjust } from "@/lib/image-adjust";

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
    imageAdjust?: ImageAdjust | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
  };
  dict: Dictionary;
}) {
  const router = useRouter();
  const [nameAr, setNameAr] = useState(initial.nameAr);
  const [nameEn, setNameEn] = useState(initial.nameEn);
  const [image, setImage] = useState(initial.image ?? "");
  const [adjust, setAdjust] = useState<ImageAdjust | null>(
    initial.imageAdjust ?? null,
  );
  const [descriptionAr, setDescriptionAr] = useState(
    initial.descriptionAr ?? "",
  );
  const [descriptionEn, setDescriptionEn] = useState(
    initial.descriptionEn ?? "",
  );
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<CollectionActionState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("nameAr", nameAr);
    fd.set("nameEn", nameEn);
    fd.set("image", image);
    fd.set("imageAdjust", adjust ? JSON.stringify(adjust) : "");
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
      <div className="sm:col-span-2">
        <ImageUploader
          value={image}
          onChange={setImage}
          label={dict.admin.collectionImage}
          dict={dict}
          adjustable
          adjust={adjust}
          onAdjustChange={setAdjust}
          adjustAspect="4 / 5"
        />
      </div>
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
        <Button
          type="submit"
          disabled={pending}
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
