import { PROVIDER_ONBOARDING_COMPOUND_PROMPTS } from './ai-provider-onboarding-compound.fixtures.js';
import { PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS } from './ai-provider-onboarding-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID } from './ai-provider-onboarding-compound.util.js';

describe('AiProviderOnboardingCompound integration (ai-cmd-ext-4.1)', () => {
  it('registers dashboard_onboard_new_provider golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_onboard_new_provider',
    );
    expect(pattern?.recipeId).toBe(PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID);
  });

  it.each(PROVIDER_ONBOARDING_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.employeeName) {
        expect(result?.steps[0].params.employeeName).toBe(
          expectedParams.employeeName,
        );
      }
    },
  );

  it.each(PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS.slice(0, 6))(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
