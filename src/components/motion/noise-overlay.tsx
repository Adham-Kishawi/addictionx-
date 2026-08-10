// Film grain overlay — a fixed, full-bleed noise layer (tiled SVG turbulence)
// that sits above the page but below the drawers, giving the whole site the
// cinematic texture depth of coparadiso. Purely decorative.
export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="noise-overlay pointer-events-none fixed inset-0 z-[45]"
    />
  );
}
