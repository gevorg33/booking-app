import {
  DISMISS_RECOMMENDATIONS_PROMPTS,
  DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS,
} from './ai-dismiss-recommendations.fixtures.js';
import { DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS } from './ai-dismiss-recommendations-multilingual.fixtures.js';
import {
  buildDismissRecommendationsSummary,
  enrichDismissRecommendationsParamsFromPrompt,
  isDismissRecommendationsIntent,
  isDismissRecommendationsPrompt,
  parseDismissRecommendationsFromPrompt,
  rescueDismissRecommendationsIntent,
} from './ai-dismiss-recommendations.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';
import { isExplainConsumerCheckoutSuccessPrompt } from './ai-consumer-checkout-success.util.js';

describe('ai-dismiss-recommendations.util (ai-cmd-customer-4.16.2)', () => {
  it.each(DISMISS_RECOMMENDATIONS_PROMPTS)(
    'detects dismiss prompt $id',
    ({ prompt }) => {
      expect(isDismissRecommendationsPrompt(prompt)).toBe(true);
      expect(parseDismissRecommendationsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual dismiss prompt $id',
    ({ prompt }) => {
      expect(isDismissRecommendationsPrompt(prompt)).toBe(true);
      expect(parseDismissRecommendationsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS)(
    'rescues $misclassifiedAction to dismiss_recommendations for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueDismissRecommendationsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'dismiss_recommendations',
        rescueReason: 'dismiss_recommendations',
      });
    },
  );

  it('does not rescue when action is already dismiss_recommendations', () => {
    expect(
      rescueDismissRecommendationsIntent(
        'Hide You might also like',
        'dismiss_recommendations',
      ),
    ).toBeNull();
  });

  it('does not steal explain checkout recommendations read prompts', () => {
    const prompt =
      'What are the You might also like products on the consumer app success screen?';
    expect(isDismissRecommendationsPrompt(prompt)).toBe(false);
    expect(isExplainCheckoutRecommendationsPrompt(prompt)).toBe(true);
  });

  it('does not steal explain consumer checkout success dismiss questions', () => {
    const prompt =
      'What does Dismiss recommendations do on the app success screen?';
    expect(isDismissRecommendationsPrompt(prompt)).toBe(false);
    expect(isExplainConsumerCheckoutSuccessPrompt(prompt)).toBe(true);
  });

  it('does not treat cancel booking as dismiss recommendations', () => {
    expect(isDismissRecommendationsPrompt('Cancel my booking')).toBe(false);
    expect(isDismissRecommendationsPrompt('Dismiss my appointment')).toBe(
      false,
    );
  });

  it('extracts bookingId from prompt', () => {
    expect(
      parseDismissRecommendationsFromPrompt(
        'Hide recommendations for booking bk-abc123',
      )?.bookingId,
    ).toBe('bk-abc123');
  });

  it('recognizes dismiss_recommendations intent', () => {
    expect(isDismissRecommendationsIntent('dismiss_recommendations')).toBe(
      true,
    );
    expect(
      isDismissRecommendationsIntent('explain_checkout_recommendations'),
    ).toBe(false);
  });

  it('detects imperative variants outside fixture list', () => {
    expect(
      isDismissRecommendationsPrompt('Turn off product recommendations'),
    ).toBe(true);
    expect(
      isDismissRecommendationsPrompt('Get rid of these product cards'),
    ).toBe(true);
    expect(
      isDismissRecommendationsPrompt('Remove the recommendations section'),
    ).toBe(true);
    expect(
      isDismissRecommendationsPrompt('Stop showing product cards please'),
    ).toBe(true);
    expect(
      isDismissRecommendationsPrompt("Don't show you might also like anymore"),
    ).toBe(true);
    expect(isDismissRecommendationsPrompt('Փակիր ապրանքի քարտերը')).toBe(true);
    expect(isDismissRecommendationsPrompt('Скрой рекомендации сейчас')).toBe(
      true,
    );
  });

  it('parses serviceId from params for heuristic dismiss prompts', () => {
    expect(
      parseDismissRecommendationsFromPrompt(
        'Turn off product recommendations',
        {
          serviceId: 'svc-9',
        },
      )?.serviceId,
    ).toBe('svc-9');
  });

  it('rejects dismiss appointment without recommendations topic', () => {
    expect(isDismissRecommendationsPrompt('Dismiss my appointment')).toBe(
      false,
    );
    expect(isDismissRecommendationsPrompt('Cancel my booking')).toBe(false);
  });

  it('returns false for unrelated read prompts after imperative check', () => {
    expect(isDismissRecommendationsPrompt('Why am I seeing shampoo?')).toBe(
      false,
    );
  });

  it('does not rescue unrelated prompts', () => {
    expect(
      rescueDismissRecommendationsIntent('Why shampoo?', 'unknown'),
    ).toBeNull();
  });

  it('leaves params unchanged when prompt does not parse', () => {
    const params = { serviceName: 'Haircut' };
    expect(
      enrichDismissRecommendationsParamsFromPrompt(
        params,
        'Why these products?',
      ),
    ).toBe(params);
  });

  it('enriches params from prompt', () => {
    expect(
      enrichDismissRecommendationsParamsFromPrompt(
        {},
        'Hide recommendations for booking bk-abc123',
      ).bookingId,
    ).toBe('bk-abc123');
  });

  it('extracts bookingId from for-booking phrasing', () => {
    expect(
      parseDismissRecommendationsFromPrompt(
        'Hide recommendations for booking bk-xyz789',
      )?.bookingId,
    ).toBe('bk-xyz789');
  });

  it('builds user-facing summary', () => {
    expect(buildDismissRecommendationsSummary()).toContain(
      'You might also like',
    );
  });
});
