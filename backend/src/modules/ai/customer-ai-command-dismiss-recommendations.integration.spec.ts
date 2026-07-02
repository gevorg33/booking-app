import { rescueDismissRecommendationsIntent } from './ai-dismiss-recommendations.util.js';
import { DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS } from './ai-dismiss-recommendations-multilingual.fixtures.js';
import { DISMISS_RECOMMENDATIONS_PROMPTS } from './ai-dismiss-recommendations.fixtures.js';

describe('customer-ai-command dismiss_recommendations integration (ai-cmd-customer-4.16.2)', () => {
  it.each(
    [
      ...DISMISS_RECOMMENDATIONS_PROMPTS,
      ...DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues dismiss_recommendations for $0', (_id, prompt) => {
    expect(rescueDismissRecommendationsIntent(prompt, 'unknown')?.action).toBe(
      'dismiss_recommendations',
    );
  });
});
