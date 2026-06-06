import { BookingStatus } from '../booking/entities/booking.entity.js';
import { validateCommand } from './command-completion.validator.js';
import { DIAGNOSE_TOUR_CAPACITY_PROMPTS } from './ai-tour-capacity.fixtures.js';
import { handleDiagnoseTourCapacityLogic } from './ai-tour-capacity.logic.js';
import { rescueDiagnoseTourCapacityIntent } from './ai-tour-capacity.util.js';

describe('ai tour capacity integration (ai-cmd-tour-9)', () => {
  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const cityTour = {
    id: 'svc-city',
    name: 'City Tour',
    metadata: { serviceType: 'tour', maxGroupSize: 12 },
  };

  const bookingService = {
    findAll: jest.fn(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 6, tourStartDate: '2026-08-15' },
      },
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek, cityTour]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    serviceService.findAll.mockResolvedValue([mountainTrek, cityTour]);
    bookingService.findAll.mockResolvedValue([
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-08-15T08:00:00.000Z'),
        endTime: new Date('2026-08-18T08:00:00.000Z'),
        metadata: { paxCount: 6, tourStartDate: '2026-08-15' },
      },
    ]);
  });

  it.each(DIAGNOSE_TOUR_CAPACITY_PROMPTS)(
    'rescues and executes diagnose tour capacity $id',
    async ({ prompt, serviceName, date, requestedPax, aspect }) => {
      const rescued = rescueDiagnoseTourCapacityIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('diagnose_tour_capacity');

      const validation = validateCommand({
        action: 'diagnose_tour_capacity',
        params: {
          ...(serviceName ? { serviceName } : {}),
          ...(date ? { date } : {}),
          ...(requestedPax ? { requestedPax } : {}),
          ...(aspect ? { aspect } : {}),
        },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleDiagnoseTourCapacityLogic(
        { serviceService, bookingService },
        'biz-tour',
        {},
        prompt,
      );
      expect(result.action).toBe('diagnose_tour_capacity');
    },
  );
});
