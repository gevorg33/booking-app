import { validateCommand } from './command-completion.validator.js';
import { handleReportBookingProblemLogic } from './ai-report-booking-problem.logic.js';
import {
  REPORT_BOOKING_PROBLEM_PROMPTS,
  REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS,
} from './ai-report-booking-problem.fixtures.js';
import { rescueReportBookingProblemIntent } from './ai-report-booking-problem.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_REPORT_BOOKING_PROBLEM_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-report-booking-problem integration (ai-cmd-customer-4.12.3)', () => {
  const booking = {
    id: 'book-1',
    startTime: '2030-06-01T10:00:00.000Z',
    endTime: '2030-06-01T11:00:00.000Z',
    status: 'completed',
    paymentStatus: 'paid',
    serviceName: 'Haircut',
    employeeName: 'Alex',
    canReview: false,
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [booking] })),
    },
    publicConsumerSupportService: {
      createPostBookingSupportTicket: jest.fn(async () => ({
        ticketId: 42,
        agentUrl: 'https://example.zendesk.com/agent/tickets/42',
      })),
    },
    configService: {
      get: jest.fn(() => 'https://book.example.com'),
    },
    publicBookingService: {},
    publicCustomerBookingService: {},
    bookingRepo: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    serviceRepo: {},
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(REPORT_BOOKING_PROBLEM_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, serviceName }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'report_booking_problem',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const localDeps = deps();
      if (serviceName) {
        localDeps.publicCustomerAuthService.listBookings = jest.fn(
          async () => ({
            bookings: [
              {
                ...booking,
                serviceName:
                  serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
              },
            ],
          }),
        );
      }

      const result = await handleReportBookingProblemLogic(
        localDeps as any,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('report_booking_problem');
    },
  );

  it.each(REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueReportBookingProblemIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(REPORT_BOOKING_PROBLEM_PROMPTS.slice(0, 3))(
    'pipeline rescues report_booking_problem for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(rescued?.action).toBe('report_booking_problem');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_REPORT_BOOKING_PROBLEM_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
