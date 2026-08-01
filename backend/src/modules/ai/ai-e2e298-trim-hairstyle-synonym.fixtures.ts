/**
 * e2e-bug.298 — bare "trim" / "cut" / "style" must resolve to hairstyle via the
 * haircut synonym group (rank already aliases trim→haircut; lookup did not).
 */

export const E2E298_SALON_CATALOG = [
  { id: 'hs', name: 'hairstyle' },
  { id: 'mc', name: "Men's cut" },
  { id: 'wc', name: "Women's cut" },
  { id: 'sw', name: 'Swedish massage' },
  { id: 'hc', name: 'hair coloring' },
] as const;

export type E2e298ResolveCase = {
  id: string;
  query: { serviceCategory?: string; serviceName?: string };
  expectNames: readonly string[];
};

export const E2E298_RESOLVE_CASES: readonly E2e298ResolveCase[] = [
  {
    id: 'category-trim',
    query: { serviceCategory: 'trim' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'name-trim',
    query: { serviceName: 'trim' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'category-cut',
    query: { serviceCategory: 'cut' },
    // bare "cut" substring-matches Men's/Women's cut first
    expectNames: ["Men's cut", "Women's cut"],
  },
  {
    id: 'category-style',
    query: { serviceCategory: 'style' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'category-styling',
    query: { serviceCategory: 'styling' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'ctrl-haircut',
    query: { serviceCategory: 'haircut' },
    expectNames: ['hairstyle'],
  },
  {
    id: 'ctrl-hairstyle',
    query: { serviceName: 'hairstyle' },
    expectNames: ['hairstyle'],
  },
] as const;

export type E2e298PromptCase = {
  id: string;
  prompt: string;
  serviceToken: string;
  expectResolveNames: readonly string[];
};

/** Live-facing recommend/list prompts that previously aborted on "trim". */
export const E2E298_PROMPT_CASES: readonly E2e298PromptCase[] = [
  {
    id: 'recommend-best-trim-next-week',
    prompt: 'best specialists for trim next week',
    serviceToken: 'trim',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'recommend-someone-trim',
    prompt: 'recommend someone for trim',
    serviceToken: 'trim',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'who-recommend-trim',
    prompt: 'Who do you recommend for a trim?',
    serviceToken: 'trim',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'list-trim-services',
    prompt: 'list trim services',
    serviceToken: 'trim',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'show-me-trim',
    prompt: 'show me trim',
    serviceToken: 'trim',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'best-specialists-styling',
    prompt: 'best specialists for styling',
    serviceToken: 'styling',
    expectResolveNames: ['hairstyle'],
  },
  {
    id: 'ctrl-best-haircut-next-week',
    prompt: 'best specialists for haircut next week',
    serviceToken: 'haircut',
    expectResolveNames: ['hairstyle'],
  },
] as const;

export const E2E298_EXPAND_CASES = [
  {
    id: 'expand-trim',
    query: 'trim',
    mustInclude: ['trim', 'haircut', 'hairstyle'],
  },
  {
    id: 'expand-cut',
    query: 'cut',
    mustInclude: ['cut', 'haircut', 'hairstyle'],
  },
  {
    id: 'expand-styling',
    query: 'styling',
    mustInclude: ['styling', 'haircut', 'hairstyle'],
  },
] as const;
