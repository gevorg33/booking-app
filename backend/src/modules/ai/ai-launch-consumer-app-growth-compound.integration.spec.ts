import { LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS } from './ai-launch-consumer-app-growth-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID } from './ai-launch-consumer-app-growth-compound.util.js';

describe('AiLaunchConsumerAppGrowthCompound integration (ai-cmd-ext-4.9)', () => {
  it('registers dashboard_launch_consumer_app_growth golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_launch_consumer_app_growth',
    );
    expect(pattern?.recipeId).toBe(LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID);
  });

  it.each(LAUNCH_CONSUMER_APP_GROWTH_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.emailOnNewCustomerRegistration === true) {
        expect(result?.steps[2].params.emailOnNewCustomerRegistration).toBe(
          true,
        );
      }
      if (expectedParams?.marketingTeamEmails) {
        expect(result?.steps[2].params.marketingTeamEmails).toEqual(
          expectedParams.marketingTeamEmails,
        );
      }
    },
  );
});
