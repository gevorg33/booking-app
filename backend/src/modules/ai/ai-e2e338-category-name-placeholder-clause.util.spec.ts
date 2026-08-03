import {
  E2E338_LEGITIMATE_NAME_CASES,
  E2E338_PLACEHOLDER_CLAUSE_CASES,
} from './ai-e2e338-category-name-placeholder-clause.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  extractCreateServiceCategoryFromPrompt,
  reconcileCreateServiceCategoryNameFromPrompt,
} from './ai-catalog.util.js';

describe('e2e-bug.338: create_service_category name extraction strips trailing placeholder-count clause', () => {
  it.each(
    E2E338_PLACEHOLDER_CLAUSE_CASES.map((row) => [row.id, row] as const),
  )('%s', (_id, row) => {
    expect(extractCreateServiceCategoryFromPrompt(row.prompt)).toBe(
      row.expectedCategoryName,
    );

    const params: Record<string, unknown> = { categoryName: 'truncated' };
    reconcileCreateServiceCategoryNameFromPrompt(row.prompt, params);
    expect(params.categoryName).toBe(row.expectedCategoryName);

    const enrichParams: Record<string, unknown> = {
      categoryName: 'truncated',
    };
    enrichServiceCategoryRescueParams(
      'create_service_category',
      enrichParams,
      row.prompt,
    );
    expect(enrichParams.categoryName).toBe(row.expectedCategoryName);
  });

  it.each(
    E2E338_LEGITIMATE_NAME_CASES.map((row) => [row.id, row] as const),
  )('%s — legitimate "with"/"and" in name is preserved', (_id, row) => {
    expect(extractCreateServiceCategoryFromPrompt(row.prompt)).toBe(
      row.expectedCategoryName,
    );
  });
});
