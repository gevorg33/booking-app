import { BadRequestException } from '@nestjs/common';
import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { CheckoutPricingResult } from '../promo-codes/checkout-pricing.types.js';

describe('Sprint 36 — booking payment Stripe tax integration', () => {
  const draftRepo = {
    save: jest.fn(async (value: unknown) => ({
      id: 'draft-1',
      ...(value as object),
    })),
    create: jest.fn((value: unknown) => value),
    findOne: jest.fn(),
  };
  const serviceRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const stripeSessionsCreate = jest.fn().mockResolvedValue({
    id: 'sess_tax_1',
    url: 'https://stripe.test/pay',
  });
  const stripeService = {
    isConfigured: true,
    frontendUrl: 'https://app.test',
    client: { checkout: { sessions: { create: stripeSessionsCreate } } },
    connectRequestOptions: jest
      .fn()
      .mockReturnValue({ stripeAccount: 'acct_1' }),
    usesDestinationCharges: jest.fn().mockReturnValue(false),
    connectCheckoutSessionCreate: jest.fn(
      (
        _accountId: string,
        params: Record<string, unknown>,
        _settings?: unknown,
        amountCents?: number,
        paymentIntentMetadata?: Record<string, string>,
      ) => [
        {
          ...params,
          payment_intent_data: {
            ...(params.payment_intent_data as object),
            metadata: paymentIntentMetadata,
          },
        },
        { stripeAccount: 'acct_1' },
      ],
    ),
  };
  const stripeIntegrationService = {
    assertCanAcceptOnlinePayments: jest.fn().mockResolvedValue('acct_1'),
    resolveConnectAccountId: jest.fn(),
  };
  const checkoutPricingService = { calculate: jest.fn() };
  const packagesService = {
    previewPackagePricing: jest.fn().mockResolvedValue({
      package: { id: 'pkg-1', name: 'Glow Package' },
      pricing: { packagePrice: 200 },
      currency: 'USD',
    }),
  };
  const multiServiceBookingsService = {
    previewTotals: jest.fn().mockResolvedValue({
      valid: true,
      services: [
        { serviceId: 'svc-1', name: 'Cut', price: 50 },
        { serviceId: 'svc-2', name: 'Color', price: 80 },
      ],
      totals: {
        totalPrice: 130,
        currency: 'USD',
        blockDurationMinutes: 90,
        serviceCount: 2,
      },
    }),
  };

  const service = new BookingPaymentService(
    draftRepo as never,
    serviceRepo as never,
    businessRepo as never,
    stripeService as never,
    stripeIntegrationService as never,
    {} as never,
    {} as never,
    { publish: jest.fn() } as never,
    { createBooking: jest.fn() } as never,
    checkoutPricingService as never,
    { getPlanCheckoutDetails: jest.fn() } as never,
    packagesService as never,
    multiServiceBookingsService as never,
    { quotePurchase: jest.fn() } as never,
    {} as never,
  );

  const baseService = {
    id: 'svc-1',
    name: 'Massage',
    price: 100,
    currency: 'USD',
    prepaymentMode: PrepaymentMode.FULL,
    metadata: {},
  };

  const baseDto = {
    serviceId: 'svc-1',
    startTime: new Date().toISOString(),
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  const taxPricing = (
    overrides: Partial<CheckoutPricingResult>,
  ): CheckoutPricingResult => ({
    servicePrice: 100,
    subtotal: 100,
    afterPromo: 100,
    afterGiftCard: 100,
    promoDiscount: 0,
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    totalDiscount: 0,
    amountDue: 120,
    currency: 'USD',
    loyaltyPointsToRedeem: 0,
    loyaltyPointsBalance: 0,
    pointsToEarn: 0,
    adjustments: [],
    taxEnabled: true,
    taxName: 'VAT',
    taxRate: 20,
    taxModel: 'exclusive',
    taxAmount: 20,
    netAmount: 100,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      settings: {
        tax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' },
      },
    });
    serviceRepo.findOne.mockResolvedValue(baseService);
  });

  it.each([
    {
      id: 'exclusive-net-plus-tax',
      pricing: taxPricing({ amountDue: 120, taxModel: 'exclusive' }),
      expectedCents: 12000,
      expectedTaxModel: 'exclusive',
    },
    {
      id: 'inclusive-gross-price',
      pricing: taxPricing({
        amountDue: 120,
        taxModel: 'inclusive',
        taxAmount: 20,
        netAmount: 100,
      }),
      expectedCents: 12000,
      expectedTaxModel: 'inclusive',
    },
    {
      id: 'stacked-exclusive',
      pricing: taxPricing({
        amountDue: 113,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 13,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      }),
      expectedCents: 11300,
      expectedTaxModel: 'exclusive',
    },
  ])(
    'createCheckoutSession passes tax-aware amount for $id',
    async ({ pricing, expectedCents, expectedTaxModel }) => {
      checkoutPricingService.calculate.mockResolvedValue(pricing);

      const result = await service.createCheckoutSession('salon', baseDto);

      expect(result.amount).toBe(pricing.amountDue);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: expectedCents,
              }),
            }),
          ],
          metadata: expect.objectContaining({
            taxEnabled: 'true',
            chargeAmountCents: String(expectedCents),
            taxAmount: String(pricing.taxAmount),
            taxModel: expectedTaxModel,
          }),
          payment_intent_data: expect.objectContaining({
            metadata: expect.objectContaining({
              taxEnabled: 'true',
              chargeAmountCents: String(expectedCents),
            }),
          }),
        }),
        expect.any(Object),
      );
      expect(stripeService.connectCheckoutSessionCreate).toHaveBeenCalledWith(
        'acct_1',
        expect.any(Object),
        expect.any(Object),
        expectedCents,
        expect.objectContaining({
          taxEnabled: 'true',
          chargeAmountCents: String(expectedCents),
        }),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: pricing.amountDue,
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              checkoutPricing: pricing,
            }),
          }),
        }),
      );
    },
  );

  it('resolveFulfillmentCheckoutPricing prefers frozen Stripe draft pricing', () => {
    const recalculated = taxPricing({
      amountDue: 100,
      taxAmount: 0,
      taxEnabled: false,
    });
    const frozen = taxPricing({ amountDue: 120 });

    expect(
      service.resolveFulfillmentCheckoutPricing(recalculated, frozen),
    ).toBe(frozen);
  });

  it('throws when tax-aware amount due is zero', async () => {
    checkoutPricingService.calculate.mockResolvedValue(
      taxPricing({ amountDue: 0, taxEnabled: false, taxAmount: 0 }),
    );

    await expect(
      service.createCheckoutSession('salon', baseDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes tax-disabled metadata when no tax is due on single-service checkout', async () => {
    checkoutPricingService.calculate.mockResolvedValue(
      taxPricing({ amountDue: 100, taxEnabled: false, taxAmount: 0 }),
    );

    await service.createCheckoutSession('salon', baseDto);

    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 10000 }),
          }),
        ],
        metadata: expect.objectContaining({
          taxEnabled: 'false',
          chargeAmountCents: '10000',
        }),
      }),
      expect.any(Object),
    );
  });

  it('charges promo-after-tax amount on single-service checkout', async () => {
    checkoutPricingService.calculate.mockResolvedValue(
      taxPricing({
        subtotal: 100,
        amountDue: 108,
        promoDiscount: 10,
        taxAmount: 18,
        netAmount: 90,
      }),
    );

    await service.createCheckoutSession('salon', baseDto);

    expect(stripeSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 10800 }),
          }),
        ],
        metadata: expect.objectContaining({
          taxAmount: '18',
          chargeAmountCents: '10800',
        }),
      }),
      expect.any(Object),
    );
  });

  const packageDto = {
    packageId: 'pkg-1',
    lines: [
      {
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        startTime: new Date().toISOString(),
      },
    ],
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  const multiServiceDto = {
    serviceIds: ['svc-1', 'svc-2'],
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  it.each([
    {
      id: 'package-exclusive',
      pricing: taxPricing({
        servicePrice: 200,
        subtotal: 200,
        amountDue: 240,
        taxAmount: 40,
        netAmount: 200,
      }),
      expectedCents: 24000,
      checkoutKind: 'package_purchase',
    },
    {
      id: 'package-inclusive',
      pricing: taxPricing({
        servicePrice: 200,
        subtotal: 200,
        amountDue: 200,
        taxModel: 'inclusive',
        taxAmount: 18.18,
        netAmount: 181.82,
      }),
      expectedCents: 20000,
      checkoutKind: 'package_purchase',
    },
    {
      id: 'package-stacked',
      pricing: taxPricing({
        servicePrice: 200,
        subtotal: 200,
        amountDue: 226,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 26,
        netAmount: 200,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 10 },
          { id: 'pst', name: 'PST', rate: 8, amount: 16 },
        ],
      }),
      expectedCents: 22600,
      checkoutKind: 'package_purchase',
    },
  ])(
    'createPackageCheckoutSession passes tax-aware amount for $id',
    async ({ pricing, expectedCents, checkoutKind }) => {
      checkoutPricingService.calculate.mockResolvedValue(pricing);

      const result = await service.createPackageCheckoutSession(
        'salon',
        packageDto,
      );

      expect(result.amount).toBe(pricing.amountDue);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: expectedCents,
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind,
            taxEnabled: 'true',
            chargeAmountCents: String(expectedCents),
            taxAmount: String(pricing.taxAmount),
          }),
          payment_intent_data: expect.objectContaining({
            metadata: expect.objectContaining({
              taxEnabled: 'true',
              chargeAmountCents: String(expectedCents),
            }),
          }),
        }),
        expect.any(Object),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: pricing.amountDue,
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              checkoutPricing: pricing,
              checkoutKind,
            }),
          }),
        }),
      );
    },
  );

  it.each([
    {
      id: 'multi-exclusive',
      pricing: taxPricing({
        servicePrice: 130,
        subtotal: 130,
        amountDue: 156,
        taxAmount: 26,
        netAmount: 130,
      }),
      expectedCents: 15600,
    },
    {
      id: 'multi-inclusive',
      pricing: taxPricing({
        servicePrice: 130,
        subtotal: 130,
        amountDue: 130,
        taxModel: 'inclusive',
        taxAmount: 11.82,
        netAmount: 118.18,
      }),
      expectedCents: 13000,
    },
    {
      id: 'multi-stacked',
      pricing: taxPricing({
        servicePrice: 130,
        subtotal: 130,
        amountDue: 146.9,
        taxName: 'GST + PST',
        taxRate: 13,
        taxAmount: 16.9,
        netAmount: 130,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 6.5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 10.4 },
        ],
      }),
      expectedCents: 14690,
    },
  ])(
    'createMultiServiceCheckoutSession passes tax-aware amount for $id',
    async ({ pricing, expectedCents }) => {
      checkoutPricingService.calculate.mockResolvedValue(pricing);

      const result = await service.createMultiServiceCheckoutSession(
        'salon',
        multiServiceDto,
      );

      expect(result.amount).toBe(pricing.amountDue);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: expectedCents,
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind: 'multi_service_booking',
            taxEnabled: 'true',
            chargeAmountCents: String(expectedCents),
          }),
        }),
        expect.any(Object),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: pricing.amountDue,
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              checkoutPricing: pricing,
              checkoutKind: 'multi_service_booking',
            }),
          }),
        }),
      );
    },
  );

  it('throws when package checkout amount due is zero after discounts', async () => {
    checkoutPricingService.calculate.mockResolvedValue(
      taxPricing({ amountDue: 0, taxEnabled: false, taxAmount: 0 }),
    );

    await expect(
      service.createPackageCheckoutSession('salon', packageDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when multi-service checkout amount due is zero after discounts', async () => {
    checkoutPricingService.calculate.mockResolvedValue(
      taxPricing({ amountDue: 0, taxEnabled: false, taxAmount: 0 }),
    );

    await expect(
      service.createMultiServiceCheckoutSession('salon', multiServiceDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
