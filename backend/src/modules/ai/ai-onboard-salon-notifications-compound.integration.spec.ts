import { ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS } from './ai-onboard-salon-notifications-compound.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID } from './ai-onboard-salon-notifications-compound.util.js';

describe('AiOnboardSalonNotificationsCompound integration (ai-cmd-ext-4.8)', () => {
  it('registers dashboard_onboard_salon_notifications golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_onboard_salon_notifications',
    );
    expect(pattern?.recipeId).toBe(ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID);
  });

  it.each(ONBOARD_SALON_NOTIFICATIONS_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.usePlatformDefault === true) {
        expect(result?.steps[1].params.usePlatformDefault).toBe(true);
      }
      if (expectedParams?.emailEnabled === true) {
        expect(result?.steps[0].params.emailEnabled).toBe(true);
      }
    },
  );
});
