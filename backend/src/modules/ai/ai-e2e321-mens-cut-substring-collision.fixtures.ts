/**
 * e2e-bug.321 — an exact single-service pin (serviceId already resolved) must
 * not be re-expanded by resolveServicesFromCatalogParams's fuzzy name match,
 * which spuriously includes "Women's cut" when querying "Men's cut" because
 * normalizeServiceLookup("Women's cut") === "women'scut" contains
 * normalizeServiceLookup("Men's cut") === "men'scut" as a literal substring
 * (wo|men's cut).
 */

export const E2E321_SALON_CATALOG = [
  { id: 'mc', name: "Men's cut" },
  { id: 'wc', name: "Women's cut" },
  { id: 'dt', name: 'Deep tissue massage' },
  { id: 'hs', name: 'Hot stone massage' },
  { id: 'fb', name: 'full body massage' },
  { id: 'fm', name: 'facemassage' },
  { id: 'nm', name: 'Neck Massage' },
  { id: 'sw', name: 'Swedish massage' },
] as const;

export const E2E321_MASSAGE_FAMILY_NAMES = [
  'Deep tissue massage',
  'Hot stone massage',
  'full body massage',
  'facemassage',
  'Neck Massage',
  'Swedish massage',
] as const;

export type E2e321SinglePinCase = {
  id: string;
  prompt: string;
  expectServiceName: string;
  expectServiceId: string;
};

export const E2E321_SINGLE_PIN_CASES: readonly E2e321SinglePinCase[] = [
  {
    id: 'e321-mens-cut',
    prompt: "show me Men's cut",
    expectServiceName: "Men's cut",
    expectServiceId: 'mc',
  },
  {
    id: 'e321-womens-cut',
    prompt: "show me Women's cut",
    expectServiceName: "Women's cut",
    expectServiceId: 'wc',
  },
] as const;
