/**
 * e2e-bug.134 — guest manage-link cancel must route to cancel_booking_with_token
 * (not my_appointments / cancel_my_booking sign-in dead-ends).
 */
export const E2E134_GUEST_MANAGE_LINK_CANCEL_SCENARIOS = [
  {
    id: 'cancel-with-manage-url-please',
    prompt:
      'Please cancel my booking https://example.com/manage?bookingId=book-abc-123&token=tok-xyz-456',
    expectedAction: 'cancel_booking_with_token' as const,
    misclassifiedAction: 'my_appointments' as const,
    surface: 'public' as const,
    bookingId: 'book-abc-123',
    manageToken: 'tok-xyz-456',
  },
  {
    id: 'cancel-with-manage-url-short',
    prompt:
      'Cancel my booking https://book.salon.test/manage?bookingId=aaa-111&token=bbb-222',
    expectedAction: 'cancel_booking_with_token' as const,
    misclassifiedAction: 'cancel_my_booking' as const,
    surface: 'public' as const,
    bookingId: 'aaa-111',
    manageToken: 'bbb-222',
  },
  {
    id: 'cancel-using-this-link',
    prompt:
      'Cancel using this link https://app.test/salon/manage?bookingId=c1d2e3f4&token=tok-99',
    expectedAction: 'cancel_booking_with_token' as const,
    misclassifiedAction: 'unknown' as const,
    surface: 'customer' as const,
    bookingId: 'c1d2e3f4',
    manageToken: 'tok-99',
  },
  {
    id: 'cancel-appointment-manage-url',
    prompt:
      'Please cancel my appointment https://example.com/manage?bookingId=appt-1&token=secret-1',
    expectedAction: 'cancel_booking_with_token' as const,
    misclassifiedAction: 'my_appointments' as const,
    surface: 'customer' as const,
    bookingId: 'appt-1',
    manageToken: 'secret-1',
  },
  {
    id: 'reschedule-with-manage-url',
    prompt:
      'Reschedule my booking to Friday 2pm https://example.com/manage?bookingId=book-9&token=tok-9',
    expectedAction: 'reschedule_booking_with_token' as const,
    misclassifiedAction: 'reschedule_my_booking' as const,
    surface: 'public' as const,
    bookingId: 'book-9',
    manageToken: 'tok-9',
  },
  {
    id: 'explain-can-i-cancel-with-link',
    prompt:
      'Can I still cancel this? https://example.com/manage?bookingId=book-7&token=tok-7',
    expectedAction: 'explain_manage_booking_context' as const,
    misclassifiedAction: 'explain_cancel_policy' as const,
    surface: 'public' as const,
    bookingId: 'book-7',
    manageToken: 'tok-7',
  },
] as const;

export const E2E134_MY_APPOINTMENTS_MUST_NOT_MATCH = [
  {
    id: 'cancel-my-booking-plain',
    prompt: 'Please cancel my booking',
  },
  {
    id: 'cancel-with-manage-url',
    prompt:
      'Please cancel my booking https://example.com/manage?bookingId=x&token=y',
  },
  {
    id: 'reschedule-my-appointment',
    prompt: 'Reschedule my appointment to tomorrow',
  },
] as const;

export const E2E134_MY_APPOINTMENTS_STILL_MATCH = [
  {
    id: 'show-my-appointments',
    prompt: 'Show my appointments',
  },
  {
    id: 'list-my-bookings',
    prompt: 'List my bookings',
  },
] as const;
