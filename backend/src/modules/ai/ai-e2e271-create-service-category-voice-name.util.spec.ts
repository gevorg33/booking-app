import { E2E271_VOICE_CATEGORY_NAME_CASES } from './ai-e2e271-create-service-category-voice-name.fixtures.js';
import {
  enrichServiceCategoryRescueParams,
  extractCreateServiceCategoryFromPrompt,
  reconcileCreateServiceCategoryNameFromPrompt,
  stripTrailingCategoryNamePoliteness,
} from './ai-catalog.util.js';

describe('e2e-bug.271 create_service_category voice name keeps trailing tokens', () => {
  it.each(
    E2E271_VOICE_CATEGORY_NAME_CASES.map((row) => [row.id, row] as const),
  )('%s — extract keeps full name without politeness', (_id, row) => {
    expect(extractCreateServiceCategoryFromPrompt(row.prompt)).toBe(
      row.expectedCategoryName,
    );
  });

  it.each(
    E2E271_VOICE_CATEGORY_NAME_CASES.map((row) => [row.id, row] as const),
  )(
    '%s — reconcile prefers prompt over short classifier categoryName',
    (_id, row) => {
      const params: Record<string, unknown> = {
        categoryName: row.classifierCategoryName ?? 'truncated',
      };
      reconcileCreateServiceCategoryNameFromPrompt(row.prompt, params);
      expect(params.categoryName).toBe(row.expectedCategoryName);
    },
  );

  it.each(
    E2E271_VOICE_CATEGORY_NAME_CASES.map((row) => [row.id, row] as const),
  )('%s — enrichServiceCategoryRescueParams wins for create', (_id, row) => {
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

  it('stripTrailingCategoryNamePoliteness leaves core name intact', () => {
    expect(stripTrailingCategoryNamePoliteness('brows E2E271-abc please')).toBe(
      'brows E2E271-abc',
    );
    expect(stripTrailingCategoryNamePoliteness('Spa Treatments.')).toBe(
      'Spa Treatments',
    );
  });
});
