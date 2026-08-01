/**
 * e2e-bug.200 — customer_flexible_availability_budget_compound must keep
 * multi-word service names and still form the OR+budget+book compound for
 * catalog services like hairstyle / Swedish massage / Neck Massage.
 */

export type E2E200CompoundCase = {
  id: string;
  prompt: string;
  expectBookCompound: boolean;
  /** After decompose, step 1 must carry at least one of these. */
  expectServiceName?: string | null;
  expectServiceCategory?: string | null;
  forbidServiceCategory?: string;
};

export const E2E200_COMPOUND_CASES: readonly E2E200CompoundCase[] = [
  {
    id: 'neck-massage-want-budget-book',
    prompt:
      'I want a Neck Massage tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectBookCompound: true,
    // list-enrich may place the full name on serviceCategory
    expectServiceName: 'Neck Massage',
  },
  {
    id: 'hairstyle-want-budget-book',
    prompt:
      'I want a hairstyle tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectBookCompound: true,
    expectServiceCategory: 'hairstyle',
  },
  {
    id: 'swedish-whos-free-budget-book',
    prompt:
      "Who's free for a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest",
    expectBookCompound: true,
    expectServiceName: 'Swedish massage',
    forbidServiceCategory: 'swedish',
  },
  {
    id: 'swedish-want-budget-book',
    prompt:
      'I want a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest',
    expectBookCompound: true,
    // list-enrich may keep multi-word on serviceCategory OR serviceName
    expectServiceName: 'Swedish massage',
  },
  {
    id: 'haircut-whos-free-control',
    prompt:
      "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
    expectBookCompound: true,
    expectServiceCategory: 'haircut',
  },
  {
    id: 'full-body-massage-want',
    prompt:
      'I want a full body massage tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectBookCompound: true,
    expectServiceName: 'full body massage',
    forbidServiceCategory: 'full',
  },
];

export const E2E200_NORMALIZE_CASES = [
  {
    id: 'multi-swedish',
    input: 'Swedish massage',
    expectCategory: 'Swedish massage',
    expectFields: {
      serviceName: 'Swedish massage',
      serviceCategory: null,
    },
  },
  {
    id: 'multi-neck',
    input: 'Neck Massage',
    expectCategory: 'Neck Massage',
    expectFields: {
      serviceName: 'Neck Massage',
      serviceCategory: null,
    },
  },
  {
    id: 'single-haircut',
    input: 'haircut',
    expectCategory: 'haircut',
    expectFields: { serviceName: null, serviceCategory: 'haircut' },
  },
  {
    id: 'single-hairstyle',
    input: 'hairstyle',
    expectCategory: 'hairstyle',
    expectFields: { serviceName: null, serviceCategory: 'hairstyle' },
  },
  {
    id: 'plural-hairstyles',
    input: 'hairstyles',
    expectCategory: 'hairstyle',
    expectFields: { serviceName: null, serviceCategory: 'hairstyle' },
  },
] as const;

export const E2E200_BOOK_NEAREST_PROMPTS = [
  {
    id: 'hairstyle-book-soonest',
    prompt:
      'I want a hairstyle tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expect: true,
  },
  {
    id: 'neck-book-soonest',
    prompt:
      'I want a Neck Massage tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expect: true,
  },
  {
    id: 'swedish-whos-free-book',
    prompt:
      "Who's free for a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest",
    expect: true,
  },
  {
    id: 'neg-no-book-verb',
    prompt: 'I want a hairstyle tomorrow evening or Friday afternoon, I have $50',
    expect: false,
  },
] as const;
