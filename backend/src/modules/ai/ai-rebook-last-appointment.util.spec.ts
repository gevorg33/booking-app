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
  isRebookLastAppointmentPrompt,
  parseRebookLastAppointmentFromPrompt,
  rescueRebookLastAppointmentIntent,
} from './ai-rebook-last-appointment.util.js';

describe('ai-rebook-last-appointment.util (ai-cmd-customer-4.4.8)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_REBOOK_LAST_APPOINTMENT_CLASSIFIER_RULES).toContain(
      'rebook_last_appointment',
    );
  });

  it.each(REBOOK_LAST_APPOINTMENT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects rebook prompt %s',
    (_id, row) => {
      expect(isRebookLastAppointmentPrompt(row.prompt)).toBe(true);
      expect(parseRebookLastAppointmentFromPrompt(row.prompt)).not.toBeNull();
      expect(
        rescueRebookLastAppointmentIntent(row.prompt, 'book_appointment')
          ?.action,
      ).toBe('rebook_last_appointment');
    },
  );

  it.each(
    REBOOK_LAST_APPOINTMENT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual rebook prompt %s', (_id, row) => {
    expect(isRebookLastAppointmentPrompt(row.prompt)).toBe(true);
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

  it('exposes intent helpers and boundaries', () => {
    expect(isRebookLastAppointmentIntent('rebook_last_appointment')).toBe(true);
    expect(
      detectRebookLastAppointmentAction('Book the same as last time'),
    ).toBe('rebook_last_appointment');
    expect(isRebookLastAppointmentPrompt('Book another service')).toBe(false);
    expect(isRebookLastAppointmentPrompt('List my upcoming appointments')).toBe(
      false,
    );
    expect(
      isRebookLastAppointmentPrompt('Reschedule my haircut to tomorrow at 3pm'),
    ).toBe(false);
    expect(isRebookLastAppointmentPrompt('Book the same service again')).toBe(
      true,
    );
    expect(
      rescueRebookLastAppointmentIntent(
        'Rebook my last appointment',
        'rebook_last_appointment',
      ),
    ).toBeNull();
  });

  it('detects heuristic armenian and cyrillic rebook cues', () => {
    expect(isRebookLastAppointmentPrompt('Նույնը ինչ անցած անգամ')).toBe(true);
    expect(
      isRebookLastAppointmentPrompt('Повторно записаться на прошлый визит'),
    ).toBe(true);
    expect(
      isRebookLastAppointmentPrompt('Записаться снова как в прошлый раз'),
    ).toBe(true);
    expect(isRebookLastAppointmentPrompt('Կրկնել վերջին այցը նորից')).toBe(
      true,
    );
    expect(
      isRebookLastAppointmentPrompt('Schedule the same haircut again please'),
    ).toBe(true);
    expect(isRebookLastAppointmentPrompt('Прошлый визит — повторить')).toBe(
      true,
    );
  });

  it('rejects unrelated prompts', () => {
    expect(isRebookLastAppointmentIntent('book_appointment')).toBe(false);
    expect(isRebookLastAppointmentPrompt('Book a new appointment')).toBe(false);
    expect(
      detectRebookLastAppointmentAction('Book another service'),
    ).toBeNull();
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

  it('defers rebook+pay compound prompts to rebook_and_pay', () => {
    expect(
      isRebookLastAppointmentPrompt('Rebook my last visit and pay with card'),
    ).toBe(false);
    expect(
      rescueRebookLastAppointmentIntent(
        'Rebook my last visit and pay with card',
        'rebook_last_appointment',
      ),
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
