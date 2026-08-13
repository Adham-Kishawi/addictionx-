// ============================================================
// Motion system — wave 34h: ONE set of numbers for the whole
// homepage so every animation speaks the same language
// (brief section 8: "consistent easing, consistent duration…").
// Components should import from here instead of re-declaring
// eases inline; keep the public APIs of each primitive the same.
// ============================================================

/** The house ease — soft-out, the signature settle of the brand. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Fast micro-interactions (buttons, chips, small reveals). */
export const DURATION_FAST = 0.4;

/** Standard reveals (cards, text, scenes). */
export const DURATION_MEDIUM = 0.7;

/** Cinematic entrances (titles, hero rhythm). */
export const DURATION_SLOW = 1;

/** Default rise for a fade-up reveal. */
export const RISE = 24;
