import { CLINIC_LAB_REVIEW_COMPOUND_PROMPTS } from './ai-clinic-lab-review-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-review-compound-multilingual.fixtures.js';
import { CLINIC_LAB_REVIEW_RECIPE_ID } from './ai-clinic-lab-review-compound.util.js';

describe('AiClinicLabReviewCompound integration (ai-cmd-clinic-6-gap-6.1)', () => {
  it('registers dashboard_clinic_lab_review golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_clinic_lab_review',
    );
    expect(pattern?.recipeId).toBe(CLINIC_LAB_REVIEW_RECIPE_ID);
  });

  it.each(CLINIC_LAB_REVIEW_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CLINIC_LAB_REVIEW_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.customerName) {
        expect(result?.steps[0].params.customerName).toBe(
          expectedParams.customerName,
        );
        expect(result?.steps[1].params.customerName).toBe(
          expectedParams.customerName,
        );
      }
    },
  );

  it.each(CLINIC_LAB_REVIEW_MULTILINGUAL_SCENARIOS.slice(0, 6))(
    'decomposeDeterministicForSurface $locale $id',
    ({ prompt, orderedActions, locale }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CLINIC_LAB_REVIEW_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(locale).toMatch(/^(hy|ru)$/);
    },
  );
});
