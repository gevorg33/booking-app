/**
 * e2e-bug.52 — my_appointments must include navigate to Account bookings
 * (public assistant UI only shows summary + navigate).
 */
export const E2E52_MY_APPOINTMENTS_NAVIGATE_CASES = [
  {
    id: 'e2e52-empty',
    appointments: [] as unknown[],
    expectedSummary: 'You have 0 appointment(s) on record.',
  },
  {
    id: 'e2e52-with-appointments',
    appointments: [
      { id: 'b1', serviceName: 'facemassage' },
      { id: 'b2', serviceName: 'haircut' },
    ],
    expectedSummary: 'You have 2 appointment(s) on record.',
  },
] as const;

export const E2E52_EXPECTED_NAVIGATE = {
  path: 'account' as const,
  query: { tab: 'bookings' },
};
