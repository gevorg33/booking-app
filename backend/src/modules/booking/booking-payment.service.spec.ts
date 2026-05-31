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
    connectRequestOptions: jest.fn().mockReturnValue({ stripeAccount: 'acct_1' }),
  };
  const stripeIntegrationService = {
    assertCanAcceptOnlinePayments: jest.fn(),
    resolveConnectAccountId: jest.fn(),
  };
  const eventStore = { publish: jest.fn() };
  const publicBookingService = { createBooking: jest.fn() };
  const checkoutPricingService = { calculate: jest.fn() };
  const subscriptionsService = { getPlanCheckoutDetails: jest.fn() };

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
  );

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

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService.isConfigured = false;
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', slug: 'salon', settings: {} });
    checkoutPricingService.calculate.mockResolvedValue(pricingWithPromo);
    draftRepo.create.mockImplementation((value) => value);
    draftRepo.save.mockImplementation(async (value) => ({ id: 'draft-1', ...value }));
  });

  describe('calculatePrepaymentAmount', () => {
    it('returns full price for full prepayment mode', () => {
      expect(service.calculatePrepaymentAmount({ price: 120, prepaymentMode: PrepaymentMode.FULL } as any)).toBe(
        120,
      );
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
        service.calculatePrepaymentAmount({ price: 120, prepaymentMode: PrepaymentMode.NONE } as any),
      ).toBe(0);
    });
  });

  describe('requiresPrepayment', () => {
    it('is true when prepayment amount is positive', () => {
      expect(service.requiresPrepayment(baseService as any)).toBe(true);
    });

    it('is false when prepayment mode is none', () => {
      expect(
        service.requiresPrepayment({ ...baseService, prepaymentMode: PrepaymentMode.NONE } as any),
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
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(planCheckout);

      await service.resolveCheckoutPricing(
        'biz-1',
        baseService as any,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
          purchasePlanId: 'plan-1',
          promoCode: 'SAVE12',
        },
      );

      expect(subscriptionsService.getPlanCheckoutDetails).toHaveBeenCalledWith('biz-1', 'plan-1');
      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 684,
          prepaymentAmount: 684,
          promoCode: 'SAVE12',
        }),
      );
    });

    it('uses service prepayment for one-time checkout', async () => {
      await service.resolveCheckoutPricing(
        'biz-1',
        baseService as any,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(subscriptionsService.getPlanCheckoutDetails).not.toHaveBeenCalled();
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
      stripeIntegrationService.assertCanAcceptOnlinePayments.mockResolvedValue('acct_1');
      stripeSessionsCreate.mockResolvedValue({ id: 'sess_1', url: 'https://stripe.test/pay' });
    });

    afterEach(() => {
      stripeService.isConfigured = false;
    });

    it('creates discounted subscription checkout session with plan line item', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(planCheckout);

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
          metadata: expect.objectContaining({ checkoutKind: 'subscription_purchase' }),
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
                product_data: expect.objectContaining({ name: 'Deep tissue massage' }),
              }),
            }),
          ],
        }),
        expect.any(Object),
      );
    });

    it('throws when stripe is not configured', async () => {
      stripeService.isConfigured = false;
      await expect(service.createCheckoutSession('salon', baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws when business is missing', async () => {
      businessRepo.findOne.mockResolvedValue(null);
      await expect(service.createCheckoutSession('salon', baseDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when service is missing', async () => {
      serviceRepo.findOne.mockResolvedValue(null);
      await expect(service.createCheckoutSession('salon', baseDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws when subscription purchase is missing plan id', async () => {
      jest.spyOn(subscriptionCheckoutUtil, 'resolvePublicCheckoutKind').mockReturnValue('subscription_purchase');

      await expect(
        service.createCheckoutSession('salon', baseDto),
      ).rejects.toThrow('purchasePlanId is required');

      jest.restoreAllMocks();
    });

    it('throws when promo reduces subscription amount due to zero', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(planCheckout);
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

      await expect(service.createCheckoutSession('salon', baseDto)).rejects.toThrow(
        'does not require online payment',
      );
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
      await expect(service.createCheckoutSession('salon', baseDto)).rejects.toThrow(
        'Failed to create payment session',
      );
    });

    it('creates subscription checkout when customer only has phone', async () => {
      subscriptionsService.getPlanCheckoutDetails.mockResolvedValue(planCheckout);

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
      businessRepo.findOne.mockResolvedValue({ id: 'biz-1', slug: 'salon', settings: { stripeConnectAccountId: 'acct_1' } });
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue('acct_1');
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
        expect.objectContaining({ eventType: EventType.SUBSCRIPTION_PURCHASED }),
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
      await expect(service.confirmCheckoutSession('salon', 'sess_1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws when connect account is missing', async () => {
      stripeIntegrationService.resolveConnectAccountId.mockReturnValue(null);
      await expect(service.confirmCheckoutSession('salon', 'sess_1')).rejects.toThrow(
        'Stripe is not connected',
      );
    });

    it('throws for invalid session metadata', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        metadata: { type: 'booking_payment', slug: 'other' },
      });
      await expect(service.confirmCheckoutSession('salon', 'sess_1')).rejects.toThrow(
        'Invalid payment session',
      );
    });

    it('throws when payment is incomplete', async () => {
      stripeSessionsRetrieve.mockResolvedValue({
        metadata: { type: 'booking_payment', slug: 'salon', draftId: 'draft-1' },
        status: 'open',
        payment_status: 'unpaid',
      });
      await expect(service.confirmCheckoutSession('salon', 'sess_1')).rejects.toThrow(
        'Payment is not complete yet',
      );
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
      businessRepo.findOne.mockResolvedValueOnce({ id: 'biz-1', slug: 'salon', settings: {} }).mockResolvedValueOnce(null);

      await expect(service.confirmCheckoutSession('salon', 'sess_1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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

      expect(draftRepo.findOne).toHaveBeenCalledWith({ where: { id: 'draft-1' } });
    });
  });
});
