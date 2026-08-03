/**
 * e2e-bug.323 — a bare "cut"/"cuts" token in a recommend-specialists prompt
 * ("best specialists for a cut") must prefer literal `* cut` catalog rows
 * (Men's cut / Women's cut) over the haircut→hairstyle synonym family, while
 * still falling back to hairstyle when no cut-named service exists.
 */

export const E2E323_SALON_CATALOG = [
  { id: 'hs', name: 'hairstyle' },
  { id: 'mc', name: "Men's cut" },
  { id: 'wc', name: "Women's cut" },
] as const;

export const E2E323_HAIRSTYLE_ONLY_CATALOG = [
  { id: 'hs', name: 'hairstyle' },
] as const;

export type E2e323BareCutCase = {
  id: string;
  prompt: string;
};

export const E2E323_BARE_CUT_CASES: readonly E2e323BareCutCase[] = [
  { id: 'e323-a-cut', prompt: 'best specialists for a cut' },
  { id: 'e323-cut', prompt: 'best specialists for cut' },
  { id: 'e323-cuts', prompt: 'best specialists for cuts' },
] as const;
