import {
  handleConfirmStripePaymentLogic,
  handleGetBookingQuoteLogic,
  handleGetMultiServiceQuoteLogic,
  handleGetPackageQuoteLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';

function buildDeps(
  overrides: Partial<PaymentsLogicDeps> = {},
): PaymentsLogicDeps {
  const business = { id: 'biz-1', slug: 'salon' };
  const services = [
    {
      id: 'svc-1',
      name: 'Massage',
      businessId: 'biz-1',
      isActive: true,
      price: 80,
      durationMinutes: 60,
    },
    {
      id: 'svc-2',
      name: 'Facial',
      businessId: 'biz-1',
      isActive: true,
      price: 60,
      durationMinutes: 45,
    },
  ];

  const quote = {
    servicePrice: 80,
    subtotal: 80,
    afterPromo: 72,
    afterGiftCard: 72,
    promoDiscount: 8,
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    totalDiscount: 8,
    amountDue: 72,
    currency: 'USD',
  };

  return {
    giftCardsService: {} as any,
    giftCardPurchaseService: {} as any,
    giftCardOrderService: {} as any,
    giftCardRefundService: {} as any,
    publicBookingService: {
      quoteCheckout: jest.fn(async () => quote),
      quotePackageCheckout: jest.fn(async () => quote),
      quoteMultiServiceCheckout: jest.fn(async () => quote),
      getPublicPackages: jest.fn(async () => ({
        packages: [{ id: 'pkg-1', name: 'Spa Day' }],
      })),
    } as any,
    accountingIntegrationService: {} as any,
    commissionsService: {} as any,
    subscriptionsService: {} as any,
    serviceService: {} as any,
    bookingRepo: {} as any,
    businessRepo: {
      findOne: jest.fn(async () => business),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
    } as any,
    giftCardRepo: {} as any,
    bookingPaymentService: {
      confirmCheckoutSession: jest.fn(async () => ({
        booking: { id: 'book-1' },
      })),
    } as any,
    ...overrides,
  };
}

describe('ai-payments.logic — checkout quote and confirm', () => {
  let deps: PaymentsLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  describe('handleGetBookingQuoteLogic', () => {
    it('quotes a named service with promo/loyalty params', async () => {
      const result = await handleGetBookingQuoteLogic(deps, 'biz-1', {
        serviceName: 'Massage',
        promoCode: 'SAVE10',
        loyaltyPointsToRedeem: 5,
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('get_booking_quote');
      expect(result.summary).toContain('72 USD due now');
      expect(result.summary).toContain('8 USD saved');
      expect(deps.publicBookingService.quoteCheckout).toHaveBeenCalledWith(
        'salon',
        {
          serviceId: 'svc-1',
          paxCount: undefined,
          purchasePlanId: undefined,
          promoCode: 'SAVE10',
          loyaltyPointsToRedeem: 5,
        },
        undefined,
      );
    });

    it('passes the session customer id for loyalty on the customer surface', async () => {
      await handleGetBookingQuoteLogic(deps, 'biz-1', {
        serviceName: 'Massage',
        sessionCustomerId: 'cust-1',
      });

      expect(deps.publicBookingService.quoteCheckout).toHaveBeenCalledWith(
        'salon',
        expect.any(Object),
        'cust-1',
      );
    });

    it('clarifies when no service is named', async () => {
      const result = await handleGetBookingQuoteLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails gracefully when the quote call rejects', async () => {
      (
        deps.publicBookingService.quoteCheckout as jest.Mock
      ).mockRejectedValueOnce(new Error('Invalid promo code'));
      const result = await handleGetBookingQuoteLogic(deps, 'biz-1', {
        serviceName: 'Massage',
        promoCode: 'BAD',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toBe('Invalid promo code');
      expect(result.details?.reason).toBe('quote_failed');
    });
  });

  describe('handleGetPackageQuoteLogic', () => {
    it('quotes a package resolved by name', async () => {
      const result = await handleGetPackageQuoteLogic(deps, 'biz-1', {
        packageName: 'Spa Day',
      });

      expect(result.success).toBe(true);
      expect(result.details?.packageId).toBe('pkg-1');
      expect(
        deps.publicBookingService.quotePackageCheckout,
      ).toHaveBeenCalledWith(
        'salon',
        {
          packageId: 'pkg-1',
          promoCode: undefined,
          loyaltyPointsToRedeem: undefined,
        },
        undefined,
      );
    });

    it('quotes directly via packageId', async () => {
      const result = await handleGetPackageQuoteLogic(deps, 'biz-1', {
        packageId: 'pkg-1',
      });
      expect(result.success).toBe(true);
      expect(
        deps.publicBookingService.getPublicPackages,
      ).not.toHaveBeenCalled();
    });

    it('clarifies when no package is named', async () => {
      const result = await handleGetPackageQuoteLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails when the package name cannot be resolved', async () => {
      const result = await handleGetPackageQuoteLogic(deps, 'biz-1', {
        packageName: 'Nonexistent',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('Nonexistent');
    });
  });

  describe('handleGetMultiServiceQuoteLogic', () => {
    it('quotes named services', async () => {
      const result = await handleGetMultiServiceQuoteLogic(deps, 'biz-1', {
        serviceNames: ['Massage', 'Facial'],
      });

      expect(result.success).toBe(true);
      expect(result.details?.serviceIds).toEqual(['svc-1', 'svc-2']);
      expect(
        deps.publicBookingService.quoteMultiServiceCheckout,
      ).toHaveBeenCalledWith(
        'salon',
        {
          serviceIds: ['svc-1', 'svc-2'],
          promoCode: undefined,
          loyaltyPointsToRedeem: undefined,
        },
        undefined,
      );
    });

    it('resolves cart service ids from session', async () => {
      const result = await handleGetMultiServiceQuoteLogic(deps, 'biz-1', {
        cartServiceIds: 'svc-1,svc-2',
      });
      expect(result.success).toBe(true);
    });

    it('clarifies when fewer than two services are resolved', async () => {
      const result = await handleGetMultiServiceQuoteLogic(deps, 'biz-1', {
        serviceNames: ['Massage'],
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });

  describe('handleConfirmStripePaymentLogic', () => {
    it('confirms a completed Stripe checkout session', async () => {
      const result = await handleConfirmStripePaymentLogic(deps, 'biz-1', {
        sessionId: 'cs_test_123',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('confirm_stripe_payment');
      expect(result.details?.booking).toEqual({ id: 'book-1' });
      expect(
        deps.bookingPaymentService.confirmCheckoutSession,
      ).toHaveBeenCalledWith('salon', 'cs_test_123');
    });

    it('clarifies when sessionId is missing', async () => {
      const result = await handleConfirmStripePaymentLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails gracefully when confirmation rejects', async () => {
      (
        deps.bookingPaymentService.confirmCheckoutSession as jest.Mock
      ).mockRejectedValueOnce(new Error('Payment is not complete yet'));
      const result = await handleConfirmStripePaymentLogic(deps, 'biz-1', {
        sessionId: 'cs_test_123',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toBe('Payment is not complete yet');
    });
  });
});
