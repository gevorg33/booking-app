import { handleApplyPromoCodeCheckoutLogic } from './ai-apply-promo-code-checkout.logic.js';

describe('ai-apply-promo-code-checkout.logic (ai-cmd-customer-4.2.5)', () => {
  const promoCodesService = {
    findValidForCheckout: jest.fn(async () => ({
      code: 'SAVE10',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: null,
      expiresAt: null,
    })),
  };

  const planEntitlementsService = {
    getEntitlements: jest.fn(async () => ({
      flags: { promoCodes: true },
      limits: { flags: { promoCodes: true } },
    })),
  };

  const deps = {
    promoCodesService,
    planEntitlementsService,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies valid promo and sets session promoCode', async () => {
    const result = await handleApplyPromoCodeCheckoutLogic(
      deps,
      'biz-1',
      {},
      'Apply code SAVE10 at checkout',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('apply_promo_code_checkout');
    expect(result.details?.promoCode).toBe('SAVE10');
    expect(result.details?.sessionContext).toEqual({ promoCode: 'SAVE10' });
    expect(promoCodesService.findValidForCheckout).toHaveBeenCalledWith(
      'biz-1',
      'SAVE10',
      100,
    );
  });

  it('returns clarify when promo code is missing', async () => {
    const result = await handleApplyPromoCodeCheckoutLogic(
      deps,
      'biz-1',
      {},
      'Apply code at checkout',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toContain('promoCode');
  });

  it('fails when promo codes feature is disabled', async () => {
    planEntitlementsService.getEntitlements.mockResolvedValueOnce({
      flags: { promoCodes: false },
    });

    const result = await handleApplyPromoCodeCheckoutLogic(
      deps,
      'biz-1',
      { promoCode: 'SAVE10' },
      'Apply code SAVE10 at checkout',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not enabled');
  });

  it('fails when validation rejects the code', async () => {
    promoCodesService.findValidForCheckout.mockRejectedValueOnce(
      new Error('Invalid promo code'),
    );

    const result = await handleApplyPromoCodeCheckoutLogic(
      deps,
      'biz-1',
      { promoCode: 'BAD' },
      'Apply code BAD at checkout',
    );

    expect(result.success).toBe(false);
    expect(result.details?.validated).toBe(false);
    expect(result.summary).toContain('BAD');
  });

  it('includes checkout navigate when slot context is present', async () => {
    const result = await handleApplyPromoCodeCheckoutLogic(deps, 'biz-1', {
      promoCode: 'SAVE10',
      serviceId: 'svc-1',
      startTime: '2026-07-01T10:00:00.000Z',
      employeeId: 'emp-1',
    });

    expect(result.details?.navigate).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-07-01T10:00:00.000Z',
        employeeId: 'emp-1',
        promoCode: 'SAVE10',
      },
    });
  });
});
