/**
 * e2e-bug.320 — short "show me massage" must list the full massage family
 * (Swedish massage + full body massage + Hot stone massage + Neck massage +
 * Deep tissue massage + facemassage), not collapse to Deep tissue massage
 * alone via fuzzy tail-suffix catalog pin.
 */

export const E2E320_SALON_MASSAGE_CATALOG = [
  { id: 'dt', name: 'Deep tissue massage' },
  { id: 'hs', name: 'Hot stone massage' },
  { id: 'fb', name: 'full body massage' },
  { id: 'fm', name: 'facemassage' },
  { id: 'nm', name: 'Neck massage' },
  { id: 'sw', name: 'Swedish massage' },
  { id: 'mc', name: "Men's cut" },
  { id: 'wc', name: "Women's cut" },
] as const;

export const E2E320_MASSAGE_FAMILY_NAMES = [
  'Deep tissue massage',
  'Hot stone massage',
  'full body massage',
  'facemassage',
  'Neck massage',
  'Swedish massage',
] as const;

export type E2e320ListCase = {
  id: string;
  prompt: string;
  expectCategory: 'massage';
  expectFamilyNames: readonly string[];
  forbidSingleOnly: string;
};

/** Short/bare massage phrasing that previously pinned Deep tissue massage. */
export const E2E320_SHORT_MASSAGE_LIST_CASES: readonly E2e320ListCase[] = [
  {
    id: 'e320-show-me-massage',
    prompt: 'show me massage',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
  {
    id: 'e320-show-massage',
    prompt: 'show massage',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
  {
    id: 'e320-bare-massage',
    prompt: 'massage',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
  {
    id: 'e320-show-me-massages',
    prompt: 'show me massages',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
] as const;

/** Explicit "massage services" phrasing (controls). */
export const E2E320_EXPLICIT_MASSAGE_CONTROLS: readonly E2e320ListCase[] = [
  {
    id: 'e320-ctrl-list-massage-services',
    prompt: 'list massage services',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
  {
    id: 'e320-ctrl-show-me-massage-services',
    prompt: 'show me massage services',
    expectCategory: 'massage',
    expectFamilyNames: E2E320_MASSAGE_FAMILY_NAMES,
    forbidSingleOnly: 'Deep tissue massage',
  },
] as const;

/** Single named service must still pin (not expand to whole massage family). */
export const E2E320_SINGLE_SERVICE_CONTROLS = [
  {
    id: 'e320-ctrl-show-hot-stone-massage',
    prompt: 'show me Hot stone massage',
    expectServiceName: 'Hot stone massage',
    expectServiceId: 'hs',
  },
] as const;
