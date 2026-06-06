import { handleExplainCheckoutRecommendationsLogic } from './ai-checkout-recommendations.logic.js';

describe('ai-checkout-recommendations.logic (ai-cmd-rec-5)', () => {
  const business = {
    id: 'biz-1',
    settings: { publicBooking: { recommendations: { maxProductCount: 2 } } },
  };

  const haircutService = {
    id: 'svc-haircut',
    businessId: 'biz-1',
    name: 'Haircut',
    categoryId: 'cat-hair',
    isActive: true,
    category: { id: 'cat-hair', name: 'Hair' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    serviceRepo: {
      findOne: jest.fn(async ({ where }: { where: { id?: string } }) =>
        where.id === 'svc-haircut' ? haircutService : null,
      ),
      find: jest.fn(async () => [haircutService]),
    },
    bookingRepo: {
      findOne: jest.fn(async ({ where }: { where: { id?: string } }) =>
        where.id === 'bk-1'
          ? { id: 'bk-1', businessId: 'biz-1', serviceId: 'svc-haircut' }
          : null,
      ),
    },
    productRecommendationService: {
      getCheckoutRecommendations: jest.fn(async () => [
        {
          id: 'prod-1',
          name: 'Repair Mask',
          price: 28,
          externalLink: 'https://shop.test/mask',
        },
      ]),
    },
  });

  it('explains products shown on checkout success using booking context', async () => {
    const result = await handleExplainCheckoutRecommendationsLogic(
      deps() as any,
      'biz-1',
      { bookingId: 'bk-1', aspect: 'products' },
      'What products show up after I confirm my booking?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_checkout_recommendations');
    expect(result.summary).toContain('Repair Mask');
    expect(result.details?.source).toBe('service');
  });

  it('explains shop links on recommendation cards', async () => {
    const result = await handleExplainCheckoutRecommendationsLogic(
      deps() as any,
      'biz-1',
      { serviceId: 'svc-haircut', aspect: 'shopLink' },
      'What does the shop link do on these product cards?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/shop links?/i);
  });

  it('clarifies when booked service cannot be resolved', async () => {
    const result = await handleExplainCheckoutRecommendationsLogic(
      deps() as any,
      'biz-1',
      {},
      'What are these You might also like products on the confirmation screen?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
