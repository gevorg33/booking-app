import { validateCommand } from './command-completion.validator.js';
import {
  REBOOK_LAST_APPOINTMENT_PROMPTS,
  REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS,
} from './ai-rebook-last-appointment.fixtures.js';
import { handleRebookLastAppointmentLogic } from './ai-rebook-last-appointment.logic.js';
import { rescueRebookLastAppointmentIntent } from './ai-rebook-last-appointment.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES } from './eval/ai-command-eval.cases.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

describe('ai-rebook-last-appointment integration (ai-cmd-customer-4.4.8)', () => {
  const booking = {
    id: 'b1',
    serviceId: 'svc-1',
    serviceName: 'Haircut',
    employeeId: 'emp-1',
    employeeName: 'Alex',
    startTime: '2026-05-01T10:00:00.000Z',
    status: BookingStatus.COMPLETED,
  };

  const deps = () => ({
    publicCustomerAuthService: {
      listBookings: jest.fn(async () => ({ bookings: [booking] })),
    },
  });

  it.each(REBOOK_LAST_APPOINTMENT_PROMPTS)(
    'validates and executes $id',
    async ({ prompt }) => {
      const validation = validateCommand(
        makeResolvedCommand({
          action: 'rebook_last_appointment',
          params: {},
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
          prompt,
        }),
      );
      expect(validation.issues).toEqual([]);

      const result = await handleRebookLastAppointmentLogic(
        deps() as any,
        'biz-1',
        { sessionCustomerId: 'cust-1', slug: 'demo-salon' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.details?.navigate).toBeDefined();
    },
  );

  it.each(REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS)(
    'rescues misclassified intent $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueRebookLastAppointmentIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
