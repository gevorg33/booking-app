import {
  E2E291_CREATE_CATEGORY_CASES,
  E2E291_KEEP_CLINIC_EXPLAIN_CASES,
} from './ai-e2e291-hy-create-service-category.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  extractCreateServiceCategoryFromPrompt,
  isCreateServiceCategoryPrompt,
  rescueCatalogIntent,
} from './ai-catalog.util.js';
import {
  isExplainClinicServicesPrompt,
  rescueExplainClinicServicesIntent,
} from './ai-clinic-service.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.291 HY create_service_category ≠ explain_clinic_services', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E291_CREATE_CATEGORY_CASES.map((row) => [row.id, row] as const))(
    'create path for $id',
    (_id, row) => {
      expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(true);
      expect(isExplainClinicServicesPrompt(row.prompt)).toBe(false);
      expect(
        rescueExplainClinicServicesIntent(row.prompt, 'unknown'),
      ).toBeNull();
      expect(
        rescueCatalogIntent(row.prompt, 'explain_clinic_services'),
      ).toMatchObject({
        action: 'create_service_category',
        rescueReason: 'service_category',
      });
      expect(
        rescueCatalogIntent(row.prompt, 'unknown'),
      ).toMatchObject({
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

  it.each(E2E291_CREATE_CATEGORY_CASES.map((row) => [row.id, row] as const))(
    'gateway rescue remaps explain_clinic_services for $id',
    (_id, row) => {
      const fromClinic = rescue.rescue({
        prompt: row.prompt,
        action: 'explain_clinic_services',
        params: {},
        surface: 'dashboard',
      });
      expect(fromClinic?.action).toBe('create_service_category');

      const fromUnknown = rescue.rescue({
        prompt: row.prompt,
        action: 'unknown',
        params: {},
        surface: 'dashboard',
      });
      expect(fromUnknown?.action).toBe('create_service_category');
    },
  );

  it.each(
    E2E291_KEEP_CLINIC_EXPLAIN_CASES.map((row) => [row.id, row] as const),
  )('keeps clinic explain for $id', (_id, row) => {
    expect(isCreateServiceCategoryPrompt(row.prompt)).toBe(false);
    expect(isExplainClinicServicesPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainClinicServicesIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_clinic_services');
  });

  it('որ inside կատեգորիա is not a clinic read cue', () => {
    const prompt = 'Ավելացրու կատալոգի կատեգորիա անունով Fake';
    expect(isExplainClinicServicesPrompt(prompt)).toBe(false);
    expect(isCreateServiceCategoryPrompt(prompt)).toBe(true);
  });
});
