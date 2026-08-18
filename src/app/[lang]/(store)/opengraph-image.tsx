import { ImageResponse } from "next/og";
import { ogCard, ogFonts, OG_SIZE } from "@/app/og-card";

export const alt = "ADDICTIONX — A Scent of Your Own";
export const size = OG_SIZE;
export const contentType = "image/png";

// Default brand card — used by every route that does not ship its own.
export default function Image() {
  return new ImageResponse(
    ogCard({ eyebrow: "A Scent of Your Own", title: "ADDICTIONX" }),
    { ...size, fonts: ogFonts },
  );
}
