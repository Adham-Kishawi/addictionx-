import { ImageResponse } from "next/og";
import { ogCard, ogFonts, OG_SIZE } from "@/app/og-card";

export const alt = "ADDICTIONX — Feel the Rush";
export const size = OG_SIZE;
export const contentType = "image/png";

// Default brand card — used by every route that does not ship its own.
export default function Image() {
  return new ImageResponse(
    ogCard({ eyebrow: "Feel the Rush", title: "ADDICTIONX" }),
    { ...size, fonts: ogFonts },
  );
}
