import { EventType } from '../../events/event-types.js';
import { EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS } from './ai-recommendation-analytics.fixtures.js';
import {
  aggregateProductRecommendationAnalyticsEvents,
  isExplainRecommendationAnalyticsPrompt,
  parseExplainRecommendationAnalyticsFromPrompt,
  rescueExplainRecommendationAnalyticsIntent,
} from './ai-recommendation-analytics.util.js';
import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';

describe('ai-recommendation-analytics.util (ai-cmd-rec-8)', () => {
  it.each(EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS)(
    'detects recommendation analytics prompt $id',
    ({ prompt, aspect }) => {
      expect(isExplainRecommendationAnalyticsPrompt(prompt)).toBe(true);
      expect(
        parseExplainRecommendationAnalyticsFromPrompt(prompt)?.aspect,
      ).toBe(aspect);
      expect(
        rescueExplainRecommendationAnalyticsIntent(prompt, 'unknown'),
      ).toEqual({
        action: 'explain_recommendation_analytics',
        rescueReason: 'explain_recommendation_analytics',
      });
    },
  );

  it('aggregates shown and clicked events by product and surface', () => {
    const summary = aggregateProductRecommendationAnalyticsEvents([
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: {
          productId: 'prod-1',
          surface: 'web_checkout',
        },
      },
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: {
          productId: 'prod-1',
          surface: 'consumer_app',
        },
      },
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
        payload: {
          productId: 'prod-2',
          surface: 'web_checkout',
        },
      },
    ]);

    expect(summary.totalImpressions).toBe(2);
    expect(summary.totalClicks).toBe(1);
    expect(summary.bySurface).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: 'web_checkout',
          impressions: 1,
          clicks: 1,
        }),
        expect.objectContaining({
          surface: 'consumer_app',
          impressions: 1,
          clicks: 0,
        }),
      ]),
    );
    expect(summary.topProductsByImpressions[0]?.productId).toBe('prod-1');
    expect(summary.topProductsByClicks[0]?.productId).toBe('prod-2');
  });

  it('does not steal recommendation setup explain prompts', () => {
    const prompt =
      'Which products are linked for post-checkout recommendations?';
    expect(isExplainRecommendationAnalyticsPrompt(prompt)).toBe(false);
    expect(isExplainRecommendationSetupPrompt(prompt)).toBe(true);
  });

  it('does not rescue when action is already explain_recommendation_analytics', () => {
    expect(
      rescueExplainRecommendationAnalyticsIntent(
        'Explain recommendation analytics',
        'explain_recommendation_analytics',
      ),
    ).toBeNull();
  });
});
