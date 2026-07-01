import { EXPLAIN_LOYALTY_POINTS_PROMPTS } from './ai-explain-loyalty-points.fixtures.js';
import { rescueExplainLoyaltyPointsIntent } from './ai-explain-loyalty-points.util.js';

describe('customer-ai-command explain_loyalty_points integration (ai-cmd-customer-4.5.1)', () => {
  it.each(EXPLAIN_LOYALTY_POINTS_PROMPTS)(
    'rescues explain_loyalty_points for $id',
    ({ prompt }) => {
      expect(rescueExplainLoyaltyPointsIntent(prompt, 'unknown')?.action).toBe(
        'explain_loyalty_points',
      );
    },
  );
});
