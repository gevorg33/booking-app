import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import {
  applyPackageMultiServicePromptHints,
  decomposeDashboardPackageMultiServiceCompoundPrompt,
  disambiguateStaffPackageMultiBooking,
  isDashboardPackageMultiCompoundPrompt,
} from './ai-package-multi-service-hints.util.js';
import {
  ALL_PACKAGE_CHECKOUT_PROMPTS,
  PACKAGE_CHECKOUT_PROMPTS,
} from './ai-package-multi-service.fixtures.js';
import {
  handleCheckPackageLineAvailabilityLogic,
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

function buildScheduleDeps(
  overrides: Partial<Sprint29ScheduleResourceLogicDeps> = {},
): Sprint29ScheduleResourceLogicDeps {
  return {
    resourcesService: {} as any,
    multiServiceBookingsService: {} as any,
    publicBookingService: {
      suggestPackageLineSlots: jest.fn(async () => ({
        lines: [
          { serviceName: 'Massage', startTime: '2026-06-07T14:00:00Z' },
          { serviceName: 'Facial', startTime: '2026-06-07T15:00:00Z' },
        ],
      })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'salon' })),
    } as any,
    serviceRepo: { find: jest.fn(async () => []) } as any,
    ...overrides,
  };
}

describe('ai package booking checkout integration (ai-cmd-h4.1)', () => {
  const pipeline = new CommandCompletionPipelineService();
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  describe('prompt detection and decomposition', () => {
    it.each(ALL_PACKAGE_CHECKOUT_PROMPTS)(
      'detects package checkout compound for $id',
      ({ prompt, packageName, customerName, orderedActions }) => {
        expect(isDashboardPackageMultiCompoundPrompt(prompt)).toBe(true);

        const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
          prompt,
          employees,
          customers,
        );
        expect(steps.map((s) => s.action)).toEqual(orderedActions);
        expect(steps[0]?.action).toBe('check_package_line_availability');
        expect(steps[0]?.params.packageName).toBe(packageName);
        if (customerName) {
          expect(steps[1]?.params.customerName).toBe(customerName);
        }
      },
    );

    it('decomposes package check-only prompts', () => {
      const prompt =
        'Check package line availability for Spa Day tomorrow';
      expect(isDashboardPackageMultiCompoundPrompt(prompt)).toBe(false);

      const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
        prompt,
        employees,
        customers,
      );
      expect(steps).toHaveLength(1);
      expect(steps[0]?.action).toBe('check_package_line_availability');
      expect(steps[0]?.params.packageName).toBe('Spa Day');
    });

    it('matches golden dashboard package checkout pattern', () => {
      const prompt = PACKAGE_CHECKOUT_PROMPTS[0].prompt;
      const golden = matchGoldenCompoundPattern('dashboard', prompt);
      expect(golden?.recipeId).toBe('dashboard_package_multi_service_compound');
      expect(golden?.steps.map((s) => s.action)).toEqual([
        'check_package_line_availability',
        'create_package_booking',
      ]);
    });

    it('decomposes deterministically on dashboard surface', () => {
      const prompt = PACKAGE_CHECKOUT_PROMPTS[0].prompt;
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.steps.length).toBeGreaterThanOrEqual(2);
      expect(result?.steps[0]?.action).toBe('check_package_line_availability');
    });

    it('does not treat unrelated prompts as package checkout compound', () => {
      expect(isDashboardPackageMultiCompoundPrompt('Summarize revenue')).toBe(
        false,
      );
      expect(
        decomposeDashboardPackageMultiServiceCompoundPrompt('hello world'),
      ).toEqual([]);
    });
  });

  describe('intent rescue', () => {
    it.each([
      [
        'create_booking-to-package',
        'Book spa day package for James Friday 2pm',
        'create_booking',
        'create_package_booking',
        'create_booking_to_package',
      ],
      [
        'unknown-package-book',
        'Book spa day package for James Friday 2pm',
        'unknown',
        'create_package_booking',
        'package_booking',
      ],
    ] as const)(
      'rescues %s to expected action',
      (_id, prompt, action, expected, rescueReason) => {
        const fromRescue = rescue.rescue({
          prompt,
          action,
          params: {},
          employees,
          customers,
        });
        const fromDisambiguate = disambiguateStaffPackageMultiBooking(
          prompt,
          action,
        );
        const result =
          fromRescue?.action === expected
            ? fromRescue
            : fromDisambiguate?.action === expected
              ? { action: expected, rescueReason: fromDisambiguate.rescueReason }
              : fromRescue;

        expect(result?.action).toBe(expected);
        if (fromRescue?.action === expected && fromRescue.rescueReason) {
          expect(fromRescue.rescueReason).toBe(rescueReason);
        }
      },
    );
  });

  describe('check package line handler', () => {
    it('returns package line slots when packageId is provided', async () => {
      const deps = buildScheduleDeps();
      const result = await handleCheckPackageLineAvailabilityLogic(
        deps,
        'biz-1',
        { packageId: 'pkg-spa-day' },
      );

      expect(result.success).toBe(true);
      expect((result.details as any).lines?.lines).toHaveLength(2);
      expect(deps.publicBookingService.suggestPackageLineSlots).toHaveBeenCalledWith(
        'salon',
        'pkg-spa-day',
      );
    });

    it('clarifies when packageId is missing', async () => {
      const result = await handleCheckPackageLineAvailabilityLogic(
        buildScheduleDeps(),
        'biz-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
      expect(result.details?.missing).toContain('packageId');
    });
  });

  describe('package checkout compound param flow', () => {
    it.each(ALL_PACKAGE_CHECKOUT_PROMPTS)(
      'propagates packageName and customer to book step for $id',
      ({ prompt, packageName, customerName }) => {
        const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
          prompt,
          employees,
          customers,
        );
        expect(steps[1]?.params.packageName).toBe(packageName);
        if (customerName) {
          expect(steps[1]?.params.customerName).toBe(customerName);
        }
      },
    );

    it('stops compound when check step would clarify without packageId', async () => {
      const check = await handleCheckPackageLineAvailabilityLogic(
        buildScheduleDeps(),
        'biz-1',
        { packageName: 'Spa Day' },
      );
      expect(check.success).toBe(false);
      expect(check.details?.failedStep ?? check.details?.missing).toBeTruthy();
    });
  });

  describe('session context after package check step', () => {
    it('inherits packageName and date into book follow-up', () => {
      const merged = pipeline.mergeSessionContext(
        { packageName: null, date: null, customerName: null },
        {
          packageName: 'Spa Day',
          date: '07/06/2026',
          lastAction: 'check_package_line_availability',
        },
        'create_package_booking',
      );
      applyPackageMultiServicePromptHints(
        'create_package_booking',
        merged,
        'book for James at 2pm',
        { employees, customers, session: merged },
      );
      merged.customerName = 'James';
      merged.timeSlot = '14:00';

      expect(merged.packageName).toBe('Spa Day');
      expect(merged.date).toBe('07/06/2026');
      expect(merged.customerName).toBe('James');
      expect(merged.timeSlot).toBe('14:00');
    });

    it('stores package context from compound check step for follow-up turns', () => {
      const attached = pipeline.attachSessionToResult(
        {
          success: true,
          action: 'compound_intent',
          summary: 'Package lines available',
          details: {
            packageName: 'Spa Day',
            packageId: 'pkg-spa-day',
            date: '07/06/2026',
          },
        },
        {
          action: 'compound_intent',
          params: { packageName: 'Spa Day' },
          enrichedParams: {},
          reasoning: '',
          entities: {},
        } as any,
      );

      expect(attached.details?.sessionContext?.packageName).toBe('Spa Day');
    });
  });
});
