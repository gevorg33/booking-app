/**
 * e2e-bug.199 — budget / flexible-availability compounds say "haircut" but the
 * live QA salon (`gevgas-operations-7c299253`) only lists `hairstyle`.
 * Catalog resolve must synonym-map haircut → hairstyle instead of aborting.
 */

export type E2E199CatalogService = {
  id: string;
  name: string;
  category?: { name: string } | null;
};

/** Mirrors the live salon shape: hairstyle present, no service named haircut. */
export const E2E199_SALON_CATALOG: readonly E2E199CatalogService[] = [
  { id: '1', name: 'hairstyle', category: { name: 'Hair' } },
  { id: '2', name: 'Swedish massage', category: { name: 'Massage' } },
  { id: '3', name: 'Neck Massage', category: { name: 'Massage' } },
  { id: '4', name: 'Face Pilling', category: { name: 'Face' } },
];

export type E2E199ResolveCase = {
  id: string;
  query: { serviceCategory?: string; serviceName?: string };
  expectNames: readonly string[];
};

export const E2E199_RESOLVE_CASES: readonly E2E199ResolveCase[] = [
  {
    id: 'category-haircut',
    query: { serviceCategory: 'haircut' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'category-haircuts',
    query: { serviceCategory: 'haircuts' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'name-haircut',
    query: { serviceName: 'haircut' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'name-haircuts',
    query: { serviceName: 'haircuts' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'name-hairstyle-control',
    query: { serviceName: 'hairstyle' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'category-massage-control',
    query: { serviceCategory: 'massage' },
    expectNames: ['Neck Massage', 'Swedish massage'],
  },
  {
    id: 'name-swedish-control',
    query: { serviceName: 'Swedish massage' },
    expectNames: ['Swedish massage'],
  },
];

export type E2E199PromptCase = {
  id: string;
  prompt: string;
  /** Service token extracted into list/check params (fixture/classifier convention). */
  serviceToken: 'haircut' | 'hairstyle' | 'massage' | 'Swedish massage';
  expectResolveNames: readonly string[];
};

/** Live-facing prompts that previously aborted on haircut exact-match. */
export const E2E199_LIVE_PROMPT_CASES: readonly E2E199PromptCase[] = [
  {
    id: 'flex-list-budget-then-or',
    prompt:
      'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'budget-book-haircut-nearest',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'cheapest-haircut',
    prompt: "What's the cheapest haircut you offer?",
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'flex-want-haircut-or',
    prompt: 'I want a haircut tomorrow evening or Friday afternoon',
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'who-free-haircut-budget-book',
    prompt:
      "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'control-hairstyle-budget',
    prompt: 'Show hairstyle under $50, then check tomorrow evening',
    serviceToken: 'hairstyle',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'control-massage-budget',
    prompt: 'Show massage under $50, then check tomorrow evening',
    serviceToken: 'massage',
    expectResolveNames: ['Neck Massage', 'Swedish massage'],
  },
  {
    id: 'control-swedish',
    prompt: 'Book a Swedish massage under $50 tomorrow, nearest slot',
    serviceToken: 'Swedish massage',
    expectResolveNames: ['Swedish massage'],
  },
];

export const E2E199_NEGATIVE_RESOLVE_CASES = [
  {
    id: 'neg-unicorn',
    query: { serviceName: 'unicorn trim' },
    expectNames: [] as const,
  },
  {
    id: 'neg-facial-misspelling-not-hair',
    query: { serviceName: 'haircut massage' },
    expectNames: [] as const,
  },
] as const;
