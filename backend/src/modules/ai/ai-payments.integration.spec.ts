import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import { CommissionsService } from '../commissions/commissions.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServiceService } from '../service/service.service.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { attachPublicBookingNearestAcrossWindowsMock } from './ai-nearest-slot-resolver.util.js';

describe('Sprint 30 payments AI scenarios', () => {
  const services = [
    {
      id: 's1',
      name: 'Massage',
      businessId: 'biz-1',
      price: 80,
      isActive: true,
    },
  ] as any[];

  const giftCardsService = {
    validate: jest.fn(async () => ({ id: 'gc-1', code: 'GCM-ABCD1234' })),
    getBalanceView: jest.fn(async () => ({
      id: 'gc-1',
      code: 'GCM-ABCD1234',
      cardType: 'monetary',
      balance: 50,
      currency: 'USD',
      expiresAt: null,
      isActive: true,
      serviceCredits: [],
    })),
    updateExpiration: jest.fn(async () => ({
      id: 'gc-1',
      expiresAt: new Date('2028-01-01'),
    })),
  };
  const giftCardPurchaseService = {
    getPublicCatalog: jest.fn(async () => ({
      purchaseEnabled: true,
      settings: { presetAmounts: [50, 100] },
    })),
    quotePurchase: jest.fn(async () => ({
      label: 'Gift card $50',
      total: 50,
      subtotal: 50,
      shippingFee: 0,
    })),
  };
  const giftCardOrderService = {};
  const giftCardRefundService = {
    refundPurchase: jest.fn(async () => 'refunded'),
  };
  const publicBookingService = {
    recommendProviders: jest.fn(async () => ({
      providers: [{ id: 'e1', name: 'Anna' }],
    })),
    findNearestBookableSlot: jest.fn(async () => ({
      startTime: '2026-06-06T18:00:00Z',
      employeeId: 'e1',
      employeeName: 'Anna',
    })),
  };
  attachPublicBookingNearestAcrossWindowsMock(publicBookingService);
  const accountingIntegrationService = {
    generateExport: jest.fn(async () => ({
      format: 'csv',
      rowCount: 1,
      content:
        'Date,Type,IncomeSubType,Description,Amount,Currency,Reference,Customer,Employee\n2026-06-01,income,subscription,Plan,199,USD,sub-1,Sam,',
      filename: 'export.csv',
      provider: 'csv',
    })),
  };
  const commissionsService = {
    exportPayoutCsv: jest.fn(async () => ({
      filename: 'payout.csv',
      content: 'employeeName\nAnna',
      rowCount: 1,
    })),
  };
  const subscriptionsService = {
    getPlanCheckoutDetails: jest.fn(async () => ({
      amount: 199,
      currency: 'USD',
      planName: '6-month plan',
      includedAppointments: 6,
      durationMonths: 6,
      preview: {},
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'salon',
      settings: {
        publicBooking: { acceptCashPayments: true },
        integrations: { stripe: { connectAccountId: 'acct_1' } },
      },
    })),
    save: jest.fn(async (b) => b),
  };
  const serviceRepo = {
    find: jest.fn(async () => services),
    findOne: jest.fn(async () => services[0]),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'b1',
        businessId: 'biz-1',
        paymentStatus: PaymentStatus.PENDING,
        status: 'confirmed',
        startTime: new Date('2026-06-06T10:00:00Z'),
        service: services[0],
        customer: { name: 'Jane' },
        employee: { name: 'Anna' },
        metadata: { paymentMethod: 'cash', payAtVenue: true },
      },
    ]),
    findOne: jest.fn(async ({ where }: any) => {
      if (where.id === 'b1') {
        return {
          id: 'b1',
          businessId: 'biz-1',
          paymentStatus: PaymentStatus.PENDING,
          service: services[0],
          customer: { name: 'Jane' },
          metadata: { paymentMethod: 'cash', payAtVenue: true },
        };
      }
      return null;
    }),
    save: jest.fn(async (b) => b),
  };
  const giftCardRepo = {
    findOne: jest.fn(async () => ({
      id: 'gc-1',
      businessId: 'biz-1',
      code: 'GCM-ABCD1234',
      cardType: 'monetary',
      balance: 50,
    })),
    save: jest.fn(async (c) => c),
  };

  let payments: AiPaymentsService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiPaymentsService,
        AiIntentRescueService,
        { provide: GiftCardsService, useValue: giftCardsService },
        { provide: GiftCardPurchaseService, useValue: giftCardPurchaseService },
        { provide: GiftCardOrderService, useValue: giftCardOrderService },
        { provide: GiftCardRefundService, useValue: giftCardRefundService },
        { provide: PublicBookingService, useValue: publicBookingService },
        {
          provide: AccountingIntegrationService,
          useValue: accountingIntegrationService,
        },
        { provide: CommissionsService, useValue: commissionsService },
        {
          provide: ServiceSubscriptionsService,
          useValue: subscriptionsService,
        },
        {
          provide: ServiceService,
          useValue: { update: jest.fn(async (id, dto) => ({ id, ...dto })) },
        },
        {
          provide: BookingPaymentService,
          useValue: {
            confirmCheckoutSession: jest.fn(async () => ({ booking: {} })),
          },
        },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(GiftCard), useValue: giftCardRepo },
      ],
    }).compile();

    payments = module.get(AiPaymentsService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('rescue', () => {
    it('rescues payments intents before schedule/resource rescue', () => {
      expect(
        payments.rescuePaymentsIntent('Summarize unpaid bookings', 'unknown')
          ?.action,
      ).toBe('summarize_unpaid');
      expect(
        rescue.rescue({
          prompt:
            'Accept online payment on public booking for all services with 50% prepayment',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_service_online_payment');
      expect(
        rescue.rescue({
          prompt: 'Decline online payment on public booking for all services',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_service_online_payment');
      expect(
        rescue.rescue({
          prompt: 'Which services require prepayment on public booking?',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_service_online_payment_setup');
      expect(
        rescue.rescue({
          prompt: 'Who is available tomorrow evening for massage',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('check_providers_for_service');
      const compoundUnknown = rescue.rescue({
        prompt:
          'Check who is available tomorrow evening for massage and book the nearest slot',
        action: 'unknown',
        params: {},
      });
      expect(compoundUnknown?.rescued).toBe(true);
      expect(
        payments.rescuePaymentsIntent(
          'Check who is available tomorrow evening for massage and book the nearest slot',
          'compound_intent',
        )?.action,
      ).toBe('check_providers_for_service');
    });
  });

  describe('handlers', () => {
    it('runs dashboard payment handlers', async () => {
      expect((await payments.handleSummarizeUnpaid('biz-1', {})).success).toBe(
        true,
      );
      expect(
        (
          await payments.handleValidateGiftCard('biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      expect((await payments.handleExportAccounting('biz-1', {})).success).toBe(
        true,
      );
      expect(
        (await payments.handleExportCommissions('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await payments.handleExplainCheckoutTotal('biz-1', {
            serviceName: 'Massage',
          })
        ).success,
      ).toBe(true);
      expect(
        (await payments.handleListSubscriptionRevenue('biz-1', {})).success,
      ).toBe(true);
      expect(
        (
          await payments.handleExplainServiceOnlinePaymentSetup(
            'biz-1',
            {},
            'Explain service online payment setup',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleExplainPublicBookingCheckout(
            'biz-1',
            {},
            'Explain public booking checkout payment options',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleAuditServicesMissingOnlinePayment(
            'biz-1',
            {},
            "Which services still don't accept online payment?",
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleConfigureCashPayments('biz-1', {
            acceptCashPayments: true,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleAdjustGiftCardBalance('biz-1', {
            giftCardId: 'gc-1',
            delta: 10,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleExtendGiftCardExpiry('biz-1', {
            giftCardId: 'gc-1',
            extendMonths: 3,
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleRefundGiftCardOrder('biz-1', {
            giftCardId: 'gc-1',
            reason: 'Customer changed their mind',
          })
        ).success,
      ).toBe(true);
    });

    it('runs provider and customer payment handlers', async () => {
      expect(
        (
          await payments.handleExplainPaymentStatus('biz-1', {
            bookingId: 'b1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleCollectCashConfirm(
            'biz-1',
            { bookingId: 'b1' },
            'p1',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleCheckProvidersForService(
            'biz-1',
            { serviceName: 'Massage' },
            'tomorrow evening',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleBookNearestSlot(
            'biz-1',
            { serviceName: 'Massage' },
            'tomorrow evening',
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleApplyGiftCardCode('biz-1', {
            giftCardCode: 'GCM-ABCD1234',
            serviceName: 'Massage',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await payments.handleCheckGiftCardBalance('biz-1', {
            giftCardCode: 'GCM-ABCD1234',
          })
        ).success,
      ).toBe(true);
      expect(
        (await payments.handleBuyGiftCard('biz-1', { amount: 50 })).success,
      ).toBe(true);
      expect(
        (await payments.handleBuyGiftCard('biz-1', { amount: 50 }, true))
          .success,
      ).toBe(true);
      expect((await payments.handleChoosePaymentMethod('biz-1')).success).toBe(
        true,
      );
      expect(
        (
          await payments.handlePayOnline('biz-1', {
            serviceId: 's1',
            employeeId: 'e1',
            startTime: '2026-06-06T18:00:00Z',
          })
        ).success,
      ).toBe(true);
      expect((await payments.handlePayCashAtVisit('biz-1')).success).toBe(true);
      expect(
        (
          await payments.handlePurchaseSubscriptionCheckout('biz-1', {
            planId: 'plan-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (await payments.handleExplainWhyStripeRequired('biz-1')).success,
      ).toBe(true);
      expect(
        (await payments.handleReceiptStatus('biz-1', { bookingId: 'b1' }))
          .success,
      ).toBe(true);
    });
  });

  describe('compound', () => {
    it('completes payments compound flow with context between steps', async () => {
      const result = await payments.handlePaymentsCompound(
        'biz-1',
        'Check who is available tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234',
        { giftCardCode: 'GCM-ABCD1234' },
        'cust-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).paymentsCompound).toBe(true);
      expect((result.details as any).steps.length).toBeGreaterThanOrEqual(2);
    });

    it('stops compound on failure', async () => {
      const stopped = await payments.handlePaymentsCompound(
        'biz-1',
        'Book nearest slot and apply gift card',
        {
          compoundSteps: [
            { action: 'book_nearest_slot', params: {}, segment: 'book' },
            {
              action: 'apply_gift_card_code',
              params: { giftCardCode: 'GCM-ABCD1234' },
              segment: 'apply',
            },
          ],
        },
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('book_nearest_slot');
    });
  });
});
