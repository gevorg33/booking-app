import { handleExplainMultiServiceCartLogic } from './ai-explain-multi-service-cart.logic.js';

describe('ai-explain-multi-service-cart.logic (ai-cmd-customer-4.6.1)', () => {
  const serviceRepo = {
    find: jest.fn(async () => [
      {
        id: 'svc-1',
        name: 'Swedish Massage',
        durationMinutes: 60,
        bufferMinutes: 0,
        price: 90,
        isActive: true,
      },
      {
        id: 'svc-2',
        name: 'Facial',
        durationMinutes: 45,
        bufferMinutes: 5,
        price: 70,
        isActive: true,
      },
    ]),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
  };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({ turnoverBufferMinutes: 10 })),
  };

  const deps = {
    serviceRepo,
    businessRepo,
    multiServiceBookingsService,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains cart line items and total duration', async () => {
    const result = await handleExplainMultiServiceCartLogic(
      deps,
      'biz-1',
      { cartServiceIds: ['svc-1', 'svc-2'] },
      "What's in my cart?",
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_multi_service_cart');
    expect(result.summary).toContain('Swedish Massage');
    expect(result.summary).toContain('Facial');
    expect(result.details?.totalMinutes).toBe(120);
    expect(result.details?.serviceCount).toBe(2);
  });

  it('returns empty-cart guidance', async () => {
    const result = await handleExplainMultiServiceCartLogic(
      deps,
      'biz-1',
      { cartServiceIds: [] },
      'How long is my spa day?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('empty');
  });

  it('returns clarify for non-explain prompts', async () => {
    const result = await handleExplainMultiServiceCartLogic(
      deps,
      'biz-1',
      { cartServiceIds: ['svc-1'] },
      'Add massage to cart',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('focuses duration copy for spa-day prompts', async () => {
    const result = await handleExplainMultiServiceCartLogic(
      deps,
      'biz-1',
      { cartServiceIds: ['svc-1', 'svc-2'] },
      'How long is my spa day?',
    );

    expect(result.success).toBe(true);
    expect(result.details?.focus).toBe('duration');
    expect(result.summary).toContain('minutes');
  });

  it('uses default turnover buffer when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);

    const result = await handleExplainMultiServiceCartLogic(
      deps,
      'biz-1',
      { cartServiceIds: ['svc-1', 'svc-2'], _prompt: "What's in my cart?" },
      '',
    );

    expect(result.success).toBe(true);
    expect(result.details?.turnoverBufferMinutes).toBe(5);
    expect(
      multiServiceBookingsService.resolveSettingsFromBusiness,
    ).not.toHaveBeenCalled();
  });
});
