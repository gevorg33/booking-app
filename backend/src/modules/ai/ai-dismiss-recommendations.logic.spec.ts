import {
  DISMISS_RECOMMENDATIONS_PROMPTS,
  DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS,
} from './ai-dismiss-recommendations.fixtures.js';
import { DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS } from './ai-dismiss-recommendations-multilingual.fixtures.js';
import { handleDismissRecommendationsLogic } from './ai-dismiss-recommendations.logic.js';
import { rescueDismissRecommendationsIntent } from './ai-dismiss-recommendations.util.js';

describe('ai-dismiss-recommendations.logic (ai-cmd-customer-4.16.2)', () => {
  it.each(DISMISS_RECOMMENDATIONS_PROMPTS)(
    'handles dismiss prompt $id',
    async ({ prompt, bookingId }) => {
      const result = await handleDismissRecommendationsLogic(
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('dismiss_recommendations');
      expect(result.details?.clientAction).toBe(
        'dismissConsumerCheckoutRecommendations',
      );
      expect(result.details?.recommendationsDismissed).toBe(true);
      expect(result.sessionContext?.checkoutRecommendationsDismissed).toBe(
        'true',
      );
      if (bookingId) {
        expect(result.sessionContext?.bookingId).toBe(bookingId);
        expect(result.details?.bookingId).toBe(bookingId);
      }
    },
  );

  it.each(DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS)(
    'handles multilingual dismiss prompt $id',
    async ({ prompt }) => {
      const result = await handleDismissRecommendationsLogic(
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('dismiss_recommendations');
    },
  );

  it.each(DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS)(
    'rescues $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueDismissRecommendationsIntent(prompt, misclassifiedAction)?.action,
      ).toBe('dismiss_recommendations');
    },
  );

  it('uses session bookingId from params', async () => {
    const result = await handleDismissRecommendationsLogic(
      'biz-1',
      { bookingId: 'bk-session-1', serviceId: 'svc-1' },
      'Hide You might also like',
    );
    expect(result.sessionContext?.bookingId).toBe('bk-session-1');
    expect(result.sessionContext?.serviceId).toBe('svc-1');
  });

  it('returns clarify when prompt is not dismiss', async () => {
    const result = await handleDismissRecommendationsLogic(
      'biz-1',
      {},
      'Why am I seeing shampoo recommendations?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
