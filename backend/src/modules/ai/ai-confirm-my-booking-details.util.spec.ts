import {
  CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES,
  extractConfirmMyBookingDetailsAspectFromPrompt,
  isConfirmMyBookingDetailsPrompt,
  parseConfirmMyBookingDetailsFromPrompt,
  rescueConfirmMyBookingDetailsIntent,
} from './ai-confirm-my-booking-details.util.js';
import { CONFIRM_MY_BOOKING_DETAILS_PROMPTS } from './ai-confirm-my-booking-details.fixtures.js';
import { CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_SCENARIOS } from './ai-confirm-my-booking-details-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_CONFIRM_MY_BOOKING_DETAILS_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { isListMyAppointmentsPrompt } from './ai-self-service-booking.util.js';
import { isListMyUpcomingAppointmentsPrompt } from './ai-list-my-upcoming-appointments.util.js';

describe('ai-confirm-my-booking-details.util (ai-cmd-customer-4.3.1)', () => {
  it('exports classifier rules', () => {
    expect(
      CUSTOMER_PUBLIC_CONFIRM_MY_BOOKING_DETAILS_CLASSIFIER_RULES,
    ).toContain('confirm_my_booking_details');
  });

  it.each(
    CONFIRM_MY_BOOKING_DETAILS_PROMPTS.map((row) => [row.id, row] as const),
  )('detects confirm booking details prompt $id', (_id, row) => {
    expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(true);
    expect(parseConfirmMyBookingDetailsFromPrompt(row.prompt)?.aspect).toBe(
      row.aspect,
    );
  });

  it.each(
    CONFIRM_MY_BOOKING_DETAILS_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues confirm booking details prompt $id from unknown', (_id, row) => {
    expect(
      rescueConfirmMyBookingDetailsIntent(row.prompt, 'unknown')?.action,
    ).toBe(row.expectedAction);
  });

  it.each(
    CONFIRM_MY_BOOKING_DETAILS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual confirm booking details prompt $id', (_id, row) => {
    expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(true);
  });

  it('does not steal list_my_upcoming_appointments', () => {
    expect(
      isConfirmMyBookingDetailsPrompt('List my upcoming appointments'),
    ).toBe(false);
    expect(
      isListMyUpcomingAppointmentsPrompt('List my upcoming appointments'),
    ).toBe(true);
  });

  it('does not steal list_my_appointments for general list', () => {
    expect(isConfirmMyBookingDetailsPrompt('List my appointments')).toBe(false);
    expect(isListMyAppointmentsPrompt('List my appointments')).toBe(true);
  });

  it('extracts aspect from phrasing', () => {
    expect(
      extractConfirmMyBookingDetailsAspectFromPrompt(
        'Who is my appointment with?',
      ),
    ).toBe('provider');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      CONFIRM_MY_BOOKING_DETAILS_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      CONFIRM_MY_BOOKING_DETAILS_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_CONFIRM_MY_BOOKING_DETAILS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
