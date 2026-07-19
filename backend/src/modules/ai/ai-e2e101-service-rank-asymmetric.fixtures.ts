/**
 * e2e-bug.101 — high-end rank vocabulary must extract serviceRank + category
 * the same way "cheapest" already does (not a literal service-name search).
 */
export const E2E101_SERVICE_RANK_ASYMMETRIC_SCENARIOS = [
  {
    id: 'e2e101-most-expensive-massage',
    prompt: 'What is the most expensive massage?',
    expectedRank: 'highest_price' as const,
    expectedCategory: 'massage',
  },
  {
    id: 'e2e101-most-expensive-styling-service',
    prompt: 'Which is your most expensive styling service?',
    expectedRank: 'highest_price' as const,
    expectedCategory: 'styling',
  },
  {
    id: 'e2e101-most-premium-facial',
    prompt: 'show me the most premium facial',
    expectedRank: 'highest_price' as const,
    expectedCategory: 'facial',
  },
  {
    id: 'e2e101-book-most-expensive-massage-compound',
    prompt: 'Book the most expensive massage tomorrow, nearest slot',
    expectedRank: 'highest_price' as const,
    expectedCategory: 'massage',
    compound: true,
  },
  {
    id: 'e2e101-book-most-premium-facial-compound',
    prompt: 'Book your most premium facial tomorrow, nearest slot',
    expectedRank: 'highest_price' as const,
    expectedCategory: 'facial',
    compound: true,
  },
  {
    id: 'e2e101-cheapest-control',
    prompt: "What's the cheapest haircut you offer?",
    expectedRank: 'lowest_price' as const,
    expectedCategory: 'haircut',
  },
] as const;

export type E2e101ServiceRankAsymmetricScenario =
  (typeof E2E101_SERVICE_RANK_ASYMMETRIC_SCENARIOS)[number];
