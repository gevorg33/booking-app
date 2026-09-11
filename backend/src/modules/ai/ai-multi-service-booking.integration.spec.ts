import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import {
  applyPackageMultiServicePromptHints,
  decomposeDashboardPackageMultiServiceCompoundPrompt,
  disambiguateStaffPackageMultiBooking,
} from './ai-package-multi-service-hints.util.js';
import {
  ALL_MULTI_SERVICE_CHECKOUT_PROMPTS,
  MULTI_SERVICE_CHECKOUT_PROMPTS,
} from './ai-package-multi-service.fixtures.js';
import {
  handleCheckMultiServiceBlockAvailabilityLogic,
  type Sprint29ScheduleResourceLogicDeps,
} from './ai-schedule-resources.logic.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

const employees = [
  { id: 'e1', name: 'Anna Kim' },
  { id: 'e2', name: 'Gevorg Gasparyan' },
];
const customers = [
  { id: 'c1', name: 'Maria Lopez' },
  { id: 'c2', name: 'James' },
];

const services = [
  { id: 's-hair', name: 'Haircut', businessId: 'biz-1', isActive: true },
  { id: 's-beard', name: 'Beard trim', businessId: 'biz-1', isActive: true },
  { id: 's-color', name: 'Color', businessId: 'biz-1', isActive: true },
] as any[];

function buildScheduleDeps(
  overrides: Partial<Sprint29ScheduleResourceLogicDeps> = {},
): Sprint29ScheduleResourceLogicDeps {
  return {
    resourcesService: {} as any,
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        enabled: true,
        maxServiceCount: 3,
        schedulingMode: 'same_visit' as const,
      })),
    } as any,
    publicBookingService: {
      suggestMultiServiceBlock: jest.fn(async () => ({
        startTime: '2026-06-07T10:00:00Z',
        employeeId: 'e1',
        employeeName: 'Anna Kim',
      })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'salon' }),
      ),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
    } as any,
    ...overrides,
  };
}

describe('ai multi-service booking checkout integration (ai-cmd-h4.1)', () => {
  const pipeline = new CommandCompletionPipelineService();
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  describe('prompt detection and decomposition', () => {
    it('accumulates cart services before check step', () => {
      const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
        MULTI_SERVICE_CHECKOUT_PROMPTS[0].prompt,
        employees,
        customers,
      );
      expect(steps[0]?.params.serviceNames).toEqual(['haircut', 'beard trim']);
    });

    it('matches golden dashboard multi-service checkout pattern', () => {
      const prompt = MULTI_SERVICE_CHECKOUT_PROMPTS[0].prompt;
      const golden = matchGoldenCompoundPattern('dashboard', prompt);
      expect(golden?.recipeId).toBe('dashboard_package_multi_service_compound');
      expect(golden?.steps.map((s) => s.action)).toEqual([
        'check_multi_service_block_availability',
        'create_multi_service_booking',
      ]);
    });

    it('decomposes deterministically on dashboard surface', () => {
      const prompt = MULTI_SERVICE_CHECKOUT_PROMPTS[0].prompt;
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.steps.length).toBeGreaterThanOrEqual(2);
      expect(result?.steps[0]?.action).toBe(
        'check_multi_service_block_availability',
      );
    });
  });

  describe('intent rescue', () => {
    it.each([
      [
        'unknown-multi-service',
        'Book haircut and beard trim Tuesday 10am with Anna for Maria',
        'unknown',
        'create_multi_service_booking',
      ],
      [
        'create_booking-multi',
        'Book haircut and beard trim Tuesday 10am with Anna for Maria',
        'create_booking',
        'create_multi_service_booking',
      ],
    ] as const)(
      'rescues %s to create_multi_service_booking',
      (_id, prompt, action, expected) => {
        const result = rescue.rescue({
          prompt,
          action,
          params: {},
          employees,
          customers,
        });
        expect(result?.action).toBe(expected);
        expect(result?.params?.serviceNames).toEqual(['haircut', 'beard trim']);
      },
    );

    it('does not rescue unrelated dashboard admin phrasing', () => {
      expect(
        disambiguateStaffPackageMultiBooking(
          'Summarize revenue this week',
          'unknown',
        ),
      ).toBeNull();
    });
  });

  describe('check multi-service block handler', () => {
    it('returns block availability for resolved service ids', async () => {
      const deps = buildScheduleDeps();
      const result = await handleCheckMultiServiceBlockAvailabilityLogic(
        deps,
        'biz-1',
        { serviceNames: ['haircut', 'beard trim'] },
      );

      expect(result.success).toBe(true);
      expect((result.details as any).block?.employeeName).toBe('Anna Kim');
      expect(
        deps.publicBookingService.suggestMultiServiceBlock,
      ).toHaveBeenCalled();
    });

    it('clarifies when services are missing', async () => {
      const result = await handleCheckMultiServiceBlockAvailabilityLogic(
        buildScheduleDeps({
          serviceRepo: { find: jest.fn(async () => []) } as any,
        }),
        'biz-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify ?? result.details?.reason).toBeTruthy();
    });
  });

  describe('multi-service checkout compound param flow', () => {
    it.each(ALL_MULTI_SERVICE_CHECKOUT_PROMPTS)(
      'propagates serviceNames to book step for $id',
      ({ prompt, serviceNames }) => {
        const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
          prompt,
          employees,
          customers,
        );
        expect(steps[1]?.params.serviceNames).toEqual(
          expect.arrayContaining(serviceNames),
        );
      },
    );
  });

  describe('session context after multi-service check step', () => {
    it('inherits serviceNames and date into book follow-up', () => {
      const merged = pipeline.mergeSessionContext(
        { serviceNames: null, date: null, customerName: null },
        {
          serviceNames: ['haircut', 'beard trim'],
          date: '10/06/2026',
          employeeName: 'Anna Kim',
          lastAction: 'check_multi_service_block_availability',
        },
        'create_multi_service_booking',
      );
      applyPackageMultiServicePromptHints(
        'create_multi_service_booking',
        merged,
        'book for Maria at 10am',
        { employees, customers, session: merged },
      );
      merged.customerName = 'Maria Lopez';
      merged.timeSlot = '10:00';

      expect(merged.serviceNames).toEqual(['haircut', 'beard trim']);
      expect(merged.date).toBe('10/06/2026');
      expect(merged.employeeName).toBe('Anna Kim');
      expect(merged.customerName).toBe('Maria Lopez');
      expect(merged.timeSlot).toBe('10:00');
    });

    it('stores multi-service context from compound check step', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'compound_intent',
          summary: 'Block available',
          details: {
            employeeName: 'Anna Kim',
            date: '10/06/2026',
          },
        },
        {
          action: 'compound_intent',
          params: { employeeName: 'Anna Kim', customerName: 'Maria Lopez' },
          enrichedParams: {
            employeeName: 'Anna Kim',
            customerName: 'Maria Lopez',
          },
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.employeeName).toBe('Anna Kim');
      expect(attached.details?.sessionContext?.customerName).toBe(
        'Maria Lopez',
      );
    });
  });
});
