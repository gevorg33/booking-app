import {
  E2E283_GUIDE_CONTROLS,
  E2E283_MY_STATS_NO_STEAL,
} from './ai-e2e283-my-stats-guide-no-steal.fixtures.js';
import { rescueProductGuideIntent } from './ai-product-guide-rescue.util.js';
import {
  classifyPromptIntentBucket,
  resolveProductGuideDisambiguation,
  resolveProductGuidePromptMatch,
} from './ai-product-guide.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

describe('e2e-bug.283 my_stats product-guide no-steal', () => {
  it.each(E2E283_MY_STATS_NO_STEAL.map((row) => [row.id, row] as const))(
    'does not steal my_stats for $id',
    (_id, row) => {
      expect(isMyStatsPrompt(row.prompt)).toBe(row.expectMyStatsPrompt);

      const match = resolveProductGuidePromptMatch(row.prompt, {
        surface: row.surface,
      });
      expect(match.matched).toBe(row.expectGuideMatch);

      expect(
        classifyPromptIntentBucket(row.prompt, { surface: row.surface }),
      ).not.toBe('guide');

      expect(
        resolveProductGuideDisambiguation(row.prompt, row.fromAction, {
          surface: row.surface,
        }),
      ).toBeNull();

      const rescued = rescueProductGuideIntent(row.prompt, row.fromAction, {
        surface: row.surface,
      });
      expect(rescued.action).toBe(row.expectAction);
      expect(rescued.action).not.toBe('guide_user_flow');
      expect(rescued.action).not.toMatch(
        /^explain_app_feature$|^explain_current_screen$/,
      );
    },
  );

  it.each(E2E283_GUIDE_CONTROLS.map((row) => [row.id, row] as const))(
    'still rescues real guide prompts for $id',
    (_id, row) => {
      expect(isMyStatsPrompt(row.prompt)).toBe(row.expectMyStatsPrompt);

      const match = resolveProductGuidePromptMatch(row.prompt, {
        surface: row.surface,
      });
      expect(match.matched).toBe(row.expectGuideMatch);

      const rescued = rescueProductGuideIntent(row.prompt, row.fromAction, {
        surface: row.surface,
      });
      expect(rescued.action).toBe(row.expectAction);
    },
  );

  it('misclassified Home-tab guide can still leave a wrong my_stats action', () => {
    // Guard is prompt-based: a real guide prompt with fromAction my_stats may
    // still be remounted to guide_user_flow (correct correction).
    const rescued = rescueProductGuideIntent(
      'How do I use the Home tab?',
      'my_stats',
      { surface: 'provider' },
    );
    expect(rescued.action).toBe('guide_user_flow');
  });
});
