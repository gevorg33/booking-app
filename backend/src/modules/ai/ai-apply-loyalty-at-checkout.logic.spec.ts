import { handleApplyLoyaltyAtCheckoutLogic } from './ai-apply-loyalty-at-checkout.logic.js';

describe('ai-apply-loyalty-at-checkout.logic (ai-cmd-customer-4.5.2)', () => {
  const loyaltyService = {
    getBalance: jest.fn(async () => ({
      account: { pointsBalance: 50, lifetimeEarned: 100 },
    })),
    maxRedeemablePoints: jest.fn((balance: number, amountDue: number) =>
      Math.min(balance, amountDue),
    ),
    pointsToCurrency: jest.fn((points: number) => points),
  };

  const planEntitlementsService = {
    getEntitlements: jest.fn(async () => ({
      flags: { loyalty: true },
      limits: { flags: { loyalty: true } },
    })),
  };

  const deps = {
    loyaltyService,
    planEntitlementsService,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies max redeemable points and sets session loyaltyPointsToRedeem', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Use my points on this booking',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('apply_loyalty_at_checkout');
    expect(result.details?.loyaltyPointsToRedeem).toBe(50);
    expect(result.details?.sessionContext).toEqual({
      loyaltyPointsToRedeem: 50,
    });
  });

  it('applies explicit point amount when named', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Apply 10 loyalty points to this booking',
    );

    expect(result.success).toBe(true);
    expect(result.details?.loyaltyPointsToRedeem).toBe(10);
  });

  it('requires sign-in', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      {},
      'Use my points on this booking',
    );

    expect(result.success).toBe(false);
    expect(result.details?.missing).toContain('sessionCustomerId');
  });

  it('fails when loyalty feature is disabled', async () => {
    planEntitlementsService.getEntitlements.mockResolvedValueOnce({
      flags: { loyalty: false },
    });

    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Use my points on this booking',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not enabled');
  });

  it('fails when balance is zero', async () => {
    loyaltyService.getBalance.mockResolvedValueOnce({
      account: { pointsBalance: 0, lifetimeEarned: 0 },
    });

    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Use my points on this booking',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('no loyalty points');
  });

  it('includes checkout navigate when slot context is present', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        serviceId: 'svc-1',
        startTime: '2026-07-01T10:00:00.000Z',
        employeeId: 'emp-1',
      },
      'Use my points on this booking',
    );

    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-07-01T10:00:00.000Z',
        employeeId: 'emp-1',
        loyaltyPointsToRedeem: '50',
      },
    });
  });

  it('uses orderAmount and servicePrice when provided', async () => {
    loyaltyService.getBalance.mockResolvedValueOnce({
      account: { pointsBalance: 100, lifetimeEarned: 100 },
    });

    const byOrderAmount = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', orderAmount: 30 },
      'Apply 10 loyalty points to this booking',
    );
    expect(byOrderAmount.details?.loyaltyPointsToRedeem).toBe(10);

    const byServicePrice = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', servicePrice: 25 },
      'Use my points on this booking',
    );
    expect(byServicePrice.details?.loyaltyPointsToRedeem).toBe(25);
  });

  it('returns clarify for non-apply prompts', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'How do promo codes work?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when requested points cannot cover checkout amount', async () => {
    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1', orderAmount: 0.001 },
      'Use my points on this booking',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No loyalty points can be applied');
  });

  it('handles loyalty service errors', async () => {
    loyaltyService.getBalance.mockRejectedValueOnce(new Error('Service down'));

    const result = await handleApplyLoyaltyAtCheckoutLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Use my points on this booking',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Service down');
  });
});
