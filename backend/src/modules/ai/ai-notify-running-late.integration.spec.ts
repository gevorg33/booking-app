import { validateCommand } from './command-completion.validator.js';
import { handleNotifyRunningLateLogic } from './ai-notify-running-late.logic.js';
import {
  NOTIFY_RUNNING_LATE_PROMPTS,
  NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS,
} from './ai-notify-running-late.fixtures.js';
import { rescueNotifyRunningLateIntent } from './ai-notify-running-late.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_NOTIFY_RUNNING_LATE_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-notify-running-late integration (ai-cmd-customer-4.4.6)', () => {
  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  const booking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    startTime,
    endTime,
    metadata: {},
    service: { name: 'Massage' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({ id: 'biz-1', slug: 'glow-salon' })),
    },
    bookingRepo: {
      find: jest.fn(async () => [booking]),
      findOne: jest.fn(async () => booking),
    },
    publicCustomerBookingService: {
      notifyRunningLate: jest.fn(async () => ({
        bookingId: 'book-1',
        minutesLate: 15,
        notifiedAt: '2030-06-01T13:45:00.000Z',
        staffNotified: true,
        customerRunningLate: {
          minutesLate: 15,
          notifiedAt: '2030-06-01T13:45:00.000Z',
        },
      })),
    },
    publicBookingService: {},
    publicCustomerAuthService: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    configService: {},
    serviceRepo: {},
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(NOTIFY_RUNNING_LATE_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, serviceName }) => {
      const validation = validateCommand(makeResolvedCommand({
        action: 'notify_running_late',
        params: {},
        enrichedParams: {},
        entities: { employees: [], services: [] },
        reasoning: 'test',
        prompt,
      }));
      expect(validation.issues).toEqual([]);

      const localDeps = deps();
      if (serviceName) {
        localDeps.bookingRepo.find = jest.fn(async () => [
          {
            ...booking,
            service: {
              name: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
            },
          },
        ]);
      }

      const result = await handleNotifyRunningLateLogic(
        localDeps as any,
        'biz-1',
        { sessionCustomerId: 'cust-1', bookingId: 'book-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('notify_running_late');
    },
  );

  it.each(NOTIFY_RUNNING_LATE_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueNotifyRunningLateIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_NOTIFY_RUNNING_LATE_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
