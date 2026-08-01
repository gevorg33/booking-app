import { E2E290_KINDLY_CATEGORY_CASES } from './ai-e2e290-create-service-category-kindly.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  extractCreateServiceCategoryFromPrompt,
  reconcileCreateServiceCategoryNameFromPrompt,
  stripTrailingCategoryNamePoliteness,
} from './ai-catalog.util.js';

describe('e2e-bug.290 create_service_category strips trailing kindly', () => {
  it.each(
    E2E290_KINDLY_CATEGORY_CASES.map((row) => [row.id, row] as const),
  )('%s — extract drops softener, keeps suffix', (_id, row) => {
    const extracted = extractCreateServiceCategoryFromPrompt(row.prompt);
    expect(extracted).toBe(row.expectedCategoryName);
    if (row.forbidInName) {
      expect(extracted).not.toMatch(row.forbidInName);
    }
  });

  it.each(
    E2E290_KINDLY_CATEGORY_CASES.map((row) => [row.id, row] as const),
  )('%s — reconcile prefers prompt over classifier + kindly', (_id, row) => {
    const params: Record<string, unknown> = {
      categoryName: row.classifierCategoryName ?? 'truncated',
    };
    reconcileCreateServiceCategoryNameFromPrompt(row.prompt, params);
    expect(params.categoryName).toBe(row.expectedCategoryName);
    if (row.forbidInName) {
      expect(String(params.categoryName)).not.toMatch(row.forbidInName);
    }
  });

  it.each(
    E2E290_KINDLY_CATEGORY_CASES.map((row) => [row.id, row] as const),
  )('%s — enrichServiceCategoryRescueParams', (_id, row) => {
    const params: Record<string, unknown> = {
      categoryName: row.classifierCategoryName ?? 'truncated',
    };
    enrichServiceCategoryRescueParams(
      'create_service_category',
      params,
      row.prompt,
    );
    expect(params.categoryName).toBe(row.expectedCategoryName);
  });

  it('stripTrailingCategoryNamePoliteness covers kindly stacks', () => {
    expect(
      stripTrailingCategoryNamePoliteness('KindlyCat E2E290-x kindly please'),
    ).toBe('KindlyCat E2E290-x');
    expect(
      stripTrailingCategoryNamePoliteness('Spa E2E290-y please kindly'),
    ).toBe('Spa E2E290-y');
    expect(stripTrailingCategoryNamePoliteness('KindlyCat')).toBe('KindlyCat');
    expect(
      stripTrailingCategoryNamePoliteness('Nails E2E290-z kindly.'),
    ).toBe('Nails E2E290-z');
  });

  it('does not strip KindlyCat prefix when softener is absent', () => {
    expect(
      stripTrailingCategoryNamePoliteness('KindlyCat E2E290-keep'),
    ).toBe('KindlyCat E2E290-keep');
  });
});
