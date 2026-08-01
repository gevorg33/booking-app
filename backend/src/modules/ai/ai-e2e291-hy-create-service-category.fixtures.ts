/**
 * e2e-bug.291 — HY catalog-category create must route to create_service_category,
 * not explain_clinic_services (կատեգորիա false-positive on clinic read cue `որ`).
 */

export type E2e291HyCreateCategoryCase = {
  id: string;
  prompt: string;
  expectCreateCategory: boolean;
  expectClinicExplain: boolean;
  expectedCategoryName?: string;
};

/** Positives — HY (and EN regression) create category. */
export const E2E291_CREATE_CATEGORY_CASES: readonly E2e291HyCreateCategoryCase[] =
  [
    {
      id: 'e291-hy-canonical-catalog-anunov',
      prompt: 'Ավելացրու կատալոգի կատեգորիա անունով HYCat E2E291-a',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'HYCat E2E291-a',
    },
    {
      id: 'e291-hy-steghtsir-catalog',
      prompt: 'Ստեղծիր կատալոգի կատեգորիա անունով Spa HY E2E291-b',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'Spa HY E2E291-b',
    },
    {
      id: 'e291-hy-category-only-anunov',
      prompt: 'Ավելացրու կատեգորիա անունով Nails E2E291-c',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'Nails E2E291-c',
    },
    {
      id: 'e291-hy-service-category',
      prompt: 'Ավելացրու ծառայության կատեգորիա անունով Color E2E291-d',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'Color E2E291-d',
    },
    {
      id: 'e291-hy-colon-style',
      prompt: 'Ստեղծիր կատալոգի կատեգորիա՝ Brow Bar E2E291-e',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'Brow Bar E2E291-e',
    },
    {
      id: 'e291-hy-please',
      prompt:
        'Ավելացրու կատալոգի կատեգորիա անունով Wellness E2E291-f խնդրում եմ',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'Wellness E2E291-f',
    },
    {
      id: 'e291-en-regression-catalog',
      prompt: 'Add a new catalog category named QA Nails E2E291-en',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'QA Nails E2E291-en',
    },
    {
      id: 'e291-en-regression-voice',
      prompt: 'add catalog category named brows E2E291-v please',
      expectCreateCategory: true,
      expectClinicExplain: false,
      expectedCategoryName: 'brows E2E291-v',
    },
  ] as const;

/** Negatives — real clinic explain must still match. */
export const E2E291_KEEP_CLINIC_EXPLAIN_CASES: readonly E2e291HyCreateCategoryCase[] =
  [
    {
      id: 'e291-keep-hy-clinic-services',
      prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները և բաժինները',
      expectCreateCategory: false,
      expectClinicExplain: true,
    },
    {
      id: 'e291-keep-hy-fasting-labs',
      prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող',
      expectCreateCategory: false,
      expectClinicExplain: true,
    },
    {
      id: 'e291-keep-hy-consultation-count',
      prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
      expectCreateCategory: false,
      expectClinicExplain: true,
    },
    {
      id: 'e291-keep-en-which-lab-fasting',
      prompt: 'Which lab tests require fasting?',
      expectCreateCategory: false,
      expectClinicExplain: true,
    },
  ] as const;
