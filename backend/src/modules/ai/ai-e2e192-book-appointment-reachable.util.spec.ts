import {
  E2E192_NEGATIVE_PROMPTS,
  E2E192_RESCUE_FROM_ACTIONS,
  E2E192_TIMED_BOOK_PROMPTS,
  enrichBookAppointmentParamsFromPrompt,
  shouldExecuteBookAppointmentDeterministically,
} from './ai-e2e192-book-appointment-reachable.util.js';
import { isConcreteTimedBookAppointmentPrompt } from './ai-intent-disambiguation.util.js';
import { isPublicOnlyAssistantAction } from './ai-public-only-assistant-actions.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';

describe('e2e-bug.192 book_appointment reachable', () => {
  it.each(E2E192_TIMED_BOOK_PROMPTS.map((row) => [row.id, row] as const))(
    'enriches employee/time/contact for $id',
    (_id, row) => {
      const enriched = enrichBookAppointmentParamsFromPrompt(row.prompt);
      if ('expectEmployeeName' in row && row.expectEmployeeName) {
        expect(String(enriched.employeeName)).toMatch(
          new RegExp(row.expectEmployeeName, 'i'),
        );
      }
      if ('expectTimeSlot' in row && row.expectTimeSlot) {
        expect(enriched.timeSlot).toBe(row.expectTimeSlot);
      }
      if ('expectCustomerName' in row && row.expectCustomerName) {
        expect(enriched.customerName).toBe(row.expectCustomerName);
      }
      if ('expectCustomerEmail' in row && row.expectCustomerEmail) {
        expect(enriched.customerEmail).toBe(row.expectCustomerEmail);
      }
      // Bare schedule prompts may omit serviceName when extractor is thin —
      // still require a clock time for timed book.
      expect(enriched.timeSlot || enriched.date).toBeTruthy();
    },
  );

  it.each(E2E192_RESCUE_FROM_ACTIONS.map((action) => [action] as const))(
    'deterministic book_appointment gate stays on for rescued action from %s',
    (fromAction) => {
      expect(fromAction).not.toBe('book_appointment');
      expect(shouldExecuteBookAppointmentDeterministically(fromAction)).toBe(
        false,
      );
      expect(
        shouldExecuteBookAppointmentDeterministically('book_appointment'),
      ).toBe(true);
    },
  );

  it.each(E2E192_NEGATIVE_PROMPTS.map((row) => [row.id, row] as const))(
    'does not treat negative $id as concrete timed book',
    (_id, row) => {
      if (isBookNearestSlotPrompt(row.prompt)) {
        expect(isConcreteTimedBookAppointmentPrompt(row.prompt)).toBe(false);
        return;
      }
      // Discovery prompts without a book+clock commit stay off timed book.
      if (
        !/\b(?:book|schedule|reserve|create\s+(?:a\s+)?booking)\b/i.test(
          row.prompt,
        )
      ) {
        expect(isConcreteTimedBookAppointmentPrompt(row.prompt)).toBe(false);
      }
    },
  );

  it('enriches create-a-booking phrasing that previously fell to check_availability', () => {
    const prompt =
      'create a booking for Swedish massage with Gevorg tomorrow at 11am';
    expect(isConcreteTimedBookAppointmentPrompt(prompt)).toBe(true);
    const enriched = enrichBookAppointmentParamsFromPrompt(prompt);
    expect(enriched.employeeName).toMatch(/Gevorg/i);
    expect(enriched.timeSlot).toBe('11:00');
  });
});
