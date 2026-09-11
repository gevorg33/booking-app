import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { validateCommand } from './command-completion.validator.js';
import { EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS } from './ai-tour-booking-record.fixtures.js';
import { handleExplainTourBookingRecordLogic } from './ai-tour-booking-record.logic.js';
import { rescueTourCustomerPublicIntent } from './ai-tour-customer-public.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai tour booking record customer integration (ai-cmd-customer-4.10.4)', () => {
  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');
  const tourEndDate = addDaysToDateKey(tourStartDate, 2, 'UTC');

  const tourBooking = makeBooking({
    id: 'bk-tour-1',
    businessId: 'biz-tour',
    customerId: 'cust-1',
    serviceId: 'svc-2',
    status: BookingStatus.CONFIRMED,
    startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
    endTime: new Date(`${tourEndDate}T18:00:00.000Z`),
    metadata: {
      paxCount: 4,
      tourStartDate,
      tourEndDate,
      specialRequirements: 'Wheelchair access',
    },
    service: {
      name: 'Wine Country',
      metadata: { serviceType: 'tour', maxGroupSize: 8 },
    },
    customer: { name: 'Alex Guest' },
  });

  const bookingService = {
    findAll: jest.fn(async () => [tourBooking]),
    findOne: jest.fn(async (id: string) => {
      if (id === 'bk-tour-1') return tourBooking;
      throw new Error('not found');
    }),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    bookingService.findAll.mockResolvedValue([tourBooking]);
  });

  it('global AiIntentRescueService rescues customer confirmation number prompts', () => {
    expect(
      rescue.rescue({
        prompt: "What's my tour confirmation number?",
        action: 'unknown',
        params: {},
      })?.action,
    ).toBe('explain_tour_booking_record');
  });

  it.each(EXPLAIN_TOUR_BOOKING_RECORD_CUSTOMER_PROMPTS)(
    'rescues and executes customer tour booking record $id',
    async ({ prompt, aspect, serviceName }) => {
      const rescued = rescueTourCustomerPublicIntent(prompt, 'unknown');
      expect(rescued?.action).toBe('explain_tour_booking_record');

      const dashboardRescue = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(dashboardRescue?.action).toBe('explain_tour_booking_record');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_tour_booking_record',
          params: {
            ...(aspect ? { aspect } : {}),
            ...(serviceName ? { serviceName } : {}),
            sessionCustomerId: 'cust-1',
          },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourBookingRecordLogic(
        { bookingService },
        'biz-tour',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_booking_record');
    },
  );
});
