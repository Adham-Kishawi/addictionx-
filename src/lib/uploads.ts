// Returns the UploadedImage id for a DB-backed image URL, or null for static assets.
// DB-backed uploads live at /api/uploads/<id> and /api/account/avatar/<id>.
export function storedImageId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/^\/api\/(?:uploads|account\/avatar)\/([^/?#]+)$/);
  return m ? m[1] : null;
}
