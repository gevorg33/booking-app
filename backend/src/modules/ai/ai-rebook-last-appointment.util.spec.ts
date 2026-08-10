import {
  CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES,
  REBOOK_LAST_APPOINTMENT_PROMPTS,
  REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS,
} from './ai-rebook-last-appointment.fixtures.js';
import { REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS } from './ai-rebook-last-appointment-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES } from './eval/ai-command-eval.cases.js';
import {
  detectRebookLastAppointmentAction,
  isRebookLastAppointmentIntent,
  parseRebookLastAppointmentFromPrompt,
  rescueRebookLastAppointmentIntent,
} from './ai-rebook-last-appointment.util.js';

describe('ai-rebook-last-appointment.util (ai-cmd-customer-4.4.8)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES).toContain(
      'rebook_last_appointment',
    );
  });

  it.each(
    REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified rebook prompt %s', (_id, row) => {
    expect(
      rescueRebookLastAppointmentIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe(row.expectedAction);
  });

  it('parses optional service name from fixture prompts', () => {
    const withService = REBOOK_LAST_APPOINTMENT_PROMPTS.find(
      (row) => row.serviceName,
    );
    expect(parseRebookLastAppointmentFromPrompt(withService!.prompt)).toEqual({
      serviceName: withService!.serviceName,
    });
    expect(
      parseRebookLastAppointmentFromPrompt('Book another service'),
    ).toBeNull();
  });

  it('maps fixtures to eval cases', () => {
    expect(AI_COMMAND_EVAL_REBOOK_LAST_APPOINTMENT_CASES.length).toBe(
      REBOOK_LAST_APPOINTMENT_PROMPTS.length +
        REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS.length +
        REBOOK_LAST_APPOINTMENT_RESCUE_SCENARIOS.length,
    );
  });
});
