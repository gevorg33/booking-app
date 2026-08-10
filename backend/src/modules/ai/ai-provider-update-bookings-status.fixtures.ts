/** ai-cmd-provider-5.16.1 — provider mobile: update_bookings status branches (in_progress / confirmed / pending), disambiguated from mark_visit_complete. */

export const PROVIDER_UPDATE_BOOKINGS_STATUS_PROMPT_SCENARIOS = [
  {
    id: 'update-bookings-start-service-en',
    prompt: 'Start service',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'in_progress',
  },
  {
    id: 'update-bookings-mark-in-progress-en',
    prompt: 'Mark in progress',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'in_progress',
  },
  {
    id: 'update-bookings-start-appointment-en',
    prompt: 'Start the appointment now',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'in_progress',
  },
  {
    id: 'update-bookings-begin-visit-en',
    prompt: 'Begin the visit',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'in_progress',
  },
  {
    id: 'update-bookings-set-confirmed-en',
    prompt: 'Set confirmed',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'confirmed',
  },
  {
    id: 'update-bookings-mark-confirmed-en',
    prompt: "Mark Jane's appointment confirmed",
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'confirmed',
  },
  {
    id: 'update-bookings-set-pending-en',
    prompt: 'Set this booking back to pending',
    surface: 'provider' as const,
    expectedAction: 'update_bookings',
    expectedStatus: 'pending',
  },
] as const;
