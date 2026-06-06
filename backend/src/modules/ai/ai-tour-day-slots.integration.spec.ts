import { BookingStatus } from '../booking/entities/booking.entity.js';
import { validateCommand } from './command-completion.validator.js';
import { handleExplainTourDaySlotsLogic } from './ai-tour-day-slots.logic.js';
import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from './ai-tour-day-slots.fixtures.js';
import { rescueTourDaySlotsIntent } from './ai-tour-day-slots.util.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';

describe('ai tour day slots integration (ai-cmd-tour-6)', () => {
  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    price: 320,
    currency: 'USD',
    durationMinutes: 4320,
    metadata: {
      serviceType: TOUR_SERVICE_TYPE,
      maxGroupSize: 8,
      durationDays: 3,
    },
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek]),
  };

  const bookingService = {
    findAll: jest.fn(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 3, tourStartDate: '2026-08-15' },
      },
    ]),
  };

  const deps = () => ({ serviceService, bookingService });

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockImplementation(async () => [mountainTrek]);
    bookingService.findAll.mockImplementation(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 3, tourStartDate: '2026-08-15' },
      },
    ]);
  });

  it.each(EXPLAIN_TOUR_DAY_SLOTS_PROMPTS)(
    'rescues and executes explain tour day slots $id',
    async ({ prompt, serviceName, date, aspect }) => {
      const rescued = rescueTourDaySlotsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('explain_tour_day_slots');

      const params: Record<string, unknown> = {};
      if (serviceName) params.serviceName = serviceName;
      if (date) params.date = date;
      if (aspect) params.aspect = aspect;

      const validation = validateCommand({
        action: 'explain_tour_day_slots',
        params,
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourDaySlotsLogic(
        deps(),
        'biz-1',
        params,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_day_slots');
    },
  );
});
