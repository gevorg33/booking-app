import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { CommandReasoningService } from './command-reasoning.service.js';
import {
  handleCheckProvidersForServiceLogic,
  handlePaymentsCompoundLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';

const services = [
  { id: 's1', name: 'Massage', businessId: 'biz-1', price: 80, isActive: true },
  {
    id: 's2',
    name: 'Permanent lips',
    businessId: 'biz-1',
    price: 120,
    isActive: true,
  },
] as any[];

function buildDeps(
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
            role: 'Cosmetologist',
            averageRating: null,
            reviewCount: 0,
            earliestDateKey: '2026-06-06',
            earliestStartTime: '14:00',
            previewTimes: ['14:00', '14:30'],
            matchedServiceId: 's2',
            matchedServiceName: 'Permanent lips',
          },
        ],
      })),
      findNearestBookableSlot: jest.fn(async () => ({
        startTime: '2026-06-06T14:00:00Z',
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
      find: jest.fn(async ({ where }: any = {}) => {
        if (where?.businessId) {
          return services.filter(
            (service) =>
              service.businessId === where.businessId &&
              (where.isActive === undefined ||
                service.isActive === where.isActive),
          );
        }
        return services;
      }),
      findOne: jest.fn(async ({ where }: any) =>
        services.find((service) => service.id === where.id),
      ),
    } as any,
    giftCardRepo: {} as any,
    ...overrides,
  };
}

describe('ai provider availability integration', () => {
  describe('handleCheckProvidersForServiceLogic', () => {
    it('returns structured availability for a matched service and date', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps(),
        'biz-1',
        { serviceName: 'Permanent lips', date: '2026-06-06' },
        'tomorrow afternoon',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('check_providers_for_service');
      expect(result.summary).toContain('Karo Mazmanyan');
      expect(result.summary).toContain('14:00, 14:30');
      expect(result.details?.availableProviders).toEqual(['Karo Mazmanyan']);
      expect(result.details?.availability).toEqual([
        expect.objectContaining({
          id: 'e1',
          name: 'Karo Mazmanyan',
          previewTimes: ['14:00', '14:30'],
        }),
      ]);
      expect(result.details?.serviceName).toBe('Permanent lips');
      expect(result.details?.date).toBe('2026-06-09');
    });

    it('requires a service name', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps(),
        'biz-1',
        {},
        'who is available tomorrow afternoon',
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
      expect(result.details?.missing).toContain('serviceName');
    });

    it('fails when business slug cannot be resolved', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps({
          businessRepo: { findOne: jest.fn(async () => null) } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
      );

      expect(result.success).toBe(false);
      expect(result.summary).toContain('Business not found');
    });

    it('normalizes DD/MM classifier dates before querying slots', async () => {
      const recommendProviders = jest.fn(async () => ({
        providers: [
          {
            id: 'e1',
            name: 'Jujo Karapetyan',
            earliestDateKey: '2026-06-09',
            earliestStartTime: '2026-06-09T17:00:00.000Z',
            previewTimes: ['17:00', '17:30', '18:00'],
            matchedServiceName: 'Massage',
          },
        ],
      }));
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: { recommendProviders } as any,
        }),
        'biz-1',
        {
          serviceName: 'Massage',
          date: '09/06/2026',
          timeOfDay: 'evening',
        },
        'which time is available evening for massage ?',
      );

      expect(recommendProviders).toHaveBeenCalledWith('salon', {
        serviceId: 's1',
        dateKeys: ['2026-06-09'],
        notBeforeTime: '17:00',
        limit: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.summary).toContain('Jujo Karapetyan');
      expect(result.details?.date).toBe('2026-06-09');
      expect(result.summary).toContain('17:00');
    });

    it('returns no-provider summary when recommendProviders is empty', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => ({ providers: [] })),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage', date: '2026-06-06' },
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('No providers are free');
      expect(result.summary).toMatch(/another date|time of day/i);
      expect(result.details?.availableProviders).toEqual([]);
      expect(result.details?.availability).toEqual([]);
    });

    it('handles sparse provider objects from recommendProviders', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => ({
              providers: [{ id: 'e1', name: 'Anna' }],
            })),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
        'tomorrow',
      );

      expect(result.success).toBe(true);
      expect(result.details?.availableProviders).toEqual(['Anna']);
      expect(result.summary).toContain('Anna — open');
    });

    it('surfaces recommendProviders failures', async () => {
      const result = await handleCheckProvidersForServiceLogic(
        buildDeps({
          publicBookingService: {
            recommendProviders: jest.fn(async () => {
              throw new Error('calendar down');
            }),
          } as any,
        }),
        'biz-1',
        { serviceName: 'Massage' },
      );

      expect(result.success).toBe(false);
      expect(result.summary).toContain('calendar down');
    });
  });

  describe('handlePaymentsCompoundLogic provider forwarding', () => {
    it('forwards provider availability from check_providers step into final details', async () => {
      const result = await handlePaymentsCompoundLogic(
        buildDeps(),
        'biz-1',
        'Check providers and book nearest slot',
        {
          compoundSteps: [
            {
              action: 'check_providers_for_service',
              params: { serviceName: 'Permanent lips', date: '2026-06-06' },
              segment: 'check',
            },
            {
              action: 'book_nearest_slot',
              params: { serviceName: 'Permanent lips', date: '2026-06-06' },
              segment: 'book',
            },
          ],
        },
      );

      expect(result.success).toBe(true);
      expect(result.details?.availableProviders).toEqual(['Karo Mazmanyan']);
      expect(result.details?.availability).toEqual([
        expect.objectContaining({ name: 'Karo Mazmanyan' }),
      ]);
      expect(result.details?.serviceName).toBe('Permanent lips');
      expect(result.details?.date).toBe('2026-06-06');
    });
  });

  describe('CommandCompletionPipelineService.attachSessionToResult', () => {
    const pipeline = new CommandCompletionPipelineService();

    it('stores availableProviders from details.availableProviders', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'check_providers_for_service',
          summary: 'ok',
          details: {
            availableProviders: ['Anna', 'Bob'],
            serviceName: 'Massage',
            date: '2026-06-06',
          },
        },
        {
          action: 'check_providers_for_service',
          params: {},
          enrichedParams: {},
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.availableProviders).toEqual([
        'Anna',
        'Bob',
      ]);
      expect(attached.details?.sessionContext?.serviceName).toBe('Massage');
      expect(attached.details?.sessionContext?.date).toBe('2026-06-06');
    });

    it('derives availableProviders from details.providers when names only exist there', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'check_providers_for_service',
          summary: 'ok',
          details: {
            providers: [{ id: 'e1', name: 'Karo Mazmanyan' }],
          },
        },
        {
          action: 'check_providers_for_service',
          params: {},
          enrichedParams: {},
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.availableProviders).toEqual([
        'Karo Mazmanyan',
      ]);
    });
  });

  describe('CommandReasoningService.enrichResult', () => {
    const openAi = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    const service = new CommandReasoningService(openAi as any);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('skips enrichment for failed or clarify results', async () => {
      const failed = await service.enrichResult('biz-1', 'prompt', {
        success: false,
        action: 'check_providers_for_service',
        summary: 'failed',
        details: {},
      });
      expect(failed.summary).toBe('failed');
      expect(openAi.completeJson).not.toHaveBeenCalled();

      const errorAction = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'error',
        summary: 'error',
        details: {},
      });
      expect(errorAction.summary).toBe('error');
      expect(openAi.completeJson).not.toHaveBeenCalled();

      const clarify = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'need more',
        details: { needsClarification: true },
      });
      expect(clarify.summary).toBe('need more');
      expect(openAi.completeJson).not.toHaveBeenCalled();
    });

    it('skips enrichment when OpenAI is unavailable', async () => {
      openAi.isAvailableForBusiness.mockResolvedValueOnce(false);

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'raw summary',
        details: { availableProviders: ['Anna'] },
      });

      expect(result.summary).toBe('raw summary');
      expect(openAi.completeJson).not.toHaveBeenCalled();
    });

    it('replaces summary while preserving provider details', async () => {
      openAi.completeJson.mockResolvedValueOnce({
        summary: 'Karo is available tomorrow at 14:00.',
        reasoning: 'Used provider availability payload.',
      });

      const result = await service.enrichResult(
        'biz-1',
        'find who is available tomorrow afternoon for permanent lips',
        {
          success: true,
          action: 'check_providers_for_service',
          summary: 'raw summary',
          details: {
            availability: [
              {
                id: 'e1',
                name: 'Karo Mazmanyan',
                previewTimes: ['14:00'],
              },
            ],
            availableProviders: ['Karo Mazmanyan'],
          },
        },
        { graphPath: 'single', subIntents: ['check_providers_for_service'] },
      );

      expect(result.summary).toBe('Karo is available tomorrow at 14:00.');
      expect(result.details?.langGraphReasoning).toBe(
        'Used provider availability payload.',
      );
      expect(result.details?.availableProviders).toEqual(['Karo Mazmanyan']);
      expect(openAi.completeJson).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(
          'Never tell the user to open a separate "provider list"',
        ),
        expect.stringContaining('Karo Mazmanyan'),
        expect.anything(),
      );
    });

    it('keeps the original summary when enrichment returns blank text', async () => {
      openAi.completeJson.mockResolvedValueOnce({
        summary: '   ',
        reasoning: '',
      });

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'original summary',
        details: {},
      });

      expect(result.summary).toBe('original summary');
    });

    it('keeps the original summary when enrichment throws', async () => {
      openAi.completeJson.mockRejectedValueOnce(new Error('timeout'));

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'original summary',
        details: {},
      });

      expect(result.summary).toBe('original summary');
    });

    it('enriches using availableProviders fallback payload', async () => {
      openAi.completeJson.mockResolvedValueOnce({
        summary: 'Anna is available.',
        reasoning: 'names only',
      });

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'raw summary',
        details: {
          availableProviders: ['Anna'],
        },
      });

      expect(result.summary).toBe('Anna is available.');
      expect(openAi.completeJson).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.stringContaining('["Anna"]'),
        expect.anything(),
      );
    });

    it('enriches using providers fallback and omits optional reasoning metadata', async () => {
      openAi.completeJson.mockResolvedValueOnce({
        summary: 'Anna can take Massage at 15:00.',
      });

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'raw summary',
        details: {
          providers: [{ id: 'e1', name: 'Anna', previewTimes: ['15:00'] }],
        },
      });

      expect(result.summary).toBe('Anna can take Massage at 15:00.');
      expect(result.details?.langGraphReasoning).toBeUndefined();
      expect(result.details?.langGraphPath).toBeUndefined();
      expect(openAi.completeJson).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.stringContaining('Sub-intents: none'),
        expect.anything(),
      );
    });

    it('keeps the original summary when enrichment throws a non-error value', async () => {
      openAi.completeJson.mockRejectedValueOnce('offline');

      const result = await service.enrichResult('biz-1', 'prompt', {
        success: true,
        action: 'check_providers_for_service',
        summary: 'original summary',
        details: {},
      });

      expect(result.summary).toBe('original summary');
    });
  });
});
