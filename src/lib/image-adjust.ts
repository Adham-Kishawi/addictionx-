// Image framing adjustment — admin fixes how an uploaded picture is cropped
// inside its display boxes (collections hub cards, home slider, shelves).
//
// The picture is always rendered object-cover. The admin sets a focal point
// (x/y in %, drag) plus a zoom (1×–3×). On the site we apply:
//   objectPosition x% y%   +   transform scale(zoom) about the same point
// so the chosen part of the photo stays centered while zooming, instead of
// always slicing the middle slice out of it.

export type ImageAdjust = { x: number; y: number; zoom: number };

export const DEFAULT_ADJUST: ImageAdjust = { x: 50, y: 50, zoom: 1 };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function imageAdjustStyle(
  adjust?: ImageAdjust | null,
): React.CSSProperties {
  const a = { ...DEFAULT_ADJUST, ...(adjust ?? {}) };
  return {
    objectFit: "cover",
    objectPosition: `${a.x}% ${a.y}%`,
    transform: `scale(${a.zoom})`,
    transformOrigin: `${a.x}% ${a.y}%`,
  };
}

// Parse an unknown value (JSON string or object) into a safe ImageAdjust.
// Returns null when absent / malformed so callers can clear the field.
export function parseImageAdjust(raw: unknown): ImageAdjust | null {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const x = Number(o.x);
  const y = Number(o.y);
  const zoom = Number(o.zoom);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) {
    return null;
  }
  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
    zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM),
  };
}
