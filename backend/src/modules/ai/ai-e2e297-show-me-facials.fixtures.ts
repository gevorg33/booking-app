/**
 * e2e-bug.297 — short "show me facials" / "list facials" must list the full
 * face family (Face Pilling + Face Plasma + facemassage), not collapse to
 * Face Pilling alone via fuzzy catalog pin.
 */

export const E2E297_SALON_FACE_CATALOG = [
  { id: 'fp', name: 'Face Pilling' },
  { id: 'fpl', name: 'Face Plasma' },
  { id: 'fm', name: 'facemassage' },
  { id: 'sw', name: 'Swedish massage' },
  { id: 'hs', name: 'hairstyle' },
] as const;

export const E2E297_FACE_FAMILY_NAMES = [
  'Face Pilling',
  'Face Plasma',
  'facemassage',
] as const;

export type E2e297ListCase = {
  id: string;
  prompt: string;
  expectCategory: 'facial' | 'face';
  expectFamilyNames: readonly string[];
  forbidSingleOnly: string;
};

/** Short plural / bare facials phrasing that previously pinned Face Pilling. */
export const E2E297_SHORT_FACIALS_LIST_CASES: readonly E2e297ListCase[] = [
  {
    id: 'e297-show-me-facials',
    prompt: 'show me facials',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
  {
    id: 'e297-show-facials',
    prompt: 'show facials',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
  {
    id: 'e297-list-facials',
    prompt: 'list facials',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
  {
    id: 'e297-bare-facials',
    prompt: 'facials',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
  {
    id: 'e297-show-me-facial',
    prompt: 'show me facial',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
] as const;

/** Explicit phrasing that already worked after e2e-bug.279 (controls). */
export const E2E297_EXPLICIT_FACIAL_CONTROLS: readonly E2e297ListCase[] = [
  {
    id: 'e297-ctrl-list-facial-services',
    prompt: 'list facial services',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
  {
    id: 'e297-ctrl-show-me-facial-services',
    prompt: 'show me facial services',
    expectCategory: 'facial',
    expectFamilyNames: E2E297_FACE_FAMILY_NAMES,
    forbidSingleOnly: 'Face Pilling',
  },
] as const;

/** Single named service must still pin (not expand to whole face family). */
export const E2E297_SINGLE_SERVICE_CONTROLS = [
  {
    id: 'e297-ctrl-show-face-pilling',
    prompt: 'show me Face Pilling',
    expectServiceName: 'Face Pilling',
    expectServiceId: 'fp',
  },
  {
    id: 'e297-ctrl-list-facemassage',
    prompt: 'list facemassage',
    // facemassage is both synonym token and catalog name — family has 3 matches
    // so category browse is correct; assert at least facemassage present.
    expectFamilyIncludes: 'facemassage',
  },
] as const;
