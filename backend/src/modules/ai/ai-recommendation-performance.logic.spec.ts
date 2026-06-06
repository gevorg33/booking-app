import { EventType } from '../../events/event-types.js';
import { handleSummarizeRecommendationPerformanceLogic } from './ai-recommendation-performance.logic.js';

describe('ai-recommendation-performance.logic (ai-cmd-rec-9)', () => {
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
            serviceId: 'svc-haircut',
            bookingId: 'bk-1',
            surface: 'web_checkout',
          },
        },
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
          payload: {
            productId: 'prod-shampoo',
            serviceId: 'svc-haircut',
            bookingId: 'bk-2',
            surface: 'web_checkout',
          },
        },
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_CLICKED,
          payload: {
            productId: 'prod-shampoo',
            serviceId: 'svc-haircut',
            surface: 'web_checkout',
          },
        },
        {
          eventType: EventType.PRODUCT_RECOMMENDATION_SHOWN,
          payload: {
            productId: 'prod-mask',
            serviceId: 'svc-color',
            bookingId: 'bk-3',
            surface: 'consumer_app',
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
    serviceRepo: {
      find: jest.fn(async () => [
        { id: 'svc-haircut', name: 'Haircut' },
        { id: 'svc-color', name: 'Color' },
      ]),
    },
  });

  it('summarizes overall CTR and bookings with recommendations shown', async () => {
    const result = await handleSummarizeRecommendationPerformanceLogic(
      deps() as any,
      'biz-1',
      { aspect: 'all' },
      'Summarize recommendation performance',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('summarize_recommendation_performance');
    expect(result.summary).toContain('CTR');
    expect(result.summary).toContain('booking');
    expect(result.details?.bookingsWithRecommendationsShown).toBe(3);
    expect(result.details?.totalImpressions).toBe(3);
    expect(result.details?.totalClicks).toBe(1);
  });

  it('summarizes CTR by product aspect', async () => {
    const result = await handleSummarizeRecommendationPerformanceLogic(
      deps() as any,
      'biz-1',
      { aspect: 'byProduct' },
      'CTR by product for post-checkout recommendations',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Shampoo');
    expect(result.summary).toContain('Repair Mask');
  });

  it('summarizes CTR by service aspect', async () => {
    const result = await handleSummarizeRecommendationPerformanceLogic(
      deps() as any,
      'biz-1',
      { aspect: 'byService' },
      'CTR by service for checkout recommendations',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('Color');
  });

  it('clarifies when prompt does not match', async () => {
    const result = await handleSummarizeRecommendationPerformanceLogic(
      deps() as any,
      'biz-1',
      {},
      'How many checkout recommendation impressions do we have?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
