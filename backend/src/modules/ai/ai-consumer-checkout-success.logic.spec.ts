import { handleExplainConsumerCheckoutSuccessLogic } from './ai-consumer-checkout-success.logic.js';

describe('ai-consumer-checkout-success.logic (ai-cmd-rec-6)', () => {
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

  const booking = {
    id: 'bk-1',
    businessId: 'biz-1',
    serviceId: 'svc-haircut',
    startTime: new Date('2026-08-15T10:00:00.000Z'),
    endTime: new Date('2026-08-15T11:00:00.000Z'),
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => business),
    },
    serviceRepo: {
      findOne: jest.fn(async () => haircutService),
      find: jest.fn(async () => [haircutService]),
    },
    bookingRepo: {
      findOne: jest.fn(async () => booking),
    },
    productRecommendationService: {
      getCheckoutRecommendations: jest.fn(async () => [
        { id: 'prod-1', name: 'Shampoo', price: 18 },
      ]),
    },
  });

  it('explains summary aspect with booking context', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      { bookingId: 'bk-1', aspect: 'summary' },
      'What is shown on the booking confirmed screen in the salon app?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_consumer_checkout_success');
    expect(result.summary).toContain('Booking confirmed!');
    expect(result.summary).toContain('Haircut');
  });

  it('explains actions aspect', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      { aspect: 'actions' },
      'What does View appointments do on the booking success screen in the app?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('View appointments');
    expect(result.summary).toContain('Book another service');
  });

  it('explains recommendations visibility aspect', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      { serviceId: 'svc-haircut', aspect: 'recommendations' },
      'When do product cards appear on checkout success in the consumer app?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('You might also like');
    expect(result.details?.recommendationsVisible).toBe(true);
  });

  it('explains dismiss aspect', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      { aspect: 'dismiss' },
      'What does Dismiss recommendations do on the app success screen?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Dismiss recommendations');
    expect(result.summary).toContain('does not cancel');
  });

  it('clarifies when prompt does not match', async () => {
    const result = await handleExplainConsumerCheckoutSuccessLogic(
      deps() as any,
      'biz-1',
      {},
      'What products show up after I confirm my booking in the consumer app?',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
