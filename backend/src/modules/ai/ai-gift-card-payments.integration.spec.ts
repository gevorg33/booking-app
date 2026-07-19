import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { attachPublicBookingNearestAcrossWindowsMock } from './ai-nearest-slot-resolver.util.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import {
  applyGiftCardPaymentsPromptHints,
  decomposeGiftCardPaymentsCompoundPrompt,
  disambiguateGiftCardPaymentsAction,
  isGiftCardCheckoutCompoundPrompt,
  isGiftCardPaymentsCompoundPrompt,
  isPhysicalGiftCardHandoffCompoundPrompt,
} from './ai-gift-card-payments-hints.util.js';
import {
  ALL_GIFT_CARD_CHECKOUT_PROMPTS,
  GIFT_CARD_CHECKOUT_PROMPTS,
  GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS,
} from './ai-gift-card-payments.fixtures.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';
import {
  decomposePaymentsCompoundPrompt,
  isPaymentsCompoundPrompt,
} from './ai-payments.util.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
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

const services = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
  },
  {
    id: 's2',
    name: 'Facial',
    businessId: 'biz-1',
    price: 60,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
  },
] as any[];

describe('ai gift card checkout integration (ai-cmd-h4.1)', () => {
  const giftCardsService = {
    validate: jest.fn(async (code: string) => ({
      id: 'gc-1',
      code: code || 'GCM-ABCD1234',
    })),
    getBalanceView: jest.fn(async (code?: string) => ({
      id: 'gc-1',
      code: code || 'GCM-ABCD1234',
      cardType: 'monetary',
      balance: 50,
      currency: 'USD',
      expiresAt: null,
      isActive: true,
      serviceCredits: [],
    })),
  };
  const publicBookingService = {
    recommendProviders: jest.fn(async () => ({
      providers: [
        {
          id: 'e1',
          name: 'Anna Kim',
          previewTimes: ['14:00', '15:00'],
        },
      ],
    })),
    findNearestBookableSlot: jest.fn(async () => ({
      startTime: '2026-08-07T14:00:00Z',
      employeeId: 'e1',
      employeeName: 'Anna Kim',
    })),
  };
  attachPublicBookingNearestAcrossWindowsMock(publicBookingService);
  const checkoutBusiness = {
    id: 'biz-1',
    slug: 'salon',
    settings: {
      publicBooking: { acceptCashPayments: true },
      integrations: { stripe: { connectAccountId: 'acct_test' } },
    },
  };
  const businessRepo = {
    findOne: jest.fn(async () => checkoutBusiness),
  };
  const serviceRepo = {
    find: jest.fn(async () => services),
    findOne: jest.fn(async ({ where }: any) =>
      services.find((s) => s.id === where.id),
    ),
  };

  const pipeline = new CommandCompletionPipelineService();
  let payments: AiPaymentsService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiPaymentsService,
        AiIntentRescueService,
        { provide: GiftCardsService, useValue: giftCardsService },
        { provide: GiftCardPurchaseService, useValue: {} },
        { provide: GiftCardOrderService, useValue: {} },
        { provide: GiftCardRefundService, useValue: {} },
        { provide: PublicBookingService, useValue: publicBookingService },
        { provide: AccountingIntegrationService, useValue: {} },
        { provide: CommissionsService, useValue: {} },
        { provide: ServiceSubscriptionsService, useValue: {} },
        { provide: ServiceService, useValue: { update: jest.fn() } },
        {
          provide: BookingPaymentService,
          useValue: {
            confirmCheckoutSession: jest.fn(async () => ({ booking: {} })),
          },
        },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(GiftCard), useValue: {} },
      ],
    }).compile();

    payments = module.get(AiPaymentsService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('prompt detection and decomposition', () => {
    it.each(ALL_GIFT_CARD_CHECKOUT_PROMPTS)(
      'detects gift-card checkout compound for $id',
      ({ prompt, orderedActions, giftCardCode, serviceName }) => {
        expect(isGiftCardCheckoutCompoundPrompt(prompt)).toBe(true);
        expect(isGiftCardPaymentsCompoundPrompt(prompt)).toBe(true);

        const steps = decomposeGiftCardPaymentsCompoundPrompt(prompt);
        expect(steps.map((s) => s.action)).toEqual(orderedActions);
        if (giftCardCode) {
          const applyStep = steps.find(
            (s) => s.action === 'apply_gift_card_code',
          );
          expect(applyStep?.params.giftCardCode).toBe(giftCardCode);
        }
        if (serviceName) {
          const bookStep = steps.find(
            (s) =>
              s.action === 'book_nearest_slot' ||
              s.action === 'check_providers_for_service',
          );
          expect(bookStep?.params.serviceName).toBe(serviceName);
        }
      },
    );

    it.each(GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS)(
      'detects physical gift card handoff for $id',
      ({ prompt, orderedActions, amount }) => {
        expect(isPhysicalGiftCardHandoffCompoundPrompt(prompt)).toBe(true);
        const steps = decomposeGiftCardPaymentsCompoundPrompt(prompt);
        expect(steps.map((s) => s.action)).toEqual([...orderedActions]);
        expect(steps[0]?.params.amount).toBe(amount);
        expect(steps[0]?.params.deliveryMethod).toBe('physical');
      },
    );

    it('matches golden customer gift-card checkout pattern', () => {
      const prompt = GIFT_CARD_CHECKOUT_PROMPTS[0].prompt;
      const golden = matchGoldenCompoundPattern('customer', prompt);
      expect(golden?.recipeId).toBe('customer_gift_card_payments_compound');
      expect(golden?.steps.map((s) => s.action)).toEqual(
        GIFT_CARD_CHECKOUT_PROMPTS[0].orderedActions,
      );
    });

    it('decomposes three-step check+book+apply checkout', () => {
      const prompt =
        'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234';
      expect(isPaymentsCompoundPrompt(prompt)).toBe(true);
      const steps = decomposeGiftCardPaymentsCompoundPrompt(prompt);
      expect(steps.map((s) => s.action)).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
        'apply_gift_card_code',
      ]);
      expect(steps[2]?.params.giftCardCode).toBe('GCM-ABCD1234');
    });

    it('does not treat unrelated prompts as gift-card checkout compound', () => {
      expect(isGiftCardCheckoutCompoundPrompt('Summarize unpaid')).toBe(false);
      expect(decomposeGiftCardPaymentsCompoundPrompt('hello world')).toEqual(
        [],
      );
    });
  });

  describe('intent rescue', () => {
    it.each([
      [
        'create_booking-checkout',
        'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234',
        'create_booking',
        'book_nearest_slot',
        'create_booking_to_nearest_slot',
      ],
      [
        'buy_gift_card-physical',
        'Buy physical gift card $75',
        'buy_gift_card',
        'buy_gift_card_physical',
        // Budget misroute uses action as rescueReason; payments path uses physical_gift_card.
        'buy_gift_card_physical',
      ],
      [
        'apply_gift_card-checkout',
        'Apply gift card GCM-TEST at checkout',
        'unknown',
        'apply_gift_card_code',
        'apply_gift_card_checkout',
      ],
    ] as const)(
      'rescues %s to expected action',
      (_id, prompt, action, expected, rescueReason) => {
        const fromRescue = rescue.rescue({
          prompt,
          action,
          params: {},
          employees: [],
        });
        const fromDisambiguate = disambiguateGiftCardPaymentsAction(
          prompt,
          action,
        );
        const result =
          fromRescue?.action === expected
            ? fromRescue
            : fromDisambiguate?.action === expected
              ? {
                  action: expected,
                  rescueReason: fromDisambiguate.rescueReason,
                }
              : fromRescue;

        expect(result?.action).toBe(expected);
        if (fromRescue?.action === expected) {
          expect(fromRescue.rescueReason).toBe(rescueReason);
        }
      },
    );
  });

  describe('gift-card checkout compound end-to-end', () => {
    it.each(
      ALL_GIFT_CARD_CHECKOUT_PROMPTS.filter(
        (p) =>
          p.orderedActions.includes('book_nearest_slot') &&
          !p.orderedActions.includes('check_providers_for_service') &&
          p.orderedActions.length === 2,
      ),
    )(
      'completes two-step book+apply compound for $id',
      async ({ prompt, giftCardCode }) => {
        const result = await payments.handlePaymentsCompound('biz-1', prompt, {
          giftCardCode,
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('compound_intent');
        expect((result.details as any).paymentsCompound).toBe(true);
        expect((result.details as any).steps).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: 'book_nearest_slot' }),
            expect.objectContaining({ action: 'apply_gift_card_code' }),
          ]),
        );
        expect(publicBookingService.findNearestBookableSlot).toHaveBeenCalled();
      },
    );

    it.each(
      ALL_GIFT_CARD_CHECKOUT_PROMPTS.filter(
        (p) =>
          p.orderedActions.includes('book_nearest_slot') &&
          !p.orderedActions.includes('check_providers_for_service') &&
          p.orderedActions.length > 2,
      ),
    )(
      'completes book+apply+payment compound for $id',
      async ({ prompt, giftCardCode, orderedActions }) => {
        const result = await payments.handlePaymentsCompound('biz-1', prompt, {
          giftCardCode,
        });

        expect(result.success).toBe(true);
        expect(result.action).toBe('compound_intent');
        expect((result.details as any).steps).toEqual(
          expect.arrayContaining(
            orderedActions.map((action) => expect.objectContaining({ action })),
          ),
        );
      },
    );

    it('completes three-step check+book+apply compound', async () => {
      const prompt =
        'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234';
      const result = await payments.handlePaymentsCompound('biz-1', prompt, {
        giftCardCode: 'GCM-ABCD1234',
      });

      expect(result.success).toBe(true);
      expect((result.details as any).steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'check_providers_for_service' }),
          expect.objectContaining({ action: 'book_nearest_slot' }),
          expect.objectContaining({ action: 'apply_gift_card_code' }),
        ]),
      );
      expect(publicBookingService.recommendProviders).toHaveBeenCalled();
      expect(publicBookingService.findNearestBookableSlot).toHaveBeenCalled();
    });

    it('stops compound when book step cannot find a slot', async () => {
      publicBookingService.findNearestBookableSlot.mockResolvedValueOnce(null);
      const result = await payments.handlePaymentsCompound(
        'biz-1',
        'Book nearest slot for massage tomorrow and apply gift card GCM-ABCD1234',
        {},
      );

      expect(result.success).toBe(false);
      expect((result.details as any).failedStep).toBe('book_nearest_slot');
    });

    it('decomposes physical handoff deterministically on customer surface', () => {
      const prompt = GIFT_CARD_PHYSICAL_HANDOFF_PROMPTS[0].prompt;
      const deterministic = decomposeDeterministicForSurface(
        'customer',
        prompt,
      );
      expect(deterministic?.recipeId).toBe(
        'customer_gift_card_payments_compound',
      );
      expect(deterministic?.steps.map((s) => s.action)).toEqual([
        'buy_gift_card_physical',
        'track_physical_gift_card_order',
      ]);
    });
  });

  describe('session context after gift-card checkout steps', () => {
    it('inherits gift card code into apply follow-up after booking', () => {
      const merged = pipeline.mergeSessionContext(
        { giftCardCode: null, serviceName: null },
        {
          serviceName: 'massage',
          date: '07/06/2026',
          lastAction: 'book_nearest_slot',
        },
        'apply_gift_card_code',
      );
      applyGiftCardPaymentsPromptHints(
        'apply_gift_card_code',
        merged,
        'apply gift card GCM-TEST',
        { session: merged },
      );

      expect(merged.serviceName).toBe('massage');
      expect(merged.giftCardCode).toBe('GCM-TEST');
    });

    it('propagates giftCardCode across choose_payment follow-up', () => {
      const steps = decomposeGiftCardPaymentsCompoundPrompt(
        GIFT_CARD_CHECKOUT_PROMPTS[0].prompt,
      );
      const chooseStep = steps.find(
        (s) => s.action === 'choose_payment_method',
      );
      expect(chooseStep?.params.giftCardCode).toBe('GCM-ABCD1234');
    });

    it('stores checkout context from compound book step', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'compound_intent',
          summary: 'Booked nearest slot',
          details: {
            serviceName: 'massage',
            date: '07/06/2026',
            giftCardCode: 'GCM-ABCD1234',
          },
        },
        {
          action: 'compound_intent',
          params: { serviceName: 'massage', giftCardCode: 'GCM-ABCD1234' },
          enrichedParams: {},
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.serviceName).toBe('massage');
      expect(attached.details?.sessionContext?.giftCardCode).toBe(
        'GCM-ABCD1234',
      );
    });
  });
});
