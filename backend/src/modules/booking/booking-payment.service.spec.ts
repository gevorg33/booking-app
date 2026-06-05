import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { EventType } from '../../events/event-types.js';
import * as subscriptionCheckoutUtil from '../../common/utils/subscription-checkout.util.js';

describe('BookingPaymentService', () => {
  const draftRepo = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const serviceRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const stripeSessionsCreate = jest.fn();
  const stripeSessionsRetrieve = jest.fn();
  const stripeService = {
    isConfigured: false,
    frontendUrl: 'https://app.test',
    client: {
      checkout: {
        sessions: {
          create: stripeSessionsCreate,
          retrieve: stripeSessionsRetrieve,
        },
      },
    },
    connectRequestOptions: jest
      .fn()
      .mockReturnValue({ stripeAccount: 'acct_1' }),
    usesDestinationCharges: jest.fn().mockReturnValue(false),
    connectCheckoutSessionCreate: jest.fn(
      (accountId: string, params: unknown, _settings?: unknown) => [
        params,
        { stripeAccount: 'acct_1' },
      ],
    ),
  };
  const stripeIntegrationService = {
    assertCanAcceptOnlinePayments: jest.fn(),
    resolveConnectAccountId: jest.fn(),
  };
  const eventStore = { publish: jest.fn() };
  const publicBookingService = {
    createBooking: jest.fn(),
    bookPackage: jest.fn(),
    bookMultiService: jest.fn(),
  };
  const checkoutPricingService = { calculate: jest.fn() };
  const subscriptionsService = { getPlanCheckoutDetails: jest.fn() };
  const packagesService = { previewPackagePricing: jest.fn() };
  const multiServiceBookingsService = { previewTotals: jest.fn() };
  const giftCardPurchaseService = {
    quotePurchase: jest.fn(),
    fulfillPurchase: jest.fn(),
  };
  const giftCardDeliveryService = {};

  const service = new BookingPaymentService(
    draftRepo as any,
    serviceRepo as any,
    businessRepo as any,
    stripeService as any,
    stripeIntegrationService as any,
    {} as any,
    {} as any,
    eventStore as any,
    publicBookingService as any,
    checkoutPricingService as any,
    subscriptionsService as any,
    packagesService as any,
    multiServiceBookingsService as any,
    giftCardPurchaseService as any,
    giftCardDeliveryService as any,
  );

  const giftCardQuote = {
    cardType: 'monetary' as const,
    subtotal: 50,
    shippingFee: 0,
    total: 50,
    currency: 'USD',
    label: '$50 Gift Card',
  };

  const giftCardDto = {
    cardType: 'monetary' as const,
    amount: 50,
    deliveryMethod: 'digital' as const,
    purchaserEmail: 'buyer@test.com',
  };

  const baseService = {
    id: 'svc-1',
    name: 'Deep tissue massage',
    price: 120,
    currency: 'USD',
    prepaymentMode: PrepaymentMode.FULL,
  };

  const planCheckout = {
    amount: 684,
    currency: 'USD',
    planName: '6 visits',
    includedAppointments: 6,
    durationMonths: 3,
  };

  const pricingWithPromo = {
    servicePrice: 684,
    subtotal: 684,
    amountDue: 672,
    promoDiscount: 12,
    totalDiscount: 12,
    promoCode: 'SAVE12',
    promoCodeId: 'promo-1',
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    loyaltyPointsToRedeem: 0,
    pointsToEarn: 33.6,
    adjustments: [{ type: 'promo', amount: 12 }],
  };

  const packagePreview = {
    package: { id: 'pkg-1', name: 'Spa Day' },
    pricing: { packagePrice: 180, savings: 40, regularTotal: 220 },
    currency: 'USD',
  };

  const packagePricing = {
    servicePrice: 180,
    subtotal: 180,
    amountDue: 170,
    promoDiscount: 10,
    totalDiscount: 10,
    promoCode: 'PKG10',
    promoCodeId: 'promo-pkg',
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    loyaltyPointsToRedeem: 0,
    pointsToEarn: 8.5,
    adjustments: [{ type: 'promo', amount: 10 }],
  };

  const multiServicePreview = {
    valid: true,
    services: [
      {
        serviceId: 'svc-1',
        name: 'Haircut A',
        durationMinutes: 30,
        bufferMinutes: 0,
        price: 50,
      },
      {
        serviceId: 'svc-2',
        name: 'Haircut B',
        durationMinutes: 30,
        bufferMinutes: 0,
        price: 45,
      },
    ],
    totals: {
      totalPrice: 95,
      currency: 'USD',
      blockDurationMinutes: 90,
      serviceCount: 2,
    },
  };

  const multiServicePricing = {
    servicePrice: 95,
    subtotal: 95,
    amountDue: 90,
    promoDiscount: 5,
    totalDiscount: 5,
    promoCode: 'MULTI5',
    promoCodeId: 'promo-ms',
    giftCardDiscount: 0,
    loyaltyDiscount: 0,
    loyaltyPointsToRedeem: 0,
    pointsToEarn: 4.5,
    adjustments: [{ type: 'promo', amount: 5 }],
  };

  const packageDto = {
    packageId: 'pkg-1',
    lines: [
      {
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        startTime: new Date().toISOString(),
      },
      {
        serviceId: 'svc-2',
        employeeId: 'emp-1',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ],
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  const multiServiceDto = {
    serviceIds: ['svc-1', 'svc-2'],
    blockStartTime: new Date().toISOString(),
    employeeId: 'emp-1',
    customer: { name: 'Jane', email: 'jane@test.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService.isConfigured = false;
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      slug: 'salon',
      settings: {},
    });
    checkoutPricingService.calculate.mockResolvedValue(pricingWithPromo);
    draftRepo.create.mockImplementation((value) => value);
    draftRepo.save.mockImplementation(async (value) => ({
      id: 'draft-1',
      ...value,
    }));
  });

  describe('calculatePrepaymentAmount', () => {
    it('returns full price for full prepayment mode', () => {
      expect(
        service.calculatePrepaymentAmount({
          price: 120,
          prepaymentMode: PrepaymentMode.FULL,
        } as any),
      ).toBe(120);
    });

    it('returns configured deposit amount capped by price', () => {
      expect(
        service.calculatePrepaymentAmount({
          price: 120,
          prepaymentMode: PrepaymentMode.DEPOSIT,
          depositAmount: 40,
        } as any),
      ).toBe(40);
      expect(
        service.calculatePrepaymentAmount({
          price: 120,
          prepaymentMode: PrepaymentMode.DEPOSIT,
          depositAmount: 200,
        } as any),
      ).toBe(120);
    });

    it('returns half price deposit when no deposit amount configured', () => {
      expect(
        service.calculatePrepaymentAmount({
          price: 120,
          prepaymentMode: PrepaymentMode.DEPOSIT,
          depositAmount: null,
        } as any),
      ).toBe(60);
    });

    it('returns zero when prepayment disabled', () => {
      expect(
        service.calculatePrepaymentAmount({
          price: 120,
          prepaymentMode: PrepaymentMode.NONE,
        } as any),
      ).toBe(0);
    });
  });

  describe('requiresPrepayment', () => {
    it('is true when prepayment amount is positive', () => {
      expect(service.requiresPrepayment(baseService as any)).toBe(true);
    });

    it('is false when prepayment mode is none', () => {
      expect(
        service.requiresPrepayment({
          ...baseService,
          prepaymentMode: PrepaymentMode.NONE,
        } as any),
      ).toBe(false);
    });
  });

  describe('pricingMetadata', () => {
    it('maps checkout pricing result into booking metadata', () => {
      expect(service.pricingMetadata(pricingWithPromo as any)).toEqual({
        pricing: expect.objectContaining({
          subtotal: 684,
          amountDue: 672,
          promoDiscount: 12,
        }),
        amountPaid: 672,
        cashPaidEligible: 672,
      });
    });
  });

  describe('resolveCheckoutPricing', () => {
    it('uses subscription plan price as checkout subtotal when purchasePlanId is set', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(
        planCheckout,
      );

      await service.resolveCheckoutPricing('biz-1', baseService as any, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
        purchasePlanId: 'plan-1',
        promoCode: 'SAVE12',
      });

      expect(subscriptionsService.getPlanCheckoutDetails).toHaveBeenCalledWith(
        'biz-1',
        'plan-1',
      );
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 684,
          prepaymentAmount: 684,
          promoCode: 'SAVE12',
        }),
      );
    });

    it('uses service prepayment for one-time checkout', async () => {
      await service.resolveCheckoutPricing('biz-1', baseService as any, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
      });

      expect(
        subscriptionsService.getPlanCheckoutDetails,
      ).not.toHaveBeenCalled();
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 120,
          prepaymentAmount: 120,
        }),
      );
    });

    it('falls back to service price when prepayment is zero', async () => {
      await service.resolveCheckoutPricing(
        'biz-1',
        { ...baseService, prepaymentMode: PrepaymentMode.NONE } as any,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          prepaymentAmount: 120,
        }),
      );
    });
  });

  describe('createCheckoutSession', () => {
    const baseDto = {
      serviceId: 'svc-1',
      startTime: new Date().toISOString(),
      customer: { name: 'Jane', email: 'jane@test.com' },
    };

    beforeEach(() => {
      stripeService.isConfigured = true;
      serviceRepo.findOne.mockResolvedValue(baseService);
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue(
        'acct_1',
      );
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_1',
        url: 'https://stripe.test/pay',
      });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('creates discounted subscription checkout session with plan line item', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(
        planCheckout,
      );

      const result = await service.createCheckoutSession('salon', {
        ...baseDto,
        purchasePlanId: 'plan-1',
        promoCode: 'SAVE12',
      });

      expect(result).toEqual({
        url: 'https://stripe.test/pay',
        sessionId: 'sess_1',
        amount: 672,
        currency: 'USD',
      });
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 67200,
                product_data: expect.objectContaining({
                  name: '6 visits subscription',
                  description: '6 appointments over 3 months',
                }),
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind: 'subscription_purchase',
          }),
        }),
        expect.any(Object),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 672,
          payload: expect.objectContaining({
            purchasePlanId: 'plan-1',
            metadata: expect.objectContaining({
              checkoutPricing: pricingWithPromo,
              checkoutKind: 'subscription_purchase',
            }),
          }),
        }),
      );
    });

    it('creates one-time checkout session with auto-assign success url', async () => {
      checkoutPricingService.calculate.mockResolvedValue({
        ...pricingWithPromo,
        subtotal: 60,
        amountDue: 60,
        promoDiscount: 0,
        totalDiscount: 0,
      });
      serviceRepo.findOne.mockResolvedValue({
        ...baseService,
        prepaymentMode: PrepaymentMode.DEPOSIT,
        depositAmount: 60,
      });

      await service.createCheckoutSession('salon', baseDto);

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('autoAssign=1'),
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  description: 'Deposit for Deep tissue massage',
                }),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
    });

    it('creates one-time checkout session with employee in success url', async () => {
      checkoutPricingService.calculate.mockResolvedValue({
        ...pricingWithPromo,
        subtotal: 120,
        amountDue: 120,
        promoDiscount: 0,
        totalDiscount: 0,
      });

      const result = await service.createCheckoutSession('salon', {
        ...baseDto,
        employeeId: 'emp-1',
      });

      expect(result.amount).toBe(120);
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('employeeId=emp-1'),
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: 'Deep tissue massage',
                }),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when service is missing', async () => {
      serviceRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when subscription purchase is missing plan id', async () => {
      jest
        .spyOn(subscriptionCheckoutUtil, 'resolvePublicCheckoutKind')
        .mockReturnValue('subscription_purchase');

      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toThrow('purchasePlanId is required');

      jest.restoreAllMocks();
    });

    it('throws when promo reduces subscription amount due to zero', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(
        planCheckout,
      );
      checkoutPricingService.calculate.mockResolvedValue({
        ...pricingWithPromo,
        amountDue: 0,
        totalDiscount: 684,
      });

      await expect(
        service.createCheckoutSession('salon', {
          ...baseDto,
          purchasePlanId: 'plan-1',
          promoCode: 'FREE',
        }),
      ).rejects.toThrow('No payment is due after discounts');
    });

    it('throws when one-time service does not require online payment', async () => {
      serviceRepo.findOne.mockResolvedValue({
        ...baseService,
        prepaymentMode: PrepaymentMode.NONE,
      });

      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toThrow('does not require online payment');
    });

    it('throws when customer contact is missing', async () => {
      await expect(
        service.createCheckoutSession('salon', {
          ...baseDto,
          customer: { name: 'Jane' },
        }),
      ).rejects.toThrow('Email or phone number is required');
    });

    it('throws when stripe session has no url', async () => {
      stripeSessionsCreate.mockResolvedValue({ id: 'sess_1', url: null });
      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toThrow('Failed to create payment session');
    });

    it('creates subscription checkout when customer only has phone', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(
        planCheckout,
      );

      await service.createCheckoutSession('salon', {
        ...baseDto,
        customer: { name: 'Jane', phone: '+15551234567' },
        purchasePlanId: 'plan-1',
      });

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: undefined,
        }),
        expect.any(Object),
      );
    });
  });

  describe('confirmCheckoutSession', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: { stripeConnectAccountId: 'acct_1' },
      });
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue(
        'acct_1',
      );
    });

    it('fulfills paid subscription draft and publishes events', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_1',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-1',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-1',
        businessId: 'biz-1',
        amount: 672,
        currency: 'USD',
        status: 'pending',
        stripeConnectAccountId: 'acct_1',
        payload: {
          serviceId: 'svc-1',
          purchasePlanId: 'plan-1',
          customer: { name: 'Jane', email: 'jane@test.com' },
          metadata: { authenticatedCustomerId: 'cust-1' },
        },
      });
      publicBookingService.createBooking.mockResolvedValue({
        booking: { id: 'booking-1' },
        customer: { id: 'cust-1' },
        customerSubscriptionId: 'sub-purchased-1',
      });

      const result = await service.confirmCheckoutSession('salon', 'sess_1');

      expect(result).toEqual({
        alreadyCompleted: false,
        booking: { id: 'booking-1' },
        customer: { id: 'cust-1' },
      });
      expect(publicBookingService.createBooking).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({
          markPaid: true,
          purchasePlanId: 'plan-1',
          metadata: expect.objectContaining({
            subscriptionPricePaid: 672,
            prepaymentAmount: 672,
          }),
        }),
        'cust-1',
      );
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: EventType.PAYMENT_RECEIVED }),
      );
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.SUBSCRIPTION_PURCHASED,
          aggregateId: 'sub-purchased-1',
          payload: expect.objectContaining({
            subscriptionId: 'sub-purchased-1',
            planId: 'plan-1',
          }),
        }),
      );
    });

    it('fulfills one-time paid draft without subscription purchased event', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_1',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-1',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-1',
        businessId: 'biz-1',
        amount: 120,
        currency: 'USD',
        status: 'pending',
        stripeConnectAccountId: 'acct_1',
        payload: {
          serviceId: 'svc-1',
          customer: { name: 'Jane', email: 'jane@test.com' },
        },
      });
      publicBookingService.createBooking.mockResolvedValue({
        booking: { id: 'booking-1' },
        customer: { id: 'cust-1' },
      });

      await service.confirmCheckoutSession('salon', 'sess_1');

      expect(eventStore.publish).toHaveBeenCalledTimes(1);
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PAYMENT_RECEIVED,
          payload: expect.objectContaining({ source: 'public_booking' }),
        }),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.confirmCheckoutSession('salon', 'sess_1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when connect account is missing', async () => {
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
      await expect(
        service.confirmCheckoutSession('salon', 'sess_1'),
      ).rejects.toThrow('Stripe is not connected');
    });

    it('throws for invalid session metadata', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        metadata: { type: 'booking_payment', slug: 'other' },
      });
      await expect(
        service.confirmCheckoutSession('salon', 'sess_1'),
      ).rejects.toThrow('Invalid payment session');
    });

    it('throws when payment is incomplete', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-1',
        },
        status: 'open',
        payment_status: 'unpaid',
      });
      await expect(
        service.confirmCheckoutSession('salon', 'sess_1'),
      ).rejects.toThrow('Payment is not complete yet');
    });

    it('returns already completed when draft is missing', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_1',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-missing',
        },
      });
      draftRepo.findOne.mockResolvedValue(null);

      const result = await service.confirmCheckoutSession('salon', 'sess_1');

      expect(result).toEqual({ alreadyCompleted: true });
    });

    it('returns already completed when draft was fulfilled earlier', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_1',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-1',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-1',
        status: 'completed',
      });

      const result = await service.confirmCheckoutSession('salon', 'sess_1');

      expect(result).toEqual({ alreadyCompleted: true });
      expect(publicBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('throws when business is missing during fulfillment', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_1',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-1',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-1',
        businessId: 'biz-1',
        status: 'pending',
        payload: { customer: { name: 'Jane' } },
      });
      businessRepo.findOne
        .mockResolvedValueOnce({ id: 'biz-1', slug: 'salon', settings: {} })
        .mockResolvedValueOnce(null);

      await expect(
        service.confirmCheckoutSession('salon', 'sess_1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('handleCheckoutCompleted', () => {
    it('ignores unrelated webhook sessions', async () => {
      await service.handleCheckoutCompleted({ metadata: { type: 'other' } });
      expect(draftRepo.findOne).not.toHaveBeenCalled();
    });

    it('ignores unpaid webhook sessions', async () => {
      await service.handleCheckoutCompleted({
        metadata: { type: 'booking_payment', draftId: 'draft-1' },
        status: 'open',
        payment_status: 'unpaid',
      });
      expect(draftRepo.findOne).not.toHaveBeenCalled();
    });

    it('fulfills completed subscription webhook session', async () => {
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-1',
        businessId: 'biz-1',
        amount: 672,
        currency: 'USD',
        status: 'completed',
      });

      await service.handleCheckoutCompleted({
        id: 'sess_1',
        metadata: { type: 'booking_payment', draftId: 'draft-1' },
        status: 'complete',
        payment_status: 'paid',
      });

      expect(draftRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
      });
    });

    it('fulfills package purchase via webhook (gap-8.3)', async () => {
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-pkg',
        businessId: 'biz-1',
        amount: 170,
        currency: 'USD',
        status: 'pending',
        payload: {
          ...packageDto,
          metadata: { checkoutKind: 'package_purchase' },
        },
      });
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      });
      publicBookingService.bookPackage.mockResolvedValue({
        packagePurchase: { id: 'purchase-1' },
        bookings: [{ id: 'b1' }],
        customer: { id: 'cust-1' },
      });

      await service.handleCheckoutCompleted({
        id: 'sess_pkg',
        metadata: { type: 'booking_payment', draftId: 'draft-pkg' },
        status: 'complete',
        payment_status: 'paid',
      });

      expect(publicBookingService.bookPackage).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({ markPaid: true }),
        undefined,
      );
    });

    it('fulfills multi-service booking via webhook (gap-8.7)', async () => {
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-ms',
        businessId: 'biz-1',
        amount: 90,
        currency: 'USD',
        status: 'pending',
        payload: {
          ...multiServiceDto,
          metadata: { checkoutKind: 'multi_service_booking' },
        },
      });
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      });
      publicBookingService.bookMultiService.mockResolvedValue({
        multiServiceGroup: { id: 'group-1' },
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        customer: { id: 'cust-1' },
      });

      await service.handleCheckoutCompleted({
        id: 'sess_ms',
        metadata: { type: 'booking_payment', draftId: 'draft-ms' },
        status: 'complete',
        payment_status: 'paid',
      });

      expect(publicBookingService.bookMultiService).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({ markPaid: true }),
        undefined,
      );
    });
  });

  describe('resolvePackageCheckoutPricing (gap-8.3)', () => {
    beforeEach(() => {
      packagesService.previewPackagePricing.mockResolvedValue(packagePreview);
      checkoutPricingService.calculate.mockResolvedValue(packagePricing);
    });

    it('uses package price as checkout subtotal', async () => {
      const result = await service.resolvePackageCheckoutPricing(
        'biz-1',
        'pkg-1',
        {
          promoCode: 'PKG10',
          loyaltyPointsToRedeem: 0,
        },
      );

      expect(packagesService.previewPackagePricing).toHaveBeenCalledWith(
        'biz-1',
        'pkg-1',
      );
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 180,
          prepaymentAmount: 180,
          currency: 'USD',
          promoCode: 'PKG10',
        }),
      );
      expect(result).toEqual(packagePricing);
    });

    it('passes authenticated customer id for loyalty redemption', async () => {
      await service.resolvePackageCheckoutPricing(
        'biz-1',
        'pkg-1',
        { promoCode: 'PKG10' },
        'cust-1',
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-1' }),
      );
    });
  });

  describe('createPackageCheckoutSession (gap-8.3)', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      packagesService.previewPackagePricing.mockResolvedValue(packagePreview);
      checkoutPricingService.calculate.mockResolvedValue(packagePricing);
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue(
        'acct_1',
      );
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_pkg',
        url: 'https://stripe.test/pkg',
      });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('creates discounted package checkout session with bundle line item', async () => {
      const result = await service.createPackageCheckoutSession('salon', {
        ...packageDto,
        promoCode: 'PKG10',
      });

      expect(result).toEqual({
        url: 'https://stripe.test/pkg',
        sessionId: 'sess_pkg',
        amount: 170,
        currency: 'USD',
      });
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 17000,
                product_data: expect.objectContaining({
                  name: 'Spa Day',
                  description: 'Bundle of 2 appointments',
                }),
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind: 'package_purchase',
          }),
          success_url: expect.stringContaining('/packages/pkg-1/checkout'),
          cancel_url: expect.stringContaining(
            '/packages/pkg-1/checkout?canceled=1',
          ),
        }),
        expect.any(Object),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 170,
          payload: expect.objectContaining({
            packageId: 'pkg-1',
            metadata: expect.objectContaining({
              checkoutKind: 'package_purchase',
              checkoutPricing: packagePricing,
            }),
          }),
        }),
      );
    });

    it('creates package checkout with phone-only customer', async () => {
      await service.createPackageCheckoutSession('salon', {
        ...packageDto,
        customer: { name: 'Jane', phone: '+15551234567' },
      });

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ customer_email: undefined }),
        expect.any(Object),
      );
    });

    it('stores authenticated customer id in draft metadata', async () => {
      await service.createPackageCheckoutSession(
        'salon',
        packageDto,
        'cust-auth',
      );

      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              authenticatedCustomerId: 'cust-auth',
            }),
          }),
        }),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createPackageCheckoutSession('salon', packageDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createPackageCheckoutSession('salon', packageDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when promo reduces package amount due to zero', async () => {
      checkoutPricingService.calculate.mockResolvedValue({
        ...packagePricing,
        amountDue: 0,
        totalDiscount: 180,
      });

      await expect(
        service.createPackageCheckoutSession('salon', {
          ...packageDto,
          promoCode: 'FREE',
        }),
      ).rejects.toThrow('No payment is due after discounts');
    });

    it('throws when customer contact is missing', async () => {
      await expect(
        service.createPackageCheckoutSession('salon', {
          ...packageDto,
          customer: { name: 'Jane' },
        }),
      ).rejects.toThrow('Email or phone number is required');
    });

    it('throws when stripe session has no url', async () => {
      stripeSessionsCreate.mockResolvedValue({ id: 'sess_pkg', url: null });
      await expect(
        service.createPackageCheckoutSession('salon', packageDto),
      ).rejects.toThrow('Failed to create payment session');
    });

    it('uses singular appointment copy for single-line packages', async () => {
      packagesService.previewPackagePricing.mockResolvedValue({
        ...packagePreview,
        package: { name: 'Solo' },
      });

      await service.createPackageCheckoutSession('salon', {
        ...packageDto,
        lines: [packageDto.lines[0]],
      });

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  description: 'Bundle of 1 appointment',
                }),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
    });
  });

  describe('resolveMultiServiceCheckoutPricing (gap-8.7)', () => {
    beforeEach(() => {
      multiServiceBookingsService.previewTotals.mockResolvedValue(
        multiServicePreview,
      );
      checkoutPricingService.calculate.mockResolvedValue(multiServicePricing);
    });

    it('uses summed service prices as checkout subtotal', async () => {
      const result = await service.resolveMultiServiceCheckoutPricing(
        'biz-1',
        ['svc-1', 'svc-2'],
        { promoCode: 'MULTI5' },
      );

      expect(multiServiceBookingsService.previewTotals).toHaveBeenCalledWith(
        'biz-1',
        ['svc-1', 'svc-2'],
      );
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 95,
          prepaymentAmount: 95,
          currency: 'USD',
          promoCode: 'MULTI5',
          serviceLineItems: [
            { serviceId: 'svc-1', amount: 50 },
            { serviceId: 'svc-2', amount: 45 },
          ],
        }),
      );
      expect(result).toEqual(multiServicePricing);
    });

    it('passes authenticated customer id for loyalty redemption', async () => {
      await service.resolveMultiServiceCheckoutPricing(
        'biz-1',
        ['svc-1', 'svc-2'],
        {},
        'cust-1',
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'cust-1' }),
      );
    });
  });

  describe('createMultiServiceCheckoutSession (gap-8.7)', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      multiServiceBookingsService.previewTotals.mockResolvedValue(
        multiServicePreview,
      );
      checkoutPricingService.calculate.mockResolvedValue(multiServicePricing);
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue(
        'acct_1',
      );
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_ms',
        url: 'https://stripe.test/ms',
      });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('creates same-visit multi-service checkout session', async () => {
      const result = await service.createMultiServiceCheckoutSession('salon', {
        ...multiServiceDto,
        promoCode: 'MULTI5',
      });

      expect(result).toEqual({
        url: 'https://stripe.test/ms',
        sessionId: 'sess_ms',
        amount: 90,
        currency: 'USD',
      });
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 9000,
                product_data: expect.objectContaining({
                  name: 'Multi-service appointment',
                  description: '2 services in one visit',
                }),
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind: 'multi_service_booking',
          }),
          success_url: expect.stringContaining('/multi/checkout'),
          cancel_url: expect.stringContaining('/multi/checkout?canceled=1'),
        }),
        expect.any(Object),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 90,
          payload: expect.objectContaining({
            serviceIds: ['svc-1', 'svc-2'],
            metadata: expect.objectContaining({
              checkoutKind: 'multi_service_booking',
              checkoutPricing: multiServicePricing,
              serviceIds: ['svc-1', 'svc-2'],
            }),
          }),
        }),
      );
    });

    it('creates per-service lines checkout session', async () => {
      await service.createMultiServiceCheckoutSession('salon', {
        ...multiServiceDto,
        blockStartTime: undefined,
        employeeId: undefined,
        lines: [
          {
            serviceId: 'svc-1',
            employeeId: 'emp-1',
            startTime: new Date().toISOString(),
          },
          {
            serviceId: 'svc-2',
            employeeId: 'emp-2',
            startTime: new Date(Date.now() + 86_400_000).toISOString(),
          },
        ],
      });

      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            lines: expect.arrayContaining([
              expect.objectContaining({ serviceId: 'svc-1' }),
              expect.objectContaining({ serviceId: 'svc-2' }),
            ]),
          }),
        }),
      );
    });

    it('stores authenticated customer id in draft metadata', async () => {
      await service.createMultiServiceCheckoutSession(
        'salon',
        multiServiceDto,
        'cust-auth',
      );

      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              authenticatedCustomerId: 'cust-auth',
            }),
          }),
        }),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createMultiServiceCheckoutSession('salon', multiServiceDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createMultiServiceCheckoutSession('salon', multiServiceDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when promo reduces multi-service amount due to zero', async () => {
      checkoutPricingService.calculate.mockResolvedValue({
        ...multiServicePricing,
        amountDue: 0,
        totalDiscount: 95,
      });

      await expect(
        service.createMultiServiceCheckoutSession('salon', {
          ...multiServiceDto,
          promoCode: 'FREE',
        }),
      ).rejects.toThrow('No payment is due after discounts');
    });

    it('throws when customer contact is missing', async () => {
      await expect(
        service.createMultiServiceCheckoutSession('salon', {
          ...multiServiceDto,
          customer: { name: 'Jane' },
        }),
      ).rejects.toThrow('Email or phone number is required');
    });

    it('throws when stripe session has no url', async () => {
      stripeSessionsCreate.mockResolvedValue({ id: 'sess_ms', url: null });
      await expect(
        service.createMultiServiceCheckoutSession('salon', multiServiceDto),
      ).rejects.toThrow('Failed to create payment session');
    });

    it('encodes service ids in cancel url', async () => {
      await service.createMultiServiceCheckoutSession('salon', multiServiceDto);

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_url: expect.stringContaining('services=svc-1%2Csvc-2'),
        }),
        expect.any(Object),
      );
    });
  });

  describe('confirmCheckoutSession package & multi-service fulfillment', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: { stripeConnectAccountId: 'acct_1' },
      });
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue(
        'acct_1',
      );
    });

    it('fulfills paid package draft and publishes package payment event', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_pkg',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-pkg',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-pkg',
        businessId: 'biz-1',
        amount: 170,
        currency: 'USD',
        status: 'pending',
        stripeConnectAccountId: 'acct_1',
        payload: {
          ...packageDto,
          metadata: {
            checkoutKind: 'package_purchase',
            authenticatedCustomerId: 'cust-1',
          },
        },
      });
      publicBookingService.bookPackage.mockResolvedValue({
        packagePurchase: { id: 'purchase-1' },
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        customer: { id: 'cust-1' },
      });

      const result = await service.confirmCheckoutSession('salon', 'sess_pkg');

      expect(result).toEqual({
        alreadyCompleted: false,
        packagePurchase: { id: 'purchase-1' },
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        customer: { id: 'cust-1' },
      });
      expect(publicBookingService.bookPackage).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({ markPaid: true, packageId: 'pkg-1' }),
        'cust-1',
      );
      expect(publicBookingService.createBooking).not.toHaveBeenCalled();
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PAYMENT_RECEIVED,
          aggregateType: 'package_purchase',
          aggregateId: 'purchase-1',
          payload: expect.objectContaining({
            packageId: 'pkg-1',
            source: 'package_purchase',
            amount: 170,
          }),
        }),
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          stripeSessionId: 'sess_pkg',
        }),
      );
    });

    it('fulfills paid multi-service draft and publishes group payment event', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_ms',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-ms',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-ms',
        businessId: 'biz-1',
        amount: 90,
        currency: 'USD',
        status: 'pending',
        stripeConnectAccountId: 'acct_1',
        payload: {
          ...multiServiceDto,
          metadata: {
            checkoutKind: 'multi_service_booking',
            serviceIds: ['svc-1', 'svc-2'],
            authenticatedCustomerId: 'cust-1',
          },
        },
      });
      publicBookingService.bookMultiService.mockResolvedValue({
        multiServiceGroup: { id: 'group-1' },
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        customer: { id: 'cust-1' },
      });

      const result = await service.confirmCheckoutSession('salon', 'sess_ms');

      expect(result).toEqual({
        alreadyCompleted: false,
        multiServiceGroup: { id: 'group-1' },
        bookings: [{ id: 'b1' }, { id: 'b2' }],
        customer: { id: 'cust-1' },
      });
      expect(publicBookingService.bookMultiService).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({
          markPaid: true,
          serviceIds: ['svc-1', 'svc-2'],
        }),
        'cust-1',
      );
      expect(publicBookingService.createBooking).not.toHaveBeenCalled();
      expect(eventStore.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.PAYMENT_RECEIVED,
          aggregateType: 'multi_service_booking_group',
          aggregateId: 'group-1',
          payload: expect.objectContaining({
            multiServiceGroupId: 'group-1',
            source: 'multi_service_booking',
            amount: 90,
          }),
        }),
      );
    });

    it('resolves checkout kind from draft metadata when packageId present', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_pkg',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-pkg',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-pkg',
        businessId: 'biz-1',
        amount: 170,
        currency: 'USD',
        status: 'pending',
        payload: {
          ...packageDto,
          metadata: { checkoutKind: 'package_purchase' },
        },
      });
      publicBookingService.bookPackage.mockResolvedValue({
        packagePurchase: { id: 'purchase-1' },
        bookings: [],
        customer: { id: 'cust-1' },
      });

      await service.confirmCheckoutSession('salon', 'sess_pkg');

      expect(publicBookingService.bookPackage).toHaveBeenCalled();
      expect(publicBookingService.bookMultiService).not.toHaveBeenCalled();
    });
  });

  // ─── success_url {CHECKOUT_SESSION_ID} encoding ───────────────────────────────

  describe('success_url {CHECKOUT_SESSION_ID} placeholder', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue(
        'acct_1',
      );
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_1',
        url: 'https://stripe.test/pay',
      });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('createCheckoutSession passes raw {CHECKOUT_SESSION_ID} not URL-encoded', async () => {
      serviceRepo.findOne.mockResolvedValue(baseService);
      await service.createCheckoutSession('salon', {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane', email: 'jane@test.com' },
      });
      const [[sessionParams]] = stripeSessionsCreate.mock.calls;
      expect(sessionParams.success_url).toContain(
        'session_id={CHECKOUT_SESSION_ID}',
      );
      expect(sessionParams.success_url).not.toContain('%7B');
    });

    it('createPackageCheckoutSession passes raw {CHECKOUT_SESSION_ID} not URL-encoded', async () => {
      packagesService.previewPackagePricing.mockResolvedValue(packagePreview);
      checkoutPricingService.calculate.mockResolvedValue(packagePricing);
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_pkg',
        url: 'https://stripe.test/pkg',
      });

      await service.createPackageCheckoutSession('salon', packageDto);

      const [[sessionParams]] = stripeSessionsCreate.mock.calls;
      expect(sessionParams.success_url).toContain(
        'session_id={CHECKOUT_SESSION_ID}',
      );
      expect(sessionParams.success_url).not.toContain('%7B');
    });

    it('createMultiServiceCheckoutSession passes raw {CHECKOUT_SESSION_ID} not URL-encoded', async () => {
      multiServiceBookingsService.previewTotals.mockResolvedValue(
        multiServicePreview,
      );
      checkoutPricingService.calculate.mockResolvedValue(multiServicePricing);
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_ms',
        url: 'https://stripe.test/ms',
      });

      await service.createMultiServiceCheckoutSession('salon', multiServiceDto);

      const [[sessionParams]] = stripeSessionsCreate.mock.calls;
      expect(sessionParams.success_url).toContain(
        'session_id={CHECKOUT_SESSION_ID}',
      );
      expect(sessionParams.success_url).not.toContain('%7B');
    });

    it('createGiftCardCheckoutSession passes raw {CHECKOUT_SESSION_ID} not URL-encoded', async () => {
      giftCardPurchaseService.quotePurchase.mockResolvedValue(giftCardQuote);
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_gc',
        url: 'https://stripe.test/gc',
      });

      await service.createGiftCardCheckoutSession('salon', giftCardDto);

      const [[sessionParams]] = stripeSessionsCreate.mock.calls;
      expect(sessionParams.success_url).toContain(
        'session_id={CHECKOUT_SESSION_ID}',
      );
      expect(sessionParams.success_url).not.toContain('%7B');
    });
  });

  // ─── createGiftCardCheckoutSession ────────────────────────────────────────────

  describe('createGiftCardCheckoutSession', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue(
        'acct_1',
      );
      giftCardPurchaseService.quotePurchase.mockResolvedValue(giftCardQuote);
      stripeSessionsCreate.mockResolvedValue({
        id: 'sess_gc',
        url: 'https://stripe.test/gc',
      });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('creates gift card checkout session with correct line item', async () => {
      const result = await service.createGiftCardCheckoutSession(
        'salon',
        giftCardDto,
      );

      expect(result).toEqual({
        url: 'https://stripe.test/gc',
        sessionId: 'sess_gc',
        draftId: 'draft-1',
        total: 50,
      });
      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer_email: 'buyer@test.com',
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 5000,
                product_data: expect.objectContaining({
                  name: '$50 Gift Card',
                }),
              }),
            }),
          ],
          metadata: expect.objectContaining({
            checkoutKind: 'gift_card_purchase',
          }),
          success_url: expect.stringContaining('/gift-cards/checkout?paid=1'),
          cancel_url: expect.stringContaining(
            '/gift-cards/checkout?canceled=1',
          ),
        }),
        expect.any(Object),
      );
    });

    it('includes shipping fee as separate line item when > 0', async () => {
      giftCardPurchaseService.quotePurchase.mockResolvedValue({
        ...giftCardQuote,
        subtotal: 50,
        shippingFee: 10,
        total: 60,
        label: '$50 Gift Card',
      });

      await service.createGiftCardCheckoutSession('salon', {
        ...giftCardDto,
        deliveryMethod: 'physical' as const,
      });

      expect(stripeSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({ unit_amount: 5000 }),
            }),
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 1000,
                product_data: expect.objectContaining({
                  name: 'Gift card shipping',
                }),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
    });

    it('saves draft with correct gift card metadata', async () => {
      await service.createGiftCardCheckoutSession(
        'salon',
        giftCardDto,
        'cust-auth',
      );

      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          currency: 'USD',
          payload: expect.objectContaining({
            metadata: expect.objectContaining({
              checkoutKind: 'gift_card_purchase',
              authenticatedCustomerId: 'cust-auth',
            }),
          }),
        }),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(
        service.createGiftCardCheckoutSession('salon', giftCardDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createGiftCardCheckoutSession('salon', giftCardDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when gift card total is zero', async () => {
      giftCardPurchaseService.quotePurchase.mockResolvedValue({
        ...giftCardQuote,
        total: 0,
      });
      await expect(
        service.createGiftCardCheckoutSession('salon', giftCardDto),
      ).rejects.toThrow('Gift card total must be greater than zero');
    });

    it('throws when purchaser email is missing', async () => {
      await expect(
        service.createGiftCardCheckoutSession('salon', {
          ...giftCardDto,
          purchaserEmail: '',
        }),
      ).rejects.toThrow('Purchaser email is required');
    });

    it('throws when stripe session has no url', async () => {
      stripeSessionsCreate.mockResolvedValue({ id: 'sess_gc', url: null });
      await expect(
        service.createGiftCardCheckoutSession('salon', giftCardDto),
      ).rejects.toThrow('Failed to create payment session');
    });
  });

  // ─── handleCheckoutCompleted — gift card path ─────────────────────────────────

  describe('handleCheckoutCompleted — gift card', () => {
    it('fulfills gift card purchase via webhook', async () => {
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-gc',
        businessId: 'biz-1',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        payload: {
          ...giftCardDto,
          metadata: { checkoutKind: 'gift_card_purchase' },
        },
      });
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      });
      giftCardPurchaseService.fulfillPurchase.mockResolvedValue({
        id: 'gc-1',
        code: 'ABCD-1234',
      });

      await service.handleCheckoutCompleted({
        id: 'sess_gc',
        metadata: { type: 'booking_payment', draftId: 'draft-gc' },
        status: 'complete',
        payment_status: 'paid',
      });

      expect(giftCardPurchaseService.fulfillPurchase).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ purchaserEmail: 'buyer@test.com' }),
        'sess_gc',
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          stripeSessionId: 'sess_gc',
        }),
      );
    });

    it('links gift card to authenticated customer when draft has customer id', async () => {
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-gc',
        businessId: 'biz-1',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        payload: {
          ...giftCardDto,
          metadata: {
            checkoutKind: 'gift_card_purchase',
            authenticatedCustomerId: 'cust-auth',
          },
        },
      });
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      });
      giftCardPurchaseService.fulfillPurchase.mockResolvedValue({
        id: 'gc-1',
        code: 'ABCD-1234',
      });

      await service.handleCheckoutCompleted({
        id: 'sess_gc',
        metadata: { type: 'booking_payment', draftId: 'draft-gc' },
        status: 'complete',
        payment_status: 'paid',
      });

      expect(giftCardPurchaseService.fulfillPurchase).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({
          purchaserEmail: 'buyer@test.com',
          purchaserCustomerId: 'cust-auth',
        }),
        'sess_gc',
      );
    });
  });

  // ─── confirmCheckoutSession — gift card path ──────────────────────────────────

  describe('confirmCheckoutSession — gift card', () => {
    beforeEach(() => {
      stripeService.isConfigured = true;
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      });
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue(
        'acct_1',
      );
    });

    it('fulfills paid gift card draft and returns gift card', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        id: 'sess_gc',
        status: 'complete',
        payment_status: 'paid',
        metadata: {
          type: 'booking_payment',
          slug: 'salon',
          draftId: 'draft-gc',
        },
      });
      draftRepo.findOne.mockResolvedValue({
        id: 'draft-gc',
        businessId: 'biz-1',
        amount: 50,
        currency: 'USD',
        status: 'pending',
        stripeConnectAccountId: 'acct_1',
        payload: {
          ...giftCardDto,
          metadata: {
            checkoutKind: 'gift_card_purchase',
            authenticatedCustomerId: 'cust-auth',
          },
        },
      });
      giftCardPurchaseService.fulfillPurchase.mockResolvedValue({
        id: 'gc-1',
        code: 'ABCD-1234',
      });

      const result = await service.confirmCheckoutSession('salon', 'sess_gc');

      expect(result).toEqual({
        alreadyCompleted: false,
        giftCard: { id: 'gc-1', code: 'ABCD-1234' },
      });
      expect(giftCardPurchaseService.fulfillPurchase).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({
          purchaserEmail: 'buyer@test.com',
          purchaserCustomerId: 'cust-auth',
        }),
        'sess_gc',
      );
      expect(draftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          stripeSessionId: 'sess_gc',
        }),
      );
      expect(publicBookingService.createBooking).not.toHaveBeenCalled();
    });
  });
});
