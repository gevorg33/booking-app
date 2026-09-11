import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import type { OnboardingService } from '../onboarding/onboarding.service.js';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeCustomer } from '../customer/entities/customer.test-fixture.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { validateCommand } from './command-completion.validator.js';
import {
  handleApplyTourPlaybookLogic,
  handleConfigureTourServiceLogic,
  handleExplainTourServicesLogic,
} from './ai-tour-service.logic.js';
import {
  APPLY_TOUR_PLAYBOOK_PROMPTS,
  CONFIGURE_TOUR_SERVICE_PROMPTS,
  EXPLAIN_TOUR_SERVICES_PROMPTS,
} from './ai-tour-service.fixtures.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai tour service integration (ai-cmd-tour-1)', () => {
  const services = [
    makeService({
      id: 'svc-1',
      name: 'Full Day City Tour',
      metadata: { serviceType: 'tour', maxGroupSize: 12 },
      durationMinutes: 480,
    }),
    makeService({
      id: 'svc-2',
      name: '3-Day Mountain Trek',
      metadata: {
        serviceType: 'tour',
        difficulty: 'challenging',
        maxGroupSize: 8,
      },
      durationMinutes: 4320,
    }),
    makeService({
      id: 'svc-3',
      name: 'Sunset Coastal Drive',
      metadata: {},
      durationMinutes: 300,
    }),
    makeService({
      id: 'svc-4',
      name: 'Weekend Heritage Tour',
      metadata: { serviceType: 'tour', difficulty: 'moderate' },
      durationMinutes: 2880,
    }),
    makeService({
      id: 'svc-city',
      name: 'City Tour',
      metadata: {},
      durationMinutes: 480,
    }),
  ];

  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');
  const tourEndDate = addDaysToDateKey(tourStartDate, 2, 'UTC');

  const bookingService = {
    // Required by the deps: this object is forwarded to the booking-record and
    // meeting-point logic, which call `findOne` (same as the logic spec).
    findOne: jest.fn(async () => makeBooking({ id: 'bk-1' })),
    findAll: jest.fn(async () => [
      makeBooking({
        id: 'bk-1',
        serviceId: 'svc-2',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
        endTime: new Date(`${tourEndDate}T18:00:00.000Z`),
        metadata: {
          paxCount: 6,
          tourStartDate,
          tourEndDate,
        },
        service: makeService({
          name: '3-Day Mountain Trek',
          metadata: { serviceType: 'tour' },
        }),
        customer: makeCustomer({ name: 'John Doe' }),
      }),
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [...services]),
    update: jest.fn(async (id: string, dto: Record<string, unknown>) => {
      const base = services.find((item) => item.id === id)!;
      return {
        ...base,
        metadata: { ...(base.metadata ?? {}), ...dto },
      };
    }),
  };

  const businessRepo = {
    findOne: jest.fn(async () =>
      makeBusiness({
        id: 'biz-tour',
        settings: { businessType: 'tour_operator' },
      }),
    ),
  };

  const onboardingService = {
    // Declared against the real return type; `status` is the onboarding status
    // object, not the string `'configured'` this used to hold (see
    // ai-clinic-service.logic.spec for the same defect).
    applyVerticalPlaybook: jest.fn(
      async (): ReturnType<OnboardingService['applyVerticalPlaybook']> => ({
        playbookId: 'tour',
        categoriesCreated: 3,
        servicesCreated: 5,
        slotsCreated: 70,
        templatesApplied: ['Tour operating hours'],
        employeeName: 'Guide',
        status: {
          completed: true,
          step: 'done',
          businessType: 'tour_operator',
          businessTypeNotes: null,
          hasCatalog: true,
          hasSchedule: true,
          categoryCount: 3,
          serviceCount: 9,
          bookingSlug: 'tour',
          bookingPath: '/book/tour',
        },
      }),
    ),
  };

  const deps = () => ({ serviceService, bookingService });
  const playbookDeps = () => ({ businessRepo, onboardingService });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    serviceService.findAll.mockResolvedValue([...services]);
    businessRepo.findOne.mockResolvedValue(
      makeBusiness({
        id: 'biz-tour',
        settings: { businessType: 'tour_operator' },
      }),
    );
    onboardingService.applyVerticalPlaybook.mockResolvedValue({
      playbookId: 'tour',
      categoriesCreated: 3,
      servicesCreated: 5,
      slotsCreated: 70,
      templatesApplied: ['Tour operating hours'],
      employeeName: 'Guide',
      status: {
        completed: true,
        step: 'done',
        businessType: 'tour_operator',
        businessTypeNotes: null,
        hasCatalog: true,
        hasSchedule: true,
        categoryCount: 3,
        serviceCount: 9,
        bookingSlug: 'tour',
        bookingPath: '/book/tour',
      },
    });
  });

  it.each(CONFIGURE_TOUR_SERVICE_PROMPTS)(
    'rescues and executes configure tour service $id',
    async ({ prompt, serviceName, enableTour, maxGroupSize, difficulty }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('configure_tour_service');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'configure_tour_service',
          params: {
            ...(serviceName ? { serviceName } : {}),
            ...(enableTour ? { enableTour: true } : {}),
            ...(maxGroupSize !== undefined ? { maxGroupSize } : {}),
            ...(difficulty ? { difficulty } : {}),
          },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleConfigureTourServiceLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_tour_service');
      expect(serviceService.update).toHaveBeenCalled();
    },
  );

  it.each(APPLY_TOUR_PLAYBOOK_PROMPTS)(
    'rescues and executes apply tour playbook $id',
    async ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('apply_tour_playbook');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'apply_tour_playbook',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleApplyTourPlaybookLogic(
        playbookDeps(),
        'biz-tour',
        'user-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('apply_tour_playbook');
      expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
        'biz-tour',
        'user-1',
      );
    },
  );

  it.each(EXPLAIN_TOUR_SERVICES_PROMPTS)(
    'rescues and executes explain tour services $id',
    // No `daysAhead`: no member of `EXPLAIN_TOUR_SERVICES_PROMPTS` carries it —
    // it belongs to `list_upcoming_tour_departures` — so the destructure was
    // always `undefined` and the spread below it was dead.
    async ({ prompt, serviceName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_tour_services');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_tour_services',
          params: {
            ...(serviceName ? { serviceName } : {}),
          },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourServicesLogic(
        deps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_services');
    },
  );
});
