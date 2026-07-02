import {
  CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES,
  extractAddBookingToCalendarFormatFromPrompt,
  isAddBookingToCalendarPrompt,
  parseAddBookingToCalendarFromPrompt,
  rescueAddBookingToCalendarIntent,
} from './ai-add-booking-to-calendar.util.js';
import { ADD_BOOKING_TO_CALENDAR_PROMPTS } from './ai-add-booking-to-calendar.fixtures.js';
import { ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_SCENARIOS } from './ai-add-booking-to-calendar-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_ADD_BOOKING_TO_CALENDAR_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import { isConfirmMyBookingDetailsPrompt } from './ai-confirm-my-booking-details.util.js';

describe('ai-add-booking-to-calendar.util (ai-cmd-customer-4.3.2)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_PUBLIC_ADD_BOOKING_TO_CALENDAR_CLASSIFIER_RULES).toContain(
      'add_booking_to_calendar',
    );
  });

  it.each(ADD_BOOKING_TO_CALENDAR_PROMPTS.map((row) => [row.id, row] as const))(
    'detects add booking to calendar prompt $id',
    (_id, row) => {
      expect(isAddBookingToCalendarPrompt(row.prompt)).toBe(true);
      expect(parseAddBookingToCalendarFromPrompt(row.prompt)?.format).toBe(
        row.format,
      );
    },
  );

  it.each(ADD_BOOKING_TO_CALENDAR_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues add booking to calendar prompt $id from unknown',
    (_id, row) => {
      expect(
        rescueAddBookingToCalendarIntent(row.prompt, 'unknown')?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(
    ADD_BOOKING_TO_CALENDAR_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual add booking to calendar prompt $id', (_id, row) => {
    expect(isAddBookingToCalendarPrompt(row.prompt)).toBe(true);
  });

  it('does not steal confirm_my_booking_details', () => {
    expect(isAddBookingToCalendarPrompt('What time is my appointment?')).toBe(
      false,
    );
    expect(
      isConfirmMyBookingDetailsPrompt('What time is my appointment?'),
    ).toBe(true);
  });

  it('extracts format from phrasing', () => {
    expect(
      extractAddBookingToCalendarFormatFromPrompt('Send me an ICS file'),
    ).toBe('ics');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      ADD_BOOKING_TO_CALENDAR_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      ADD_BOOKING_TO_CALENDAR_PROMPTS.filter((row) => row.surface === 'public')
        .length,
    ).toBeGreaterThanOrEqual(10);
    for (const evalCase of AI_COMMAND_EVAL_ADD_BOOKING_TO_CALENDAR_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
