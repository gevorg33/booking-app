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
    id: 'e2e96-anonymous-empty-manageToken',
    prompt: 'confirm my booking details',
    params: {
      bookingId: 'book-1',
      manageToken: '',
    } as Record<string, unknown>,
    expectFindOneCalled: false,
  },
  {
    id: 'e2e96-anonymous-wrong-manageToken',
    prompt: 'summarize this booking',
    params: {
      bookingId: 'book-1',
      manageToken: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
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
  {
    id: 'e2e96-token-swap-other-booking-token',
    prompt: 'what is this booking',
    params: {
      bookingId: 'book-1',
      manageToken: 'tok-other-booking',
    } as Record<string, unknown>,
    expectFindOneCalled: true,
  },
] as const;

export type E2e96ConfirmBookingIdorScenario =
  (typeof E2E96_CONFIRM_BOOKING_IDOR_SCENARIOS)[number];

/**
 * e2e-bug.261 — inbound public assistant context must strip forgeable identity.
 */
export const E2E261_INBOUND_CONTEXT_SANITIZE_SCENARIOS = [
  {
    id: 'e2e261-strip-forged-customerId',
    dtoContext: {
      bookingId: 'book-1',
      customerId: 'cust-victim',
      manageToken: undefined,
    },
    authCustomerId: null,
    expectCustomerId: undefined,
    expectBookingId: 'book-1',
  },
  {
    id: 'e2e261-strip-sessionCustomerId',
    dtoContext: {
      bookingId: 'book-1',
      sessionCustomerId: 'cust-victim',
    },
    authCustomerId: null,
    expectCustomerId: undefined,
    expectBookingId: 'book-1',
  },
  {
    id: 'e2e261-auth-wins-over-forge',
    dtoContext: {
      customerId: 'cust-attacker-forge',
      bookingId: 'book-1',
    },
    authCustomerId: 'cust-real',
    authEmail: 'real@example.com',
    expectCustomerId: 'cust-real',
    expectBookingId: 'book-1',
  },
  {
    id: 'e2e261-keep-manage-fields',
    dtoContext: {
      bookingId: 'book-1',
      manageToken: 'tok-valid',
      customerId: 'cust-forge',
    },
    authCustomerId: null,
    expectCustomerId: undefined,
    expectBookingId: 'book-1',
    expectManageToken: 'tok-valid',
  },
] as const;
