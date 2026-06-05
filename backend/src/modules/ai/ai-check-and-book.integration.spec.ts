import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  handleCheckProvidersForServiceLogic,
  handleBookNearestSlotLogic,
  handlePaymentsCompoundLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';
import {
  decomposePaymentsCompoundPrompt,
  isCheckProvidersForServicePrompt,
  isPaymentsCompoundPrompt,
} from './ai-payments.util.js';
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
import { SIMILAR_CHECK_AND_BOOK_PROMPTS } from './ai-check-and-book.fixtures.js';

const services = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
  },
  {
    id: 's2',
    name: 'Permanent lips',
    businessId: 'biz-1',
    price: 120,
    isActive: true,
  },
  {
    id: 's3',
    name: 'Permanent lashes',
    businessId: 'biz-1',
    price: 110,
    isActive: true,
  },
] as any[];

const CHECK_AND_BOOK_PROMPTS = [
  {
    id: 'free-comma-nearest-slot',
    prompt:
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
    serviceName: 'permanent lashes',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'available-and-nearest-slot',
    prompt:
      'Who is available tomorrow evening for massage and book the nearest slot',
    serviceName: 'massage',
    notBeforeTime: '17:00',
    timeOfDay: 'evening',
  },
  {
    id: 'open-and-book-nearest',
    prompt:
      'who is open tomorrow morning for massage and book the nearest appointment',
    serviceName: 'massage',
    notBeforeTime: '00:00',
    timeOfDay: 'morning',
  },
  {
    id: 'check-providers-comma-book',
    prompt:
      'check providers for permanent lips tomorrow afternoon, book nearest slot',
    serviceName: 'permanent lips',
    notBeforeTime: '12:00',
    timeOfDay: 'afternoon',
  },
  {
    id: 'quoted-service-and-book',
    prompt:
      'check who is free tomorrow for "Permanent lashes" and book the nearest slot',
    serviceName: 'Permanent lashes',
    notBeforeTime: null,
    timeOfDay: null,
  },
  {
    id: 'asap-booking-wording',
    prompt:
      'check who is available tomorrow for massage and book first available slot',
    serviceName: 'massage',
    notBeforeTime: null,
    timeOfDay: null,
  },
] as const;

const ALL_CHECK_AND_BOOK_PROMPTS = [
  ...CHECK_AND_BOOK_PROMPTS,
  ...SIMILAR_CHECK_AND_BOOK_PROMPTS,
];

function buildLogicDeps(
  overrides: Partial<PaymentsLogicDeps> = {},
): PaymentsLogicDeps {
  return {
    giftCardsService: {} as any,
    giftCardPurchaseService: {} as any,
    giftCardOrderService: {} as any,
    giftCardRefundService: {} as any,
    publicBookingService: {
      recommendProviders: jest.fn(async () => ({
        providers: [
          {
            id: 'e1',
            name: 'Karo Mazmanyan',
            previewTimes: ['17:00', '17:30', '18:00'],
            matchedServiceId: 's3',
            matchedServiceName: 'Permanent lashes',
          },
        ],
      })),
      findNearestBookableSlot: jest.fn(async () => ({
        startTime: '2026-06-06T17:00:00Z',
        employeeId: 'e1',
        employeeName: 'Karo Mazmanyan',
      })),
    } as any,
    accountingIntegrationService: {} as any,
    commissionsService: {} as any,
    subscriptionsService: {} as any,
    bookingRepo: {} as any,
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
    } as any,
    serviceRepo: {
      find: jest.fn(async ({ where }: any = {}) =>
        services.filter(
          (service) =>
            service.businessId === where?.businessId &&
            (where?.isActive === undefined || service.isActive === where.isActive),
        ),
      ),
      findOne: jest.fn(async ({ where }: any) =>
        services.find((service) => service.id === where.id),
      ),
    } as any,
    giftCardRepo: {} as any,
    ...overrides,
  };
}

function resolvedCreateBooking(
  params: Record<string, unknown>,
  serviceId = 's3',
): ResolvedCommand {
  return {
    action: 'create_booking',
    params,
    enrichedParams: { serviceId, allProviders: true },
    entities: {
      service: { id: serviceId, name: 'Permanent lashes' } as any,
      employees: [],
    },
    reasoning: 'test',
    confidence: 0.9,
  };
}

describe('ai check-and-book integration', () => {
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
  };
  const publicBookingService = {
    recommendProviders: jest.fn(async () => ({
      providers: [
        {
          id: 'e1',
          name: 'Karo Mazmanyan',
          previewTimes: ['17:00', '17:30', '18:00'],
        },
      ],
    })),
    findNearestBookableSlot: jest.fn(async () => ({
      startTime: '2026-06-06T17:00:00Z',
      employeeId: 'e1',
      employeeName: 'Karo Mazmanyan',
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
  };
  const serviceRepo = {
    find: jest.fn(async () => services),
    findOne: jest.fn(async ({ where }: any) =>
      services.find((service) => service.id === where.id),
    ),
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
        { provide: GiftCardPurchaseService, useValue: {} },
        { provide: GiftCardOrderService, useValue: {} },
        { provide: GiftCardRefundService, useValue: {} },
        { provide: PublicBookingService, useValue: publicBookingService },
        { provide: AccountingIntegrationService, useValue: {} },
        { provide: CommissionsService, useValue: {} },
        { provide: ServiceSubscriptionsService, useValue: {} },
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
    it.each(ALL_CHECK_AND_BOOK_PROMPTS)(
      'detects compound check+book for $id',
      ({ prompt, serviceName, notBeforeTime, timeOfDay }) => {
        expect(isCheckProvidersForServicePrompt(prompt)).toBe(true);
        expect(isPaymentsCompoundPrompt(prompt)).toBe(true);

        const steps = decomposePaymentsCompoundPrompt(prompt);
        expect(steps.map((step) => step.action)).toEqual([
          'check_providers_for_service',
          'book_nearest_slot',
        ]);
        expect(steps[0]?.params.serviceName).toBe(serviceName);
        expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
        if (notBeforeTime) {
          expect(steps[0]?.params.notBeforeTime).toBe(notBeforeTime);
          expect(steps[1]?.params.notBeforeTime).toBe(notBeforeTime);
        }
        if (timeOfDay) {
          expect(steps[0]?.params.timeOfDay).toBe(timeOfDay);
        }
      },
    );

    it('decomposes check-only prompts with free wording', () => {
      const prompt = 'check who is free tomorrow evening for permanent lashes';
      expect(isCheckProvidersForServicePrompt(prompt)).toBe(true);
      expect(isPaymentsCompoundPrompt(prompt)).toBe(false);

      const steps = decomposePaymentsCompoundPrompt(prompt);
      expect(steps).toHaveLength(1);
      expect(steps[0]?.action).toBe('check_providers_for_service');
      expect(steps[0]?.params.serviceName).toBe('permanent lashes');
      expect(steps[0]?.params.notBeforeTime).toBe('17:00');
    });

    it('decomposes book-only nearest slot prompts', () => {
      const prompt = 'book the nearest slot for massage tomorrow evening';
      const steps = decomposePaymentsCompoundPrompt(prompt);
      expect(steps).toHaveLength(1);
      expect(steps[0]?.action).toBe('book_nearest_slot');
      expect(steps[0]?.params.bookingFirstAvailable).toBe(true);
      expect(steps[0]?.params.serviceName).toBe('massage');
    });

    it('keeps three-step compounds when gift card follows check+book', () => {
      const prompt =
        'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234';
      const steps = decomposePaymentsCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
        'apply_gift_card_code',
      ]);
    });

    it('does not treat unrelated prompts as check+book compound', () => {
      expect(isPaymentsCompoundPrompt('Summarize unpaid bookings')).toBe(false);
      expect(decomposePaymentsCompoundPrompt('hello world')).toEqual([]);
    });
  });

  describe('intent rescue', () => {
    it.each([
      [
        'unknown-free-check',
        'check who is free tomorrow evening for permanent lashes',
        'unknown',
        'check_providers_for_service',
      ],
      [
        'create_booking-nearest-slot',
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        'create_booking',
        'create_booking',
      ],
      [
        'compound_intent-first-step',
        'Who is available tomorrow evening for massage and book the nearest slot',
        'compound_intent',
        'check_providers_for_service',
      ],
    ] as const)(
      'rescues %s to the expected action',
      (_id, prompt, action, expected) => {
        const result =
          action === 'compound_intent'
            ? payments.rescuePaymentsIntent(prompt, action)
            : rescue.rescue({ prompt, action, params: {}, employees: [] });

        expect(result?.action).toBe(expected);
        if (action === 'create_booking') {
          expect(result?.params?.bookingFirstAvailable).toBe(true);
          expect(result?.params?.timeSlot).toBeUndefined();
          expect(result?.params?.allProviders).toBe(true);
          expect(result?.params?.timeOfDay).toBe('evening');
          expect(result?.rescueReason).toBe('check_and_book_compound');
        }
      },
    );
  });

  describe('create_booking validation without fixed start time', () => {
    it.each([
      'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      'Book the nearest available slot for massage tomorrow',
      'Book first available permanent lashes tomorrow evening',
    ])('passes validation when prompt says nearest/first available: %s', (prompt) => {
      const params: Record<string, unknown> = {
        serviceName: 'Permanent lashes',
        date: '2026-06-06',
        allProviders: true,
      };
      enrichBookingTimeHintsFromPrompt('create_booking', params, prompt);

      const validation = validateCommand(resolvedCreateBooking(params));
      expect(validation.ok).toBe(true);
      expect(params.bookingFirstAvailable).toBe(true);
      expect(validation.issues.some((issue) => issue.field === 'timeSlot')).toBe(
        false,
      );
    });

    it('still requires start time when no nearest/first-available wording is present', () => {
      const params: Record<string, unknown> = {
        serviceName: 'Permanent lashes',
        date: '2026-06-06',
        allProviders: true,
      };
      enrichBookingTimeHintsFromPrompt(
        'create_booking',
        params,
        'book permanent lashes tomorrow evening',
      );

      const validation = validateCommand(resolvedCreateBooking(params));
      expect(validation.ok).toBe(false);
      expect(validation.issues.some((issue) => issue.field === 'timeSlot')).toBe(
        true,
      );
    });
  });

  describe('check providers handler', () => {
    it('passes evening notBeforeTime to recommendProviders', async () => {
      const deps = buildLogicDeps();
      await handleCheckProvidersForServiceLogic(
        deps,
        'biz-1',
        { serviceName: 'Permanent lashes', date: '2026-06-06' },
        'tomorrow evening',
      );

      expect(deps.publicBookingService.recommendProviders).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({
          serviceId: 's3',
          dateKeys: ['2026-06-06'],
          notBeforeTime: '17:00',
        }),
      );
    });

    it('returns provider list payload for free wording prompt', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildLogicDeps(),
        'biz-1',
        {
          serviceName: 'permanent lashes',
          date: '2026-06-06',
          notBeforeTime: '17:00',
        },
        'check who is free tomorrow evening for permanent lashes',
      );

      expect(result.success).toBe(true);
      expect(result.details?.availableProviders).toEqual(['Karo Mazmanyan']);
      expect(result.details?.availability?.[0]?.previewTimes).toEqual([
        '17:00',
        '17:30',
        '18:00',
      ]);
      expect(result.details?.notBeforeTime).toBe('17:00');
    });

    it('clarifies when service is missing', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildLogicDeps(),
        'biz-1',
        {},
        'check who is free tomorrow evening',
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
      expect(result.details?.missing).toContain('serviceName');
    });
  });

  describe('book nearest slot handler', () => {
    it('uses evening lower bound from params', async () => {
      const deps = buildLogicDeps();
      await handleBookNearestSlotLogic(
        deps,
        'biz-1',
        {
          serviceName: 'Permanent lashes',
          date: '2026-06-06',
          notBeforeTime: '17:00',
          employeeId: 'e1',
        },
        'book the nearest slot',
      );

      expect(deps.publicBookingService.findNearestBookableSlot).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({
          serviceId: 's3',
          employeeId: 'e1',
          notBeforeTime: '17:00',
          startDateKey: '2026-06-06',
        }),
      );
    });

    it('fails clearly when no slot exists', async () => {
      const result = await handleBookNearestSlotLogic(
        buildLogicDeps({
          publicBookingService: {
            findNearestBookableSlot: jest.fn(async () => null),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage', date: '2026-06-06' },
        'book nearest slot',
      );

      expect(result.success).toBe(false);
      expect(result.summary).toContain('No bookable slot found');
    });
  });

  describe('payments compound end-to-end', () => {
    it.each(ALL_CHECK_AND_BOOK_PROMPTS)(
      'completes compound flow for $id without start-time clarify',
      async ({ prompt }) => {
        const result = await payments.handlePaymentsCompound('biz-1', prompt, {});

        expect(result.success).toBe(true);
        expect(result.action).toBe('compound_intent');
        expect((result.details as any).paymentsCompound).toBe(true);
        expect((result.details as any).availableProviders).toEqual([
          'Karo Mazmanyan',
        ]);
        expect((result.details as any).steps).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: 'check_providers_for_service' }),
            expect.objectContaining({ action: 'book_nearest_slot' }),
          ]),
        );
        expect(publicBookingService.recommendProviders).toHaveBeenCalled();
        expect(publicBookingService.findNearestBookableSlot).toHaveBeenCalled();
      },
    );

    it('forwards provider context from check step into book step', async () => {
      const deps = buildLogicDeps();
      const result = await handlePaymentsCompoundLogic(
        deps,
        'biz-1',
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        {},
      );

      expect(result.success).toBe(true);
      expect(deps.publicBookingService.findNearestBookableSlot).toHaveBeenCalledWith(
        'salon',
        expect.objectContaining({ employeeId: 'e1', serviceId: 's3' }),
      );
      expect(result.details?.serviceName).toBe('Permanent lashes');
      expect(result.details?.date).toBeTruthy();
    });

    it('stops compound when book step cannot find a slot', async () => {
      const result = await handlePaymentsCompoundLogic(
        buildLogicDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => ({
              providers: [{ id: 'e1', name: 'Anna' }],
            })),
            findNearestBookableSlot: jest.fn(async () => null),
          } as any,
        }),
        'biz-1',
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        {},
      );

      expect(result.success).toBe(false);
      expect((result.details as any).failedStep).toBe('book_nearest_slot');
      expect((result.details as any).steps).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
      ]);
    });

    it('returns empty provider list when nobody is available', async () => {
      const result = await handlePaymentsCompoundLogic(
        buildLogicDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => ({ providers: [] })),
            findNearestBookableSlot: jest.fn(async () => ({
              startTime: '2026-06-06T17:00:00Z',
              employeeId: 'e1',
              employeeName: 'Karo Mazmanyan',
            })),
          } as any,
        }),
        'biz-1',
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
        {},
      );

      expect(result.success).toBe(true);
      expect(result.details?.availableProviders).toEqual([]);
      expect(result.details?.availability).toEqual([]);
    });

    it('completes three-step compound with gift card after check+book', async () => {
      const result = await payments.handlePaymentsCompound(
        'biz-1',
        'Check who is free tomorrow evening for massage and book the nearest slot and apply my gift card GCM-ABCD1234',
        { giftCardCode: 'GCM-ABCD1234' },
      );

      expect(result.success).toBe(true);
      expect((result.details as any).steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'check_providers_for_service' }),
          expect.objectContaining({ action: 'book_nearest_slot' }),
          expect.objectContaining({ action: 'apply_gift_card_code' }),
        ]),
      );
    });
  });

  describe('session context after compound check step', () => {
    const pipeline = new CommandCompletionPipelineService();

    it('stores provider names from compound check step for follow-up turns', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'compound_intent',
          summary: 'done',
          details: {
            availableProviders: ['Karo Mazmanyan'],
            availability: [{ id: 'e1', name: 'Karo Mazmanyan' }],
            serviceName: 'Permanent lashes',
            date: '2026-06-06',
          },
        },
        {
          action: 'compound_intent',
          params: {},
          enrichedParams: {},
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.availableProviders).toEqual([
        'Karo Mazmanyan',
      ]);
      expect(attached.details?.sessionContext?.serviceName).toBe(
        'Permanent lashes',
      );
    });
  });
});
