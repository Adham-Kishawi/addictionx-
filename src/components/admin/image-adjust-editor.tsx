"use client";

import { useState } from "react";
import { X, ZoomIn, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_ADJUST,
  MAX_ZOOM,
  MIN_ZOOM,
  clamp,
  imageAdjustStyle,
  type ImageAdjust,
} from "@/lib/image-adjust";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Modal image framing tool — shows the picture inside the exact display
// frame (aspect ratio) and lets the admin drag the focal point + zoom, with
// the same objectPosition/scale the storefront applies, so "what you see is
// what gets sliced". Save returns the { x, y, zoom } adjustment.

export function ImageAdjustEditor({
  src,
  adjust,
  aspect,
  onClose,
  onSave,
  dict,
}: {
  src: string;
  adjust: ImageAdjust | null;
  aspect?: string;
  onClose: () => void;
  onSave: (adjust: ImageAdjust) => void;
  dict: Dictionary;
}) {
  const [adj, setAdj] = useState<ImageAdjust>({
    ...DEFAULT_ADJUST,
    ...(adjust ?? {}),
  });
  const [dragging, setDragging] = useState(false);

  const moveTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    setAdj((cur) => ({ ...cur, x, y }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={dict.admin.adjustImage}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <ZoomIn className="size-4 text-primary" />
            {dict.admin.adjustImage}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.admin.cancel}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {dict.admin.adjustImageHint}
        </p>

        <div
          className="relative w-full touch-none overflow-hidden rounded-xl border border-border bg-muted select-none"
          style={{ aspectRatio: aspect ?? "4 / 5" }}
          onPointerDown={(e) => {
            setDragging(true);
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            moveTo(e);
          }}
          onPointerMove={(e) => {
            if (dragging) moveTo(e);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={imageAdjustStyle(adj)}
          />
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {dict.admin.adjustDrag}
        </p>

        <label className="mt-3 flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={adj.zoom}
            onChange={(e) =>
              setAdj((cur) => ({ ...cur, zoom: Number(e.target.value) }))
            }
            className="flex-1 accent-primary"
          />
          <span className="w-12 text-end font-mono text-xs text-muted-foreground">
            {adj.zoom.toFixed(1)}×
          </span>
        </label>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdj({ ...DEFAULT_ADJUST })}
          >
            <RotateCcw className="size-3.5" />
            {dict.admin.adjustReset}
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {dict.admin.cancel}
            </Button>
            <Button type="button" size="sm" onClick={() => onSave(adj)}>
              {dict.admin.adjustDone}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
