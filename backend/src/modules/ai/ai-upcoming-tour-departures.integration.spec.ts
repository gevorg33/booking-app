import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS } from './ai-upcoming-tour-departures.fixtures.js';
import { handleListUpcomingTourDeparturesLogic } from './ai-upcoming-tour-departures.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai upcoming tour departures integration (ai-cmd-tour-8)', () => {
  const departureDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');

  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const bookingService = {
    findAll: jest.fn(async () => [
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${departureDate}T08:00:00.000Z`),
        endTime: new Date(
          `${addDaysToDateKey(departureDate, 2, 'UTC')}T18:00:00.000Z`,
        ),
        metadata: { paxCount: 6, tourStartDate: departureDate },
        service: mountainTrek,
        customer: { name: 'John Doe' },
      },
    ]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek]),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    serviceService.findAll.mockResolvedValue([mountainTrek]);
    bookingService.findAll.mockResolvedValue([
      {
        id: 'bk-1',
        serviceId: 'svc-mountain',
        status: BookingStatus.CONFIRMED,
        startTime: new Date(`${departureDate}T08:00:00.000Z`),
        endTime: new Date(
          `${addDaysToDateKey(departureDate, 2, 'UTC')}T18:00:00.000Z`,
        ),
        metadata: { paxCount: 6, tourStartDate: departureDate },
        service: mountainTrek,
        customer: { name: 'John Doe' },
      },
    ]);
  });

  it.each(LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS)(
    'rescues and executes list upcoming tour departures $id',
    async ({ prompt, serviceName, daysAhead }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_upcoming_tour_departures');

      const validation = validateCommand(makeResolvedCommand({
        action: 'list_upcoming_tour_departures',
        params: {
          ...(serviceName ? { serviceName } : {}),
          ...(daysAhead ? { daysAhead } : {}),
        },
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const result = await handleListUpcomingTourDeparturesLogic(
        { serviceService, bookingService },
        'biz-tour',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_upcoming_tour_departures');
    },
  );
});
