import { AiIntentRescueService } from './ai-intent-rescue.service.js';
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

describe('ai tour service integration (ai-cmd-tour-1)', () => {
  const services = [
    {
      id: 'svc-1',
      name: 'Full Day City Tour',
      metadata: { serviceType: 'tour', maxGroupSize: 12 },
      durationMinutes: 480,
    },
    {
      id: 'svc-2',
      name: '3-Day Mountain Trek',
      metadata: {
        serviceType: 'tour',
        difficulty: 'challenging',
        maxGroupSize: 8,
      },
      durationMinutes: 4320,
    },
    {
      id: 'svc-3',
      name: 'Sunset Coastal Drive',
      metadata: {},
      durationMinutes: 300,
    },
    {
      id: 'svc-4',
      name: 'Weekend Heritage Tour',
      metadata: { serviceType: 'tour', difficulty: 'moderate' },
      durationMinutes: 2880,
    },
    {
      id: 'svc-city',
      name: 'City Tour',
      metadata: {},
      durationMinutes: 480,
    },
  ];

  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10);
  const tourEndDate = addDaysToDateKey(tourStartDate, 2);

  const bookingService = {
    findAll: jest.fn(async () => [
      {
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
        service: {
          name: '3-Day Mountain Trek',
          metadata: { serviceType: 'tour' },
        },
        customer: { name: 'John Doe' },
      },
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
    findOne: jest.fn(async () => ({
      id: 'biz-tour',
      settings: { businessType: 'tour_operator' },
    })),
  };

  const onboardingService = {
    applyVerticalPlaybook: jest.fn(async () => ({
      playbookId: 'tour',
      categoriesCreated: 3,
      servicesCreated: 5,
      slotsCreated: 70,
      templatesApplied: ['Tour operating hours'],
      employeeName: 'Guide',
      status: 'configured',
    })),
  };

  const deps = () => ({ serviceService, bookingService });
  const playbookDeps = () => ({ businessRepo, onboardingService });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    serviceService.findAll.mockResolvedValue([...services]);
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-tour',
      settings: { businessType: 'tour_operator' },
    });
    onboardingService.applyVerticalPlaybook.mockResolvedValue({
      playbookId: 'tour',
      categoriesCreated: 3,
      servicesCreated: 5,
      slotsCreated: 70,
      templatesApplied: ['Tour operating hours'],
      employeeName: 'Guide',
      status: 'configured',
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

      const validation = validateCommand({
        action: 'configure_tour_service',
        params: {
          ...(serviceName ? { serviceName } : {}),
          ...(enableTour ? { enableTour: true } : {}),
          ...(maxGroupSize !== undefined ? { maxGroupSize } : {}),
          ...(difficulty ? { difficulty } : {}),
        },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
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

      const validation = validateCommand({
        action: 'apply_tour_playbook',
        params: {},
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
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
    async ({ prompt, serviceName, daysAhead }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_tour_services');

      const validation = validateCommand({
        action: 'explain_tour_services',
        params: {
          ...(serviceName ? { serviceName } : {}),
          ...(daysAhead ? { daysAhead } : {}),
        },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
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
