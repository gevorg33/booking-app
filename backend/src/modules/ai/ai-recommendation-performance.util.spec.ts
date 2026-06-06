import { EventType } from '../../events/event-types.js';
import { SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS } from './ai-recommendation-performance.fixtures.js';
import {
  aggregateRecommendationPerformanceEvents,
  computeCtr,
  isSummarizeRecommendationPerformancePrompt,
  parseSummarizeRecommendationPerformanceFromPrompt,
  rescueSummarizeRecommendationPerformanceIntent,
} from './ai-recommendation-performance.util.js';
import { isExplainRecommendationAnalyticsPrompt } from './ai-recommendation-analytics.util.js';

describe('ai-recommendation-performance.util (ai-cmd-rec-9)', () => {
  it.each(SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS)(
    'detects recommendation performance prompt $id',
    ({ prompt, aspect }) => {
      expect(isSummarizeRecommendationPerformancePrompt(prompt)).toBe(true);
      expect(parseSummarizeRecommendationPerformanceFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
      expect(
        rescueSummarizeRecommendationPerformanceIntent(prompt, 'unknown'),
      ).toEqual({
        action: 'summarize_recommendation_performance',
        rescueReason: 'summarize_recommendation_performance',
      });
    },
  );

  it('aggregates CTR by product, service, and bookings with recommendations shown', () => {
    const summary = aggregateRecommendationPerformanceEvents([
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: {
          productId: 'prod-1',
          serviceId: 'svc-1',
          bookingId: 'bk-1',
          surface: 'web_checkout',
        },
      },
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: {
          productId: 'prod-1',
          serviceId: 'svc-1',
          bookingId: 'bk-1',
          surface: 'web_checkout',
        },
      },
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
        payload: {
          productId: 'prod-2',
          serviceId: 'svc-2',
          bookingId: 'bk-2',
          surface: 'consumer_app',
        },
      },
      {
        eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
        payload: {
          productId: 'prod-1',
          serviceId: 'svc-1',
          surface: 'web_checkout',
        },
      },
    ]);

    expect(summary.totalImpressions).toBe(3);
    expect(summary.totalClicks).toBe(1);
    expect(summary.overallCtr).toBeCloseTo(computeCtr(1, 3));
    expect(summary.bookingsWithRecommendationsShown).toBe(2);
    expect(summary.byProduct).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'prod-1', ctr: 50 }),
        expect.objectContaining({ productId: 'prod-2', ctr: 0 }),
      ]),
    );
    expect(summary.byService).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ serviceId: 'svc-1', ctr: 50 }),
        expect.objectContaining({ serviceId: 'svc-2', ctr: 0 }),
      ]),
    );
  });

  it('does not steal raw analytics impression-count prompts', () => {
    const prompt = 'How many checkout recommendation impressions do we have?';
    expect(isSummarizeRecommendationPerformancePrompt(prompt)).toBe(false);
    expect(isExplainRecommendationAnalyticsPrompt(prompt)).toBe(true);
  });

  it('does not rescue when action is already summarize_recommendation_performance', () => {
    expect(
      rescueSummarizeRecommendationPerformanceIntent(
        'Summarize recommendation performance',
        'summarize_recommendation_performance',
      ),
    ).toBeNull();
  });
});
