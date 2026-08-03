/**
 * e2e-bug.340 — `matchServiceInPrompt`'s clarify-follow-up fallback must not
 * let an apostrophe-possessive catalog name (e.g. "Men's cut") fragment into
 * a lone single-character "s" token that spuriously matches almost any
 * prompt word via `token.includes(nt)`.
 */

export type E2e340ApostropheServiceCase = {
  id: string;
  prompt: string;
  expectedServiceId: string | undefined;
};

export const E2E340_CATALOG = [
  { id: 'svc-hairstyle', name: 'hairstyle' },
  { id: 'svc-men', name: "Men's cut" },
  { id: 'svc-women', name: "Women's cut" },
] as const;

export const E2E340_CASES: readonly E2e340ApostropheServiceCase[] = [
  {
    id: 'e340-exact-reported-repro',
    prompt: 'list style services',
    expectedServiceId: undefined,
  },
  {
    id: 'e340-unrelated-does-this-service-exist',
    prompt: 'does this service exist',
    expectedServiceId: undefined,
  },
  {
    id: 'e340-unrelated-what-services-are-these',
    prompt: 'what services are these',
    expectedServiceId: undefined,
  },
  {
    id: 'e340-legit-mens-cut-resolves',
    prompt: "men's cut please",
    expectedServiceId: 'svc-men',
  },
  {
    id: 'e340-legit-womens-cut-resolves',
    prompt: "women's cut please",
    expectedServiceId: 'svc-women',
  },
] as const;
