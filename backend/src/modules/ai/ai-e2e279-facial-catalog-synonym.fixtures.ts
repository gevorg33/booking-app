/**
 * e2e-bug.279 — bare "facial" must resolve to Face Pilling / Face Plasma /
 * facemassage (live salon has no service literally named "facial").
 */

export type E2E279CatalogService = {
  id: string;
  name: string;
  category?: { name: string } | null;
};

/** Mirrors gevgas-operations-7c299253 face-family + controls. */
export const E2E279_SALON_CATALOG: readonly E2E279CatalogService[] = [
  { id: '1', name: 'Face Pilling', category: { name: 'Face' } },
  { id: '2', name: 'Face Plasma', category: { name: 'Face' } },
  { id: '3', name: 'facemassage', category: { name: 'Face' } },
  { id: '4', name: 'hairstyle', category: { name: 'Hair' } },
  { id: '5', name: 'Swedish massage', category: { name: 'Massage' } },
  { id: '6', name: 'Deep tissue massage', category: { name: 'Massage' } },
];

export type E2E279ResolveCase = {
  id: string;
  query: { serviceCategory?: string; serviceName?: string };
  expectNames: readonly string[];
};

export const E2E279_RESOLVE_CASES: readonly E2E279ResolveCase[] = [
  {
    id: 'category-facial',
    query: { serviceCategory: 'facial' },
    expectNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'category-facials',
    query: { serviceCategory: 'facials' },
    expectNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'name-facial',
    query: { serviceName: 'facial' },
    expectNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'name-facials',
    query: { serviceName: 'facials' },
    expectNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'name-facemassage-control',
    query: { serviceName: 'facemassage' },
    expectNames: ['facemassage'],
  },
  {
    id: 'name-face-pilling-control',
    query: { serviceName: 'Face Pilling' },
    expectNames: ['Face Pilling'],
  },
  {
    id: 'category-massage-control',
    query: { serviceCategory: 'massage' },
    // facemassage contains "massage" (pre-existing substring match).
    expectNames: ['Deep tissue massage', 'facemassage', 'Swedish massage'],
  },
  {
    id: 'name-hairstyle-control',
    query: { serviceName: 'hairstyle' },
    expectNames: ['hairstyle'],
  },
];

export type E2E279ExpandCase = {
  id: string;
  query: string;
  mustInclude: readonly string[];
};

export const E2E279_EXPAND_CASES: readonly E2E279ExpandCase[] = [
  {
    id: 'expand-facial',
    query: 'facial',
    mustInclude: ['facial', 'face', 'facemassage'],
  },
  {
    id: 'expand-facials',
    query: 'facials',
    mustInclude: ['facials', 'face', 'facial'],
  },
  {
    id: 'expand-facemassage',
    query: 'facemassage',
    mustInclude: ['facemassage', 'facial', 'face'],
  },
];

export type E2E279LivePromptCase = {
  id: string;
  prompt: string;
  serviceToken: string;
  expectResolveNames: readonly string[];
  forbidNames?: readonly string[];
};

/** Live-facing prompts that previously aborted with couldn't find "facial". */
export const E2E279_LIVE_PROMPT_CASES: readonly E2E279LivePromptCase[] = [
  {
    id: 'recommend-best-specialists-facial-weekend',
    prompt: 'best specialists for facial this weekend',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
    forbidNames: ['hairstyle', 'Swedish massage'],
  },
  {
    id: 'recommend-best-rated-facial',
    prompt: 'best rated specialists for facial',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'recommend-specialists-for-facial',
    prompt: 'recommend specialists for facial',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'who-recommend-facial',
    prompt: 'Who do you recommend for a facial?',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'list-facial-services',
    prompt: 'list facial services',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'show-facial-services',
    prompt: 'show me facial services',
    serviceToken: 'facial',
    expectResolveNames: ['Face Pilling', 'Face Plasma', 'facemassage'],
  },
  {
    id: 'control-facemassage-recommend',
    prompt: 'best specialists for facemassage',
    serviceToken: 'facemassage',
    expectResolveNames: ['facemassage'],
  },
  {
    id: 'control-face-pilling-recommend',
    prompt: 'best specialists for Face Pilling',
    serviceToken: 'Face Pilling',
    expectResolveNames: ['Face Pilling'],
  },
];

export const E2E279_NEGATIVE_RESOLVE_CASES = [
  {
    id: 'neg-unicorn-laser',
    query: { serviceName: 'unicorn laser facial' },
    expectNames: [] as const,
  },
  {
    id: 'neg-facial-does-not-steal-hair',
    query: { serviceCategory: 'facial' },
    // Positive resolve returns face family; assert separately that hair is absent.
    expectNames: ['Face Pilling', 'Face Plasma', 'facemassage'] as const,
    forbidNames: ['hairstyle'] as const,
  },
] as const;
