import {
  E2E251_CREATE_CATEGORY_SCENARIOS,
  E2E251_KEEP_IMPORT_SCENARIOS,
} from './ai-e2e251-catalog-category-not-menu-import.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  isCreateServiceCategoryPrompt,
  rescueCatalogIntent,
} from './ai-catalog.util.js';
import {
  isImportServicesFromMenuPrompt,
  rescueOperationsIntent,
} from './ai-operations.util.js';

describe('e2e-bug.251 catalog category ≠ import_services_from_menu', () => {
  it.each(
    E2E251_CREATE_CATEGORY_SCENARIOS.map((row) => [row.id, row] as const),
  )('create path for %s', (_id, row) => {
    expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(
      row.expectCreateCategory,
    );
    expect(isImportServicesFromMenuPrompt(row.prompt)).toBe(
      row.expectImportMenu,
    );

    expect(
      rescueCatalogIntent(row.prompt, 'import_services_from_menu'),
    ).toMatchObject({
      action: 'create_service_category',
      rescueReason: 'service_category',
    });
    expect(
      rescueOperationsIntent(row.prompt, 'unknown', {}),
    ).toBeNull();

    if (row.categoryName) {
      const params: Record<string, unknown> = {};
      enrichServiceCategoryRescueParams(
        'create_service_category',
        params,
        row.prompt,
      );
      expect(String(params.categoryName)).toMatch(
        new RegExp(row.categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      );
    }
  });

  it.each(E2E251_KEEP_IMPORT_SCENARIOS.map((row) => [row.id, row] as const))(
    'keeps menu import for %s',
    (_id, row) => {
      expect(isImportServicesFromMenuPrompt(row.prompt)).toBe(true);
      expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(false);
      expect(
        rescueOperationsIntent(row.prompt, 'unknown', {})?.action,
      ).toBe('import_services_from_menu');
    },
  );
});
