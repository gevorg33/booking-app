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

  it('e2e-bug.111 — does not steal leave_visit_review prompts', () => {
    expect(
      isConfirmMyBookingDetailsPrompt(
        'leave a 5 star review for my facemassage visit',
      ),
    ).toBe(false);
    expect(
      isConfirmMyBookingDetailsPrompt(
        'I want to leave a review for my last visit',
      ),
    ).toBe(false);
    expect(
      rescueConfirmMyBookingDetailsIntent(
        'leave a 5 star review for my facemassage visit',
        'unknown',
      ),
    ).toBeNull();
  });

  it('e2e-bug.230 — does not steal subscription vs pay-per-visit compare', () => {
    expect(
      isConfirmMyBookingDetailsPrompt(
        'should I get the subscription or just pay per visit?',
      ),
    ).toBe(false);
    expect(
      isConfirmMyBookingDetailsPrompt(
        'subscription or pay per visit which is better?',
      ),
    ).toBe(false);
    expect(
      rescueConfirmMyBookingDetailsIntent(
        'should I get the subscription or just pay per visit?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('e2e-bug.236 — does not steal report/complaint phrasing', () => {
    for (const prompt of [
      'report a booking problem — wrong time on my appointment',
      'something went wrong with my booking please report it to support',
      'file a complaint about my appointment',
    ]) {
      expect(isConfirmMyBookingDetailsPrompt(prompt)).toBe(false);
      expect(rescueConfirmMyBookingDetailsIntent(prompt, 'unknown')).toBeNull();
    }
  });

  it('e2e-bug.258 — does not steal short Armenian how-to-book', () => {
    for (const prompt of [
      'Ինչպես ամրագրել',
      'Ինչպե՞ս ամրագրել',
      'Ինչպես ամրագրել այցելություն',
      'Ինչպես ամրագրեմ',
    ]) {
      expect(isConfirmMyBookingDetailsPrompt(prompt)).toBe(false);
      expect(rescueConfirmMyBookingDetailsIntent(prompt, 'unknown')).toBeNull();
    }
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
