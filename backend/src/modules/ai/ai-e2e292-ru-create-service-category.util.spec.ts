import {
  E2E292_CREATE_CATEGORY_CASES,
  E2E292_KEEP_BULK_CASES,
} from './ai-e2e292-ru-create-service-category.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  extractCreateServiceCategoryFromPrompt,
  isBulkCreateCatalogPrompt,
  isCreateServiceCategoryPrompt,
  rescueCatalogIntent,
} from './ai-catalog.util.js';
import { isCreateEmployeePrompt } from './ai-staff-operations.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.292 RU create_service_category ≠ bulk_create_catalog', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E292_CREATE_CATEGORY_CASES.map((row) => [row.id, row] as const))(
    'create path for $id',
    (_id, row) => {
      expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(true);
      expect(isBulkCreateCatalogPrompt(row.prompt)).toBe(false);
      expect(isCreateEmployeePrompt(row.prompt)).toBe(false);
      expect(
        rescueCatalogIntent(row.prompt, 'bulk_create_catalog'),
      ).toMatchObject({
        action: 'create_service_category',
        rescueReason: 'service_category',
      });
      expect(rescueCatalogIntent(row.prompt, 'unknown')).toMatchObject({
        action: 'create_service_category',
      });

      if (row.expectedCategoryName) {
        expect(extractCreateServiceCategoryFromPrompt(row.prompt)).toBe(
          row.expectedCategoryName,
        );
        const params: Record<string, unknown> = {};
        enrichServiceCategoryRescueParams(
          'create_service_category',
          params,
          row.prompt,
        );
        expect(params.categoryName).toBe(row.expectedCategoryName);
      }
    },
  );

  it.each(E2E292_CREATE_CATEGORY_CASES.map((row) => [row.id, row] as const))(
    'gateway remaps bulk_create_catalog for $id',
    (_id, row) => {
      const fromBulk = rescue.rescue({
        prompt: row.prompt,
        action: 'bulk_create_catalog',
        params: {},
        surface: 'dashboard',
      });
      expect(fromBulk?.action).toBe('create_service_category');

      const fromUnknown = rescue.rescue({
        prompt: row.prompt,
        action: 'unknown',
        params: {},
        surface: 'dashboard',
      });
      expect(fromUnknown?.action).toBe('create_service_category');
    },
  );

  it.each(E2E292_KEEP_BULK_CASES.map((row) => [row.id, row] as const))(
    'keeps bulk for $id',
    (_id, row) => {
      expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(false);
      expect(isBulkCreateCatalogPrompt(row.prompt)).toBe(true);
      expect(rescueCatalogIntent(row.prompt, 'unknown')?.action).toBe(
        'bulk_create_catalog',
      );
    },
  );

  it('Color category name is not create_employee', () => {
    const prompt = 'Добавь категорию с названием Color E2E292-x';
    expect(isCreateEmployeePrompt(prompt)).toBe(false);
    expect(isCreateServiceCategoryPrompt(prompt)).toBe(true);
  });
});
