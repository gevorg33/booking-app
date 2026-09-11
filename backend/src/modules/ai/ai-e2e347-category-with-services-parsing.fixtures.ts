/**
 * e2e-bug.347 — "create a category *with* these services" prompts created the
 * category but silently dropped every service.
 *
 * Three independent defects in `ai-catalog.util.ts`, all in the bulk-catalog
 * parsing path:
 *  1. `SERVICE_LINE` only matched the whitespace-only shape `Name 60m $65`, so
 *     the two shapes people actually type — `Name, 30 minutes, $50` and
 *     `Name (30 min, $50)` — parsed to zero services. With no service lines,
 *     `bulk_create_catalog` fell through to its "Provide category and service
 *     lines" clarify and nothing was created.
 *  2. `parseBulkCatalogFromPrompt`'s category capture used `{1,40}?`, which
 *     demands at least two characters — so a single-letter category ("category
 *     Y with …") never matched and the whole draft came back `null`.
 *  3. The first parsed service name absorbed the command preamble
 *     ("Create category Hair with Women's cut" instead of "Women's cut") and,
 *     in the compound path, the category name absorbed the trailing service
 *     clause ("Y with services A"). Defect 3 predates this ticket.
 */

export type E2e347ServiceLine = {
  serviceName: string;
  durationMinutes: number;
  price: number;
};

export type E2e347ParseCase = {
  id: string;
  text: string;
  expected: E2e347ServiceLine[];
};

/** `parseServiceLinesFromText` — the shapes users actually type. */
export const E2E347_SERVICE_LINE_CASES: readonly E2e347ParseCase[] = [
  {
    id: 'e347-comma-delimited-minutes-and-price',
    text: 'service A, 30 minutes, $50; service B, 45 minutes, $45; service C, 60 minutes, $70',
    expected: [
      { serviceName: 'A', durationMinutes: 30, price: 50 },
      { serviceName: 'B', durationMinutes: 45, price: 45 },
      { serviceName: 'C', durationMinutes: 60, price: 70 },
    ],
  },
  {
    id: 'e347-parenthesised-duration-and-price',
    text: 'A (30 min, $50) and B (45 min, $45)',
    expected: [
      { serviceName: 'A', durationMinutes: 30, price: 50 },
      { serviceName: 'B', durationMinutes: 45, price: 45 },
    ],
  },
  {
    id: 'e347-parenthesised-with-service-descriptor',
    text: 'service C (60 min, $70) and service D (20 min, $30)',
    expected: [
      { serviceName: 'C', durationMinutes: 60, price: 70 },
      { serviceName: 'D', durationMinutes: 20, price: 30 },
    ],
  },
  {
    // Regression guard: the original whitespace-only shape must still parse,
    // and must no longer bleed the command preamble into the first name.
    id: 'e347-legacy-whitespace-shape-no-preamble-bleed',
    text: "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
    expected: [
      { serviceName: "Women's cut", durationMinutes: 60, price: 65 },
      { serviceName: "Men's cut", durationMinutes: 30, price: 35 },
    ],
  },
];

export type E2e347DraftCase = {
  id: string;
  prompt: string;
  expectedCategoryName: string;
  expectedServiceNames: string[];
};

/** `parseBulkCatalogFromPrompt` — category + its services from one prompt. */
export const E2E347_BULK_DRAFT_CASES: readonly E2e347DraftCase[] = [
  {
    id: 'e347-case1-single-category-three-services',
    prompt:
      'Create a category Y with three services: service A, 30 minutes, $50; service B, 45 minutes, $45; service C, 60 minutes, $70 — and enable online payment for all of them.',
    expectedCategoryName: 'Y',
    expectedServiceNames: ['A', 'B', 'C'],
  },
  {
    id: 'e347-case2-segment-one',
    prompt:
      'Create category Y with services A (30 min, $50) and B (45 min, $45)',
    expectedCategoryName: 'Y',
    expectedServiceNames: ['A', 'B'],
  },
  {
    id: 'e347-case2-segment-two',
    prompt:
      'create category Z with services C (60 min, $70) and D (20 min, $30)',
    expectedCategoryName: 'Z',
    expectedServiceNames: ['C', 'D'],
  },
  {
    id: 'e347-legacy-multiword-category-still-parses',
    prompt: "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
    expectedCategoryName: 'Hair',
    expectedServiceNames: ["Women's cut", "Men's cut"],
  },
];
