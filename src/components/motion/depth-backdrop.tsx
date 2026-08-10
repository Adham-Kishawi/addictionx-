// Global ambient depth — fixed layer behind every page: red aurora glow on
// top + two huge blurred orbs drifting very slowly (55s/70s loops).
// All colors/opacities live in --depth-* CSS vars in globals.css (the
// "edit on background" control room). Purely decorative, pointer-events-none.
export function DepthBackdrop() {
  return (
    <div aria-hidden className="depth-backdrop">
      <div className="depth-orb depth-orb-a" />
      <div className="depth-orb depth-orb-b" />
    </div>
  );
}
