import { EventType } from '../../events/event-types.js';
import { handleExplainRecommendationAnalyticsLogic } from './ai-recommendation-analytics.logic.js';

describe('ai-recommendation-analytics.logic (ai-cmd-rec-8)', () => {
  const business = { id: 'biz-1', settings: {} };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    eventStore: {
      getEvents: jest.fn(async () => [
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
          payload: {
            productId: 'prod-shampoo',
            surface: 'web_checkout',
          },
        },
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
          payload: {
            productId: 'prod-shampoo',
            surface: 'consumer_app',
          },
        },
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
          payload: {
            productId: 'prod-mask',
            surface: 'web_checkout',
          },
        },
      ]),
    },
    inventoryService: {
      listProducts: jest.fn(async () => [
        { id: 'prod-shampoo', name: 'Shampoo' },
        { id: 'prod-mask', name: 'Repair Mask' },
      ]),
    },
  });

  it('explains impression and click totals with surfaces', async () => {
    const result = await handleExplainRecommendationAnalyticsLogic(
      deps() as any,
      'biz-1',
      { aspect: 'all' },
      'Show product_recommendation.shown and clicked counts',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_recommendation_analytics');
    expect(result.summary).toContain('product_recommendation.shown');
    expect(result.summary).toContain('product_recommendation.clicked');
    expect(result.summary).toContain('public web checkout');
    expect(result.summary).toContain('consumer app');
    expect(result.details?.totalImpressions).toBe(2);
    expect(result.details?.totalClicks).toBe(1);
  });

  it('explains top products aspect', async () => {
    const result = await handleExplainRecommendationAnalyticsLogic(
      deps() as any,
      'biz-1',
      { aspect: 'topProducts' },
      'What are the top recommended products by clicks?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Shampoo');
    expect(result.summary).toContain('Repair Mask');
  });

  it('clarifies when prompt does not match', async () => {
    const result = await handleExplainRecommendationAnalyticsLogic(
      deps() as any,
      'biz-1',
      {},
      'Which products are linked for post-checkout recommendations?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
