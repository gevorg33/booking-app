import {
  CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES,
  FIND_SOONEST_APPOINTMENT_PROMPTS,
  detectFindSoonestAppointmentAction,
  enrichFindSoonestParamsFromPrompt,
  isFindSoonestAppointmentPrompt,
  rescueFindSoonestAppointmentIntent,
} from './ai-find-soonest-appointment.util.js';
import { FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from './ai-find-soonest-appointment-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_FIND_SOONEST_APPOINTMENT_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';

describe('ai-find-soonest-appointment.util (ai-cmd-customer-4.1.3)', () => {
  it('exports classifier rules for find_soonest_appointment', () => {
    expect(CUSTOMER_PUBLIC_FIND_SOONEST_APPOINTMENT_CLASSIFIER_RULES).toContain(
      'find_soonest_appointment',
    );
  });

  it.each(
    FIND_SOONEST_APPOINTMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects find-soonest prompt $id', (_id, row) => {
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(true);
    expect(detectFindSoonestAppointmentAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual find-soonest prompt $id', (_id, row) => {
    expect(isFindSoonestAppointmentPrompt(row.prompt)).toBe(true);
    expect(
      rescueFindSoonestAppointmentIntent(row.prompt, 'unknown')?.action,
    ).toBe('find_soonest_appointment');
  });

  it.each(
    FIND_SOONEST_APPOINTMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues find-soonest prompt $id from unknown', (_id, row) => {
    const rescued = rescueFindSoonestAppointmentIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
    expect(rescuePaymentsIntent(row.prompt, 'unknown')?.action).toBe(
      'find_soonest_appointment',
    );
  });

  it('enriches bookingFirstAvailable and serviceName', () => {
    const enriched = enrichFindSoonestParamsFromPrompt(
      {},
      "Who's free soonest for a trim?",
    );
    expect(enriched.bookingFirstAvailable).toBe(true);
    expect(enriched.serviceName).toBe('trim');
  });

  it('disambiguates mutate book and general provider checks', () => {
    expect(
      isFindSoonestAppointmentPrompt('Book the soonest slot for massage'),
    ).toBe(false);
    expect(isBookNearestSlotPrompt('Book the soonest slot for massage')).toBe(
      true,
    );
    expect(
      isFindSoonestAppointmentPrompt('Who is free tomorrow for massage?'),
    ).toBe(false);
    expect(
      isCheckProvidersForServicePrompt('Who is free tomorrow for massage?'),
    ).toBe(true);
    expect(
      isFindSoonestAppointmentPrompt(
        'Put me in the earliest opening you have this week',
      ),
    ).toBe(false);
  });

  // e2e-bug.248 — move/reschedule + nearest free time is not find_soonest READ.
  it('rejects reschedule-of-existing move/nearest phrasing', () => {
    expect(
      isFindSoonestAppointmentPrompt(
        "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      ),
    ).toBe(false);
    expect(
      isFindSoonestAppointmentPrompt(
        'Reschedule Anna appointment to the soonest free slot tomorrow',
      ),
    ).toBe(false);
    expect(
      isFindSoonestAppointmentPrompt(
        'Move to June 11 nearest free time for Maria',
      ),
    ).toBe(false);
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      FIND_SOONEST_APPOINTMENT_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      FIND_SOONEST_APPOINTMENT_PROMPTS.filter((row) => row.surface === 'public')
        .length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_FIND_SOONEST_APPOINTMENT_CASES.length).toBe(
      FIND_SOONEST_APPOINTMENT_PROMPTS.length +
        FIND_SOONEST_APPOINTMENT_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_FIND_SOONEST_APPOINTMENT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
