/**
 * e2e-bug.290 — trailing "kindly" (and similar voice softeners) must not be
 * absorbed into create_service_category categoryName.
 */

export type E2e290KindlyCategoryCase = {
  id: string;
  prompt: string;
  expectedCategoryName: string;
  classifierCategoryName?: string;
  /** Softener substring that must not appear in the final name. */
  forbidInName?: RegExp;
};

export const E2E290_KINDLY_CATEGORY_CASES: readonly E2e290KindlyCategoryCase[] =
  [
    {
      id: 'e290-kindly-please-canonical',
      prompt:
        'add catalog category named KindlyCat E2E290-abc kindly please',
      expectedCategoryName: 'KindlyCat E2E290-abc',
      classifierCategoryName: 'KindlyCat E2E290-abc kindly',
      forbidInName: /\bkindly\b/i,
    },
    {
      id: 'e290-kindly-alone',
      prompt: 'add catalog category named Brow Bar E2E290-k kindly',
      expectedCategoryName: 'Brow Bar E2E290-k',
      classifierCategoryName: 'Brow Bar',
      forbidInName: /\bkindly\b/i,
    },
    {
      id: 'e290-please-kindly',
      prompt: 'Create a catalog category named Spa E2E290-pk please kindly',
      expectedCategoryName: 'Spa E2E290-pk',
      classifierCategoryName: 'Spa',
      forbidInName: /\bkindly\b|\bplease\b/i,
    },
    {
      id: 'e290-kindly-period',
      prompt: 'Add a new catalog category named Nails E2E290-dot kindly.',
      expectedCategoryName: 'Nails E2E290-dot',
      classifierCategoryName: 'Nails',
      forbidInName: /\bkindly\b/i,
    },
    {
      id: 'e290-kindly-thanks',
      prompt: 'Add a new catalog category called Wellness E2E290-kt kindly thanks',
      expectedCategoryName: 'Wellness E2E290-kt',
      classifierCategoryName: 'Wellness',
      forbidInName: /\bkindly\b|\bthanks\b/i,
    },
    {
      id: 'e290-kindlycat-keeps-prefix',
      prompt: 'add catalog category named KindlyCat E2E290-keep please',
      expectedCategoryName: 'KindlyCat E2E290-keep',
      classifierCategoryName: 'KindlyCat',
    },
    {
      id: 'e290-cheers',
      prompt: 'Create a new catalog category named Color E2E290-ch cheers',
      expectedCategoryName: 'Color E2E290-ch',
      classifierCategoryName: 'Color',
      forbidInName: /\bcheers\b/i,
    },
    {
      id: 'e290-appreciate-it',
      prompt:
        'Add a new catalog category named Makeup E2E290-ap appreciate it',
      expectedCategoryName: 'Makeup E2E290-ap',
      classifierCategoryName: 'Makeup',
      forbidInName: /\bappreciate\b/i,
    },
    {
      id: 'e290-service-category-kindly',
      prompt: 'add service category named Lash E2E290-sc kindly please',
      expectedCategoryName: 'Lash E2E290-sc',
      classifierCategoryName: 'Lash',
      forbidInName: /\bkindly\b/i,
    },
    {
      id: 'e290-please-only-regression',
      prompt: 'add catalog category named brows E2E290-pl please',
      expectedCategoryName: 'brows E2E290-pl',
      classifierCategoryName: 'brows',
      forbidInName: /\bplease\b/i,
    },
  ] as const;
