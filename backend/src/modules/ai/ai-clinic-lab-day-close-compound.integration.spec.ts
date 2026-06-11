import { CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS } from './ai-clinic-lab-day-close-compound.fixtures.js';
import { CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-day-close-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { CLINIC_LAB_DAY_CLOSE_RECIPE_ID } from './ai-clinic-lab-day-close-compound.util.js';

describe('AiClinicLabDayCloseCompound integration (ai-cmd-ext-4.2)', () => {
  it('registers dashboard_clinic_lab_day_close golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_clinic_lab_day_close',
    );
    expect(pattern?.recipeId).toBe(CLINIC_LAB_DAY_CLOSE_RECIPE_ID);
  });

  it.each(CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CLINIC_LAB_DAY_CLOSE_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.orderId) {
        expect(result?.steps[1].params.orderId).toBe(expectedParams.orderId);
      }
    },
  );

  it.each(CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS.slice(0, 6))(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(CLINIC_LAB_DAY_CLOSE_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
