/**
 * e2e-bug.338 — `create_service_category` name extraction must strip a
 * trailing "with N placeholder service(s)" / RU "и N placeholder услугами"
 * count clause, not absorb it into `categoryName` (e2e-bug.312 residual).
 * placeholderCount itself is parsed separately (from the LLM classifier
 * params) and is unaffected by this fix.
 */

export type E2e338PlaceholderClauseCase = {
  id: string;
  prompt: string;
  expectedCategoryName: string;
};

export const E2E338_PLACEHOLDER_CLAUSE_CASES: readonly E2e338PlaceholderClauseCase[] =
  [
    {
      id: 'e338-en-exact-reported-repro',
      prompt:
        'Create a catalog category named QA312ENP-x with 2 placeholder services',
      expectedCategoryName: 'QA312ENP-x',
    },
    {
      id: 'e338-en-singular-placeholder-service',
      prompt:
        'Create a catalog category named QA338EN-single with 1 placeholder service',
      expectedCategoryName: 'QA338EN-single',
    },
    {
      id: 'e338-ru-exact-reported-repro',
      prompt:
        'Создай категорию каталога с названием QA312RUP-x и 2 placeholder услугами',
      expectedCategoryName: 'QA312RUP-x',
    },
    {
      id: 'e338-ru-native-uslugami-zaglushkami',
      prompt:
        'Создай категорию каталога с названием QA338RU-native и 3 услугами-заглушками',
      expectedCategoryName: 'QA338RU-native',
    },
    {
      id: 'e338-ru-single-placeholder-uslugoy',
      prompt:
        'Создай категорию каталога с названием QA338RU-single и 1 placeholder услугой',
      expectedCategoryName: 'QA338RU-single',
    },
    {
      id: 'e338-en-clause-plus-trailing-politeness',
      prompt:
        'Create a catalog category named QA338EN-combo with 2 placeholder services please',
      expectedCategoryName: 'QA338EN-combo',
    },
    {
      id: 'e338-ru-count-clause-precedes-name-regression',
      prompt:
        'Создай категорию каталога с 2 услугами-заглушками под названием QA312RUP2-x',
      expectedCategoryName: 'QA312RUP2-x',
    },
    {
      id: 'e338-en-no-count-clause-regression',
      prompt: 'Create a catalog category named QA338EN-plain please',
      expectedCategoryName: 'QA338EN-plain',
    },
  ] as const;

/** Names that legitimately contain "with"/"and" must not be truncated. */
export const E2E338_LEGITIMATE_NAME_CASES: readonly E2e338PlaceholderClauseCase[] =
  [
    {
      id: 'e338-name-contains-with-no-count',
      prompt: 'Create a catalog category named Spa with Sauna',
      expectedCategoryName: 'Spa with Sauna',
    },
    {
      id: 'e338-name-contains-and-no-count',
      prompt: 'Create a catalog category named Hair and Beauty',
      expectedCategoryName: 'Hair and Beauty',
    },
  ] as const;
