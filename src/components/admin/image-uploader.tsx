"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Picture uploader used everywhere an admin picks a single image (collections,
// slider cards…). No URL field — picking a file uploads it through
// /api/admin/upload-image (stored in the DB) and the preview updates inline.
// Drag & drop is supported; type and size are validated client-side.

export function ImageUploader({
  value,
  onChange,
  label,
  hint,
  required,
  dict,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  required?: boolean;
  dict: Dictionary;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError(dict.admin.uploadBadType);
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError(dict.admin.uploadBadSize);
      return;
    }
    setUploading(true);
    setError(null);
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
      onChange(data.url as string);
    } catch {
      setError(dict.admin.uploadError);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}

      <label
        draggable={false}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border bg-background hover:border-primary/50",
          required && !value && "border-amber-500/60 bg-amber-500/5",
        )}
      >
        {value ? (
          <>
            <div className="relative aspect-[16/4] w-full">
              <Image
                src={value}
                alt=""
                fill
                sizes="(min-width: 1280px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {uploading ? dict.admin.uploading : dict.admin.changeImage}
            </span>
          </>
        ) : (
          <div className="flex aspect-[16/4] w-full flex-col items-center justify-center gap-1 py-4 text-center">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {uploading ? dict.admin.uploading : dict.admin.uploadImage}
            </span>
            <span className="px-4 text-[11px] text-muted-foreground/70">
              {dict.admin.uploadDrop}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={onPick}
        />
      </label>

      {value && (
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <X className="size-3" />
            {dict.admin.removeImage}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ImagePlus className="size-3" />
            {dict.admin.changeImage}
          </button>
        </span>
      )}

      {required && !value && (
        <span className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-500">
          <TriangleAlert className="size-3" />
          {dict.admin.imageRequired}
        </span>
      )}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      {hint && !required && (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      )}
    </div>
  );
}
