import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS } from './ai-tour-calendar-span.fixtures.js';
import { handleExplainTourCalendarSpanLogic } from './ai-tour-calendar-span.logic.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';

describe('ai tour calendar span integration (ai-cmd-tour-11)', () => {
  const trekBooking = {
    id: 'bk-tour-1',
    businessId: 'biz-tour',
    serviceId: 'svc-trek',
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-06-11T08:00:00.000Z'),
    endTime: new Date('2026-06-13T18:00:00.000Z'),
    metadata: {
      paxCount: 4,
      tourStartDate: '2026-06-11',
      tourEndDate: '2026-06-13',
    },
    service: {
      id: 'svc-trek',
      name: '3-Day Mountain Trek',
      metadata: { serviceType: 'tour', maxGroupSize: 8 },
    },
    customer: { name: 'John Doe' },
  };

  const bookingService = {
    findAll: jest.fn(async () => [trekBooking]),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    bookingService.findAll.mockResolvedValue([trekBooking]);
  });

  it.each(EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS)(
    'rescues and executes explain tour calendar span $id',
    async ({ prompt, aspect, serviceName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_tour_calendar_span');

      const validation = validateCommand({
        action: 'explain_tour_calendar_span',
        params: {
          ...(aspect ? { aspect } : {}),
          ...(serviceName ? { serviceName } : {}),
          weekStartDate: '2026-06-08',
        },
        enrichedParams: {},
        entities: {},
        reasoning: 'test',
        confidence: 0.9,
        prompt,
      });
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourCalendarSpanLogic(
        { bookingService },
        'biz-tour',
        {
          weekStartDate: '2026-06-08',
          ...(aspect ? { aspect } : {}),
          ...(serviceName ? { serviceName } : {}),
        },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_calendar_span');
    },
  );
});
