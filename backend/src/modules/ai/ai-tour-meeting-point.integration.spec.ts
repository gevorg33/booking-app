import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { validateCommand } from './command-completion.validator.js';
import {
  EXPLAIN_TOUR_MEETING_POINT_PROMPTS,
  EXPLAIN_TOUR_MEETING_POINT_RESCUE_SCENARIOS,
} from './ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS } from './ai-tour-meeting-point-multilingual.fixtures.js';
import { handleExplainTourMeetingPointLogic } from './ai-tour-meeting-point.logic.js';
import { rescueTourCustomerPublicIntent } from './ai-tour-customer-public.util.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai tour meeting point integration (ai-cmd-customer-4.10.6)', () => {
  const tourStartDate = addDaysToDateKey(getTodayDateKey(), 10, 'UTC');

  const services = [
    {
      id: 'svc-wine',
      name: 'Wine Country',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Central Plaza fountain',
      },
    },
    {
      id: 'svc-mountain',
      name: 'Mountain Trek',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Trailhead parking lot',
      },
    },
    {
      id: 'svc-city',
      name: 'City Tour',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Main hotel lobby',
      },
    },
    {
      id: 'svc-garni',
      name: 'Garni Temple',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Temple gate',
      },
    },
    {
      id: 'svc-sunset',
      name: 'Sunset Hike',
      metadata: {
        serviceType: TOUR_SERVICE_TYPE,
        meetingPoint: 'Park entrance',
      },
    },
  ];

  const tourBooking = {
    id: 'bk-tour-1',
    businessId: 'biz-tour',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    startTime: new Date(`${tourStartDate}T08:00:00.000Z`),
    metadata: { paxCount: 4, tourStartDate },
    service: services[0],
  };

  const bookingService = {
    findAll: jest.fn(async () => [tourBooking]),
    findOne: jest.fn(async () => tourBooking),
  };

  const serviceService = {
    findAll: jest.fn(async () => services),
  };

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    jest.clearAllMocks();
    rescue = new AiIntentRescueService();
    bookingService.findAll.mockResolvedValue([tourBooking]);
    serviceService.findAll.mockResolvedValue(services);
  });

  it.each([
    ...EXPLAIN_TOUR_MEETING_POINT_PROMPTS,
    ...EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS,
  ])(
    'rescues and executes explain tour meeting point $id',
    async ({ prompt, aspect, serviceName }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('explain_tour_meeting_point');

      const customerPublicRescue = rescueTourCustomerPublicIntent(
        prompt,
        'unknown',
      );
      expect(customerPublicRescue?.action).toBe('explain_tour_meeting_point');

      const validation = validateCommand(
        makeResolvedCommand({
          action: 'explain_tour_meeting_point',
          params: {
            ...(serviceName ? { serviceName } : {}),
            ...(aspect ? { aspect } : {}),
          },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleExplainTourMeetingPointLogic(
        { bookingService, serviceService },
        'biz-tour',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_tour_meeting_point');
    },
  );

  it.each(EXPLAIN_TOUR_MEETING_POINT_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      const rescued = rescue.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe('explain_tour_meeting_point');
    },
  );
});
