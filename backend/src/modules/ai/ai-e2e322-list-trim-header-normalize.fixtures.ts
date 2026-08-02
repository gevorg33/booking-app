/**
 * e2e-bug.322 — the `"Our X service types:"` list header must normalize
 * raw classifier tokens (e.g. "trim") to their catalog family label
 * ("haircut") instead of echoing the literal prompt word back verbatim.
 *
 * e2e-bug.323 — bare "cut"/"cuts" is deliberately NOT aliased to "haircut"
 * (unlike trim/style/styling), so the header keeps the literal token for
 * those — see ai-flexible-availability.util.ts's normalizeAvailabilityServiceCategory.
 */

export const E2E322_SALON_CATALOG = [
  { id: 'hs', name: 'hairstyle' },
  { id: 'mc', name: "Men's cut" },
  { id: 'wc', name: "Women's cut" },
] as const;

export type E2e322HeaderCase = {
  id: string;
  rawToken: string;
  expectHeaderCategory: string;
};

export const E2E322_HEADER_CASES: readonly E2e322HeaderCase[] = [
  { id: 'e322-trim', rawToken: 'trim', expectHeaderCategory: 'haircut' },
  { id: 'e322-cut', rawToken: 'cut', expectHeaderCategory: 'cut' },
  { id: 'e322-cuts', rawToken: 'cuts', expectHeaderCategory: 'cuts' },
] as const;
