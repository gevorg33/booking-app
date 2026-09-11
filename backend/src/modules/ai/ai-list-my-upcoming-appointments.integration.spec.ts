import { validateCommand } from './command-completion.validator.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { handleListMyUpcomingAppointmentsLogic } from './ai-list-my-upcoming-appointments.logic.js';
import {
  LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS,
  LIST_MY_UPCOMING_APPOINTMENTS_RESCUE_SCENARIOS,
} from './ai-list-my-upcoming-appointments.fixtures.js';
import { rescueListMyUpcomingAppointmentsIntent } from './ai-list-my-upcoming-appointments.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_LIST_MY_UPCOMING_APPOINTMENTS_CASES } from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-list-my-upcoming-appointments integration (ai-cmd-customer-4.4.1)', () => {
  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
    },
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({
        bookings: [
          {
            id: 'book-1',
            serviceName: 'Massage',
            employeeName: 'Anna',
            startTime: '2026-07-15T14:00:00.000Z',
            status: BookingStatus.CONFIRMED,
            canCancel: true,
            canReschedule: true,
          },
        ],
      })),
    },
  });

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS)(
    'validates and executes $id',
    async ({ prompt, scope }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'list_my_upcoming_appointments',
          params: { scope },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleListMyUpcomingAppointmentsLogic(
        deps() as any,
        'biz-1',
        { sessionCustomerId: 'cust-1', _timeZone: 'UTC' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_my_upcoming_appointments');
      expect(result.details.scope).toBe(scope);
    },
  );

  it.each(LIST_MY_UPCOMING_APPOINTMENTS_RESCUE_SCENARIOS)(
    'rescues $id via util',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueListMyUpcomingAppointmentsIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(LIST_MY_UPCOMING_APPOINTMENTS_PROMPTS.slice(0, 3))(
    'pipeline rescues list_my_upcoming_appointments for $id',
    ({ prompt }) => {
      const rescued = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        surface: 'customer',
      });
      expect(rescued?.action).toBe('list_my_upcoming_appointments');
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_LIST_MY_UPCOMING_APPOINTMENTS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
