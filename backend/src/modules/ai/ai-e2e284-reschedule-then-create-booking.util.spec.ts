import {
  E2E284_NEGATIVE_CASES,
  E2E284_POSITIVE_CASES,
  E2E284_RESCUE_FROM_ACTIONS,
} from './ai-e2e284-reschedule-then-create-booking.fixtures.js';
import {
  decomposeRescheduleThenCreateBookingCompoundPrompt,
  isRescheduleThenCreateBookingCompoundPrompt,
  rescueRescheduleThenCreateBookingCompoundIntent,
} from './ai-reschedule-then-create-booking-compound.util.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';
import { isSingleRescheduleNearestContinuationPrompt } from './ai-find-soonest-appointment.util.js';

describe('e2e-bug.284 reschedule then create_booking compound', () => {
  it.each(E2E284_POSITIVE_CASES.map((row) => [row.id, row] as const))(
    'decomposes $id to reschedule → create',
    (_id, row) => {
      expect(isRescheduleThenCreateBookingCompoundPrompt(row.prompt)).toBe(
        true,
      );
      expect(isCompoundPrompt(row.prompt)).toBe(true);
      expect(isSingleRescheduleNearestContinuationPrompt(row.prompt)).toBe(
        false,
      );

      const steps = decomposeRescheduleThenCreateBookingCompoundPrompt(
        row.prompt,
      );
      expect(steps.map((s) => s.action)).toEqual([...row.orderedActions!]);

      if (row.expectCreateCustomerName) {
        expect(steps[1].params.customerName).toBe(row.expectCreateCustomerName);
      }
      if (row.expectCreateServiceName) {
        expect(
          String(steps[1].params.serviceName || '').toLowerCase(),
        ).toContain(row.expectCreateServiceName.toLowerCase());
      }

      const golden = matchGoldenCompoundPattern('dashboard', row.prompt);
      expect(golden?.source).toBe('golden');
      expect(golden?.steps.map((s) => s.action)).toEqual([
        ...row.orderedActions!,
      ]);

      const det = decomposeDeterministicForSurface('dashboard', row.prompt);
      expect(det?.steps.map((s) => s.action)).toEqual([...row.orderedActions!]);
    },
  );

  it.each(E2E284_NEGATIVE_CASES.map((row) => [row.id, row] as const))(
    'does not match negative $id',
    (_id, row) => {
      expect(isRescheduleThenCreateBookingCompoundPrompt(row.prompt)).toBe(
        false,
      );
      expect(
        decomposeRescheduleThenCreateBookingCompoundPrompt(row.prompt),
      ).toEqual([]);
    },
  );

  it.each(E2E284_RESCUE_FROM_ACTIONS.map((action) => [action] as const))(
    'rescues misclassified %s to compound_intent',
    (action) => {
      const prompt = E2E284_POSITIVE_CASES[0].prompt;
      expect(
        rescueRescheduleThenCreateBookingCompoundIntent(prompt, action),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'reschedule_then_create_booking_compound',
      });
    },
  );

  it('rescue is idempotent for compound_intent', () => {
    expect(
      rescueRescheduleThenCreateBookingCompoundIntent(
        E2E284_POSITIVE_CASES[0].prompt,
        'compound_intent',
      ),
    ).toBeNull();
  });
});
