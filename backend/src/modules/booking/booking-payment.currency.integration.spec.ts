import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { SUPPORTED_BUSINESS_CURRENCIES } from '../../common/utils/business-currency.util.js';
import * as subscriptionCheckoutUtil from '../../common/utils/subscription-checkout.util.js';

describe('Sprint 28 — booking payment currency integration', () => {
  const draftRepo = {
    save: jest.fn(async (v: unknown) => ({ id: 'draft-1', ...(v as object) })),
    create: jest.fn((v: unknown) => v),
  };
  const serviceRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const stripeSessionsCreate = jest.fn();
  const stripeService = {
    isConfigured: false,
    frontendUrl: 'https://app.test',
    client: {
      checkout: { sessions: { create: stripeSessionsCreate } },
    },
    connectCheckoutSessionCreate: jest.fn(
      (_accountId: string, params: unknown) => [
        params,
        { stripeAccount: 'acct_1' },
      ],
    ),
  };
  const stripeIntegrationService = {
    assertCanAcceptOnlinePayments: jest.fn().mockResolvedValue('acct_1'),
  };
  const checkoutPricingService = { calculate: jest.fn() };
  const subscriptionsService = { getPlanCheckoutDetails: jest.fn() };
  const packagesService = { previewPackagePricing: jest.fn() };
  const multiServiceBookingsService = { previewTotals: jest.fn() };
  const giftCardPurchaseService = { quotePurchase: jest.fn() };

  const service = new BookingPaymentService(
    draftRepo as never,
    serviceRepo as never,
    businessRepo as never,
    stripeService as never,
    stripeIntegrationService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    checkoutPricingService as never,
    subscriptionsService as never,
    packagesService as never,
    multiServiceBookingsService as never,
    giftCardPurchaseService as never,
    {} as never,
  );

  const prepaymentService = {
    id: 'svc-1',
    name: 'Massage',
    price: 100,
    currency: null as string | null,
    prepaymentMode: PrepaymentMode.FULL,
    isActive: true,
  };

  const baseDto = {
    serviceId: 'svc-1',
    startTime: new Date().toISOString(),
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService.isConfigured = false;
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      settings: { currency: 'AMD' },
    });
    serviceRepo.findOne.mockResolvedValue(prepaymentService);
    checkoutPricingService.calculate.mockResolvedValue({
      amountDue: 100,
      currency: 'AMD',
    });
  });

  it.each([
    {
      id: 'service-eur-preserved',
      serviceCurrency: 'EUR',
      businessCurrency: 'AMD',
      resolved: 'EUR',
    },
    {
      id: 'missing-service-fallback',
      serviceCurrency: null,
      businessCurrency: 'AMD',
      resolved: 'AMD',
    },
    {
      id: 'invalid-service-fallback',
      serviceCurrency: 'NOTREAL',
      businessCurrency: 'GEL',
      resolved: 'GEL',
    },
  ])(
    'resolveCheckoutPricing currency for $id',
    async ({ serviceCurrency, businessCurrency, resolved }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { currency: businessCurrency },
      });

      await service.resolveCheckoutPricing(
        'biz-1',
        {
          id: 'svc-1',
          name: 'Massage',
          price: 100,
          currency: serviceCurrency,
          prepaymentMode: PrepaymentMode.FULL,
        } as never,
        baseDto,
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ currency: resolved }),
      );
    },
  );

  it.each([
    { id: 'package-amd', previewCurrency: 'AMD', stripeCode: 'amd' },
    { id: 'package-eur', previewCurrency: 'EUR', stripeCode: 'eur' },
  ])(
    'package checkout session uses preview currency ($id)',
    async ({ previewCurrency, stripeCode }) => {
      stripeService.isConfigured = true;
      packagesService.previewPackagePricing.mockResolvedValue({
        package: { id: 'pkg-1', name: 'Bundle' },
        pricing: { packagePrice: 200 },
        currency: previewCurrency,
      });
      checkoutPricingService.calculate.mockResolvedValue({ amountDue: 200 });
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_pkg',
        url: 'https://stripe.test/pkg',
      });

      const result = await service.createPackageCheckoutSession('salon', {
        packageId: 'pkg-1',
        lines: [
          {
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: new Date().toISOString(),
          },
        ],
        customer: { name: 'Jane', email: 'jane@test.com' },
      });

      expect(result.currency).toBe(previewCurrency);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ currency: stripeCode }),
            }),
          ],
        }),
        expect.any(Object),
      );
      stripeService.isConfigured = false;
    },
  );

  it.each([
    { id: 'multi-amd', previewCurrency: 'AMD', stripeCode: 'amd' },
    { id: 'multi-eur', previewCurrency: 'EUR', stripeCode: 'eur' },
  ])(
    'multi-service checkout session uses preview currency ($id)',
    async ({ previewCurrency, stripeCode }) => {
      stripeService.isConfigured = true;
      multiServiceBookingsService.previewTotals.mockResolvedValue({
        valid: true,
        services: [
          { serviceId: 'svc-1', name: 'Cut', price: 50 },
          { serviceId: 'svc-2', name: 'Color', price: 80 },
        ],
        totals: {
          totalPrice: 130,
          currency: previewCurrency,
          blockDurationMinutes: 90,
          serviceCount: 2,
        },
      });
      checkoutPricingService.calculate.mockResolvedValue({ amountDue: 130 });
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_multi',
        url: 'https://stripe.test/multi',
      });

      const result = await service.createMultiServiceCheckoutSession('salon', {
        serviceIds: ['svc-1', 'svc-2'],
        customer: { name: 'Jane', email: 'jane@test.com' },
      });

      expect(result.currency).toBe(previewCurrency);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ currency: stripeCode }),
            }),
          ],
        }),
        expect.any(Object),
      );
      stripeService.isConfigured = false;
    },
  );

  it.each([
    {
      id: 'service-amd-fallback',
      serviceCurrency: null,
      businessCurrency: 'AMD',
      resolved: 'AMD',
      stripeCode: 'amd',
    },
    {
      id: 'service-eur-preserved',
      serviceCurrency: 'EUR',
      businessCurrency: 'AMD',
      resolved: 'EUR',
      stripeCode: 'eur',
    },
    {
      id: 'service-gel-fallback',
      serviceCurrency: 'NOTREAL',
      businessCurrency: 'GEL',
      resolved: 'GEL',
      stripeCode: 'gel',
    },
  ])(
    'single-service Stripe checkout uses resolved currency ($id)',
    async ({ serviceCurrency, businessCurrency, resolved, stripeCode }) => {
      stripeService.isConfigured = true;
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: { currency: businessCurrency },
      });
      serviceRepo.findOne.mockResolvedValue({
        ...prepaymentService,
        currency: serviceCurrency,
      });
      checkoutPricingService.calculate.mockResolvedValue({
        amountDue: 100,
        currency: resolved,
      });
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_svc',
        url: 'https://stripe.test/svc',
      });

      const result = await service.createCheckoutSession('salon', baseDto);

      expect(result.currency).toBe(resolved);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ currency: stripeCode }),
            }),
          ],
        }),
        expect.any(Object),
      );
      stripeService.isConfigured = false;
    },
  );

  it.each([
    { id: 'gift-card-amd', quoteCurrency: 'AMD', stripeCode: 'amd' },
    { id: 'gift-card-usd', quoteCurrency: 'USD', stripeCode: 'usd' },
  ])(
    'gift card Stripe checkout uses quote currency ($id)',
    async ({ quoteCurrency, stripeCode }) => {
      stripeService.isConfigured = true;
      giftCardPurchaseService.quotePurchase.mockResolvedValue({
        cardType: 'monetary',
        subtotal: 50,
        shippingFee: 0,
        total: 50,
        currency: quoteCurrency,
        label: 'Gift card',
      });
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_gc',
        url: 'https://stripe.test/gc',
      });

      await service.createGiftCardCheckoutSession('salon', {
        cardType: 'monetary',
        amount: 50,
        deliveryMethod: 'digital',
        purchaserEmail: 'buyer@test.com',
      });

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ currency: stripeCode }),
            }),
          ],
        }),
        expect.any(Object),
      );
      stripeService.isConfigured = false;
    },
  );

  it.each(SUPPORTED_BUSINESS_CURRENCIES.map((code) => ({ code })))(
    'single-service Stripe checkout supports business currency $code',
    async ({ code }) => {
      stripeService.isConfigured = true;
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: { currency: code },
      });
      serviceRepo.findOne.mockResolvedValue({
        ...prepaymentService,
        currency: null,
      });
      checkoutPricingService.calculate.mockResolvedValue({
        amountDue: 100,
        currency: code,
      });
      stripeSessionsCreate.mockResolvedValue({
        id: `sess_${code}`,
        url: `https://stripe.test/${code}`,
      });

      const result = await service.createCheckoutSession('salon', baseDto);

      expect(result.currency).toBe(code);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: code.toLowerCase(),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
      stripeService.isConfigured = false;
    },
  );

  it('subscription checkout uses plan currency in Stripe session', async () => {
    stripeService.isConfigured = true;
    jest
      .spyOn(subscriptionCheckoutUtil, 'resolvePublicCheckoutKind')
      .mockReturnValue('subscription_purchase');
    subscriptionsService.getPlanCheckoutDetails.mockResolvedValue({
      planName: 'Monthly glow',
      amount: 89,
      currency: 'EUR',
      includedAppointments: 4,
      durationMonths: 1,
    });
    checkoutPricingService.calculate.mockResolvedValue({ amountDue: 89 });
    stripeSessionsCreate.mockResolvedValue({
      id: 'sess_sub',
      url: 'https://stripe.test/sub',
    });

    const result = await service.createCheckoutSession('salon', {
      ...baseDto,
      purchasePlanId: 'plan-1',
    });

    expect(result.currency).toBe('EUR');
    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ currency: 'eur' }),
          }),
        ],
      }),
      expect.any(Object),
    );
    stripeService.isConfigured = false;
    jest.restoreAllMocks();
  });

  it('gift card shipping line item uses the same Stripe currency code', async () => {
    stripeService.isConfigured = true;
    giftCardPurchaseService.quotePurchase.mockResolvedValue({
      cardType: 'monetary',
      subtotal: 50,
      shippingFee: 8,
      total: 58,
      currency: 'EUR',
      label: 'Gift card',
    });
    stripeSessionsCreate.mockResolvedValue({
      id: 'sess_gc_ship',
      url: 'https://stripe.test/gc-ship',
    });

    await service.createGiftCardCheckoutSession('salon', {
      cardType: 'monetary',
      amount: 50,
      deliveryMethod: 'physical',
      purchaserEmail: 'buyer@test.com',
    });

    const [[sessionParams]] = stripeSessionsCreate.mock.calls;
    expect(sessionParams.line_items).toHaveLength(2);
    for (const item of sessionParams.line_items) {
      expect(item.price_data.currency).toBe('eur');
    }
    stripeService.isConfigured = false;
  });

  it('persists resolved currency on checkout draft', async () => {
    stripeService.isConfigured = true;
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      settings: { currency: 'RUB' },
    });
    serviceRepo.findOne.mockResolvedValue({
      ...prepaymentService,
      currency: null,
    });
    checkoutPricingService.calculate.mockResolvedValue({
      amountDue: 2500,
      currency: 'RUB',
    });
    stripeSessionsCreate.mockResolvedValue({
      id: 'sess_rub',
      url: 'https://stripe.test/rub',
    });

    await service.createCheckoutSession('salon', baseDto);

    expect(draftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'RUB' }),
    );
    stripeService.isConfigured = false;
  });
});
