/**
 * e2e-bug.96 / e2e-bug.128 — confirm_my_booking_details must never leak
 * booking PII from bookingId alone (no session / no valid manage token).
 */
export const E2E96_CONFIRM_BOOKING_IDOR_SCENARIOS = [
  {
    id: 'e2e96-anonymous-bookingId-only',
    prompt: 'what is this booking',
    params: { bookingId: 'book-1' } as Record<string, unknown>,
    expectFindOneCalled: false,
  },
  {
    id: 'e2e96-anonymous-garbage-manageToken',
    prompt: 'what is this booking',
    params: {
      bookingId: 'book-1',
      manageToken: '00000000-0000-0000-0000-000000000000',
    } as Record<string, unknown>,
    expectFindOneCalled: true,
  },
  {
    id: 'e2e96-signed-in-other-customer-bookingId',
    prompt: 'summarize my booking',
    params: {
      bookingId: 'book-stranger',
      sessionCustomerId: 'cust-attacker',
    } as Record<string, unknown>,
    expectFindOneCalled: true,
    expectOwnedQuery: true,
  },
] as const;

export type E2e96ConfirmBookingIdorScenario =
  (typeof E2E96_CONFIRM_BOOKING_IDOR_SCENARIOS)[number];
