import {
  E2E344_LEGIT_THIS_BOOKING_CONTROL_CASES,
  E2E344_THIS_PERIOD_CASES,
} from './ai-e2e344-this-period-not-booking-context.fixtures.js';
import { isConfirmMyBookingDetailsPrompt } from './ai-confirm-my-booking-details.util.js';
import { isCheckProvidersForServicePrompt } from './ai-payments.util.js';

describe('e2e-bug.344: "this <period>" temporal phrase must not hijack availability questions into confirm_my_booking_details', () => {
  it.each(E2E344_THIS_PERIOD_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(
        row.expectConfirmMyBookingDetails,
      );
      expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(
        row.expectCheckProvidersForService,
      );
    },
  );

  it.each(
    E2E344_LEGIT_THIS_BOOKING_CONTROL_CASES.map(
      (row) => [row.id, row] as const,
    ),
  )('%s — legit "this booking/appointment" unaffected', (_id, row) => {
    expect(isConfirmMyBookingDetailsPrompt(row.prompt)).toBe(
      row.expectConfirmMyBookingDetails,
    );
    expect(isCheckProvidersForServicePrompt(row.prompt)).toBe(
      row.expectCheckProvidersForService,
    );
  });
});
