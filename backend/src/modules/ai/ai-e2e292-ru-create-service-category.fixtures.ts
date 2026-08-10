/**
 * e2e-bug.292 — RU catalog-category create must route to create_service_category,
 * not bulk_create_catalog confirm (and not create_employee for names like Color).
 */

export type E2e292RuCreateCategoryCase = {
  id: string;
  prompt: string;
  expectCreateCategory: boolean;
  expectBulk: boolean;
  expectedCategoryName?: string;
};

/** Positives — RU (and EN/HY regression) single category create. */
export const E2E292_CREATE_CATEGORY_CASES: readonly E2e292RuCreateCategoryCase[] =
  [
    {
      id: 'e292-ru-canonical-catalog-nazvaniem',
      prompt: 'Добавь категорию каталога с названием RUCat E2E292-a пожалуйста',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'RUCat E2E292-a',
    },
    {
      id: 'e292-ru-sozdai-catalog',
      prompt: 'Создай категорию каталога с названием Spa RU E2E292-b',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'Spa RU E2E292-b',
    },
    {
      id: 'e292-ru-category-only',
      prompt: 'Добавь категорию с названием Nails E2E292-c',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'Nails E2E292-c',
    },
    {
      id: 'e292-ru-pod-nazvaniem',
      prompt: 'Создай новую категорию каталога под названием Wellness E2E292-d',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'Wellness E2E292-d',
    },
    {
      id: 'e292-ru-color-not-employee',
      prompt: 'Добавь категорию с названием Color E2E292-e',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'Color E2E292-e',
    },
    {
      id: 'e292-ru-quotes',
      prompt: 'Создай категорию каталога «Brow Bar E2E292-f»',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'Brow Bar E2E292-f',
    },
    {
      id: 'e292-en-regression',
      prompt: 'Add a new catalog category named QA Nails E2E292-en',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'QA Nails E2E292-en',
    },
    {
      id: 'e292-hy-regression',
      prompt: 'Ավելացրու կատալոգի կատեգորիա անունով HYCat E2E292-hy',
      expectCreateCategory: true,
      expectBulk: false,
      expectedCategoryName: 'HYCat E2E292-hy',
    },
  ] as const;

/** Negatives — real bulk catalog must stay bulk. */
export const E2E292_KEEP_BULK_CASES: readonly E2e292RuCreateCategoryCase[] = [
  {
    id: 'e292-keep-en-bulk-hair',
    prompt: "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
    expectCreateCategory: false,
    expectBulk: true,
  },
  {
    id: 'e292-keep-en-bulk-counted',
    prompt: 'Add a new category Color with 3 linked services',
    expectCreateCategory: false,
    expectBulk: true,
  },
] as const;
