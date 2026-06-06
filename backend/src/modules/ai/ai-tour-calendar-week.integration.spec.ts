import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { LIST_TOUR_CALENDAR_WEEK_PROMPTS } from './ai-tour-calendar-week.fixtures.js';
import { handleListTourCalendarWeekLogic } from './ai-tour-calendar-week.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ai tour calendar week integration (ai-cmd-tour-12)', () => {
  const mountainTrek = {
    id: 'svc-mountain',
    name: '3-Day Mountain Trek',
    metadata: { serviceType: 'tour', maxGroupSize: 8 },
  };

  const maria = { id: 'emp-maria', name: 'Maria Lopez' };
  const gevorg = { id: 'emp-gevorg', name: 'Gevorg Gasparyan' };

  const trekBooking = {
    id: 'bk-tour-1',
    serviceId: 'svc-mountain',
    employeeId: 'emp-maria',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-06-11T08:00:00.000Z'),
    endTime: new Date('2026-06-13T18:00:00.000Z'),
    metadata: {
      paxCount: 4,
      tourStartDate: '2026-06-11',
      tourEndDate: '2026-06-13',
    },
    service: mountainTrek,
    employee: maria,
    customer: { name: 'John Doe' },
  };

  const bookingService = {
    findAll: jest.fn(async () => [trekBooking]),
  };

  const serviceService = {
    findAll: jest.fn(async () => [mountainTrek]),
  };

  const employeeService = {
    findAll: jest.fn(async () => [maria, gevorg]),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    bookingService.findAll.mockResolvedValue([trekBooking]);
    serviceService.findAll.mockResolvedValue([mountainTrek]);
    employeeService.findAll.mockResolvedValue([maria, gevorg]);
  });

  it.each(LIST_TOUR_CALENDAR_WEEK_PROMPTS)(
    'rescues and executes list tour calendar week $id',
    async ({ prompt, employeeName, serviceName, weekStartDate }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_tour_calendar_week');

      const validation = validateCommand({
        action: 'list_tour_calendar_week',
        params: {
          weekStartDate: weekStartDate ?? '2026-06-08',
          ...(employeeName ? { employeeName } : {}),
          ...(serviceName ? { serviceName } : {}),
        },
        enrichedParams: {},
        entities: employeeName
          ? {
              employees: [
                {
                  id: employeeName === 'Gevorg' ? 'emp-gevorg' : 'emp-maria',
                  name:
                    employeeName === 'Gevorg'
                      ? 'Gevorg Gasparyan'
                      : 'Maria Lopez',
                },
              ],
            }
          : {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleListTourCalendarWeekLogic(
        { bookingService, serviceService, employeeService },
        'biz-tour',
        {
          weekStartDate: weekStartDate ?? '2026-06-08',
          ...(employeeName ? { employeeName } : {}),
          ...(serviceName ? { serviceName } : {}),
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_tour_calendar_week');
    },
  );
});
