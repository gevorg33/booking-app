import { validateCommand } from './command-completion.validator.js';
import { handleExplainTourBookingLogic } from './ai-tour-booking.logic.js';
import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import { rescueTourBookingIntent } from './ai-tour-booking.util.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai tour booking integration (ai-cmd-tour-5)', () => {
  const services = [
    {
      id: 'svc-city',
      name: 'City Tour',
      price: 45,
      currency: 'EUR',
      durationMinutes: 480,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 12,
        durationDays: 1,
      },
    },
    {
      id: 'svc-mountain',
      name: 'Mountain Trek',
      price: 120,
      currency: 'EUR',
      durationMinutes: 2880,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 8,
        durationDays: 3,
      },
    },
    {
      id: 'svc-garni',
      name: 'Garni Temple',
      price: 55,
      currency: 'EUR',
      durationMinutes: 360,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 15,
        durationDays: 1,
      },
    },
    {
      id: 'svc-wine',
      name: 'Wine Country',
      price: 90,
      currency: 'EUR',
      durationMinutes: 1440,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 10,
        durationDays: 2,
      },
    },
    {
      id: 'svc-sunset',
      name: 'Sunset Hike',
      price: 35,
      currency: 'EUR',
      durationMinutes: 180,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 6,
      },
    },
    {
      id: 'svc-full-day',
      name: 'Full Day City Tour',
      price: 75,
      currency: 'EUR',
      durationMinutes: 2880,
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        maxGroupSize: 14,
        durationDays: 2,
      },
    },
  ];

  const serviceService = {
    findAll: jest.fn(async () => services),
  };

  const deps = () => ({ serviceService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockImplementation(async () => services);
  });

  it.each(EXPLAIN_TOUR_BOOKING_PROMPTS)(
    'rescues and executes explain tour booking $id',
    async ({ prompt, serviceName }) => {
      const rescued = rescueTourBookingIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('explain_tour_booking');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_tour_booking',
          params: { serviceName },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourBookingLogic(
        deps(),
        'biz-1',
        { serviceName },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_booking');
      expect(result.details?.serviceName).toBeTruthy();
    },
  );
});
