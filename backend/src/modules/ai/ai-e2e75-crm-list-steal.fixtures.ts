/**
 * e2e-bug.75 — CRM `my_appointments` / `my_subscriptions` list rescues must not
 * clobber correctly classified self-service / intake / subscription mutates.
 */
export const E2E75_CLASSIFIED_MUST_SURVIVE = [
  {
    id: 'e2e75-cancel-my-booking',
    prompt: 'cancel my booking',
    classifiedAction: 'cancel_my_booking' as const,
  },
  {
    id: 'e2e75-cancel-dated-appointment',
    prompt: 'Please cancel my appointment scheduled for July 19, 2026',
    classifiedAction: 'cancel_my_booking' as const,
  },
  {
    id: 'e2e75-reschedule-next-week',
    prompt: 'reschedule my booking to next week',
    classifiedAction: 'reschedule_my_booking' as const,
  },
  {
    id: 'e2e75-cancel-my-subscription',
    prompt: 'cancel my subscription',
    classifiedAction: 'cancel_my_subscription' as const,
  },
  {
    id: 'e2e75-start-pre-visit-intake',
    prompt: 'I want to start my pre-visit intake questionnaire',
    classifiedAction: 'start_pre_visit_intake' as const,
  },
  {
    id: 'e2e75-confirm-booking-details',
    prompt: 'confirm my booking details',
    classifiedAction: 'confirm_my_booking_details' as const,
  },
  {
    id: 'e2e75-add-booking-to-calendar',
    prompt: 'add my booking to calendar',
    classifiedAction: 'add_booking_to_calendar' as const,
  },
] as const;

export const E2E75_DETECTOR_MUST_REJECT = [
  {
    id: 'e2e75-det-cancel-booking',
    prompt: 'cancel my booking',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-det-reschedule',
    prompt: 'reschedule my booking to next week',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-det-pre-visit',
    prompt: 'I want to start my pre-visit intake questionnaire',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-det-calendar',
    prompt: 'add my booking to calendar',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-det-confirm',
    prompt: 'confirm my booking details',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-det-cancel-subscription',
    prompt: 'cancel my subscription',
    kind: 'subscriptions' as const,
  },
] as const;

/** Genuine list reads — detectors must still match. */
export const E2E75_LIST_STILL_MATCHES = [
  {
    id: 'e2e75-still-show-appointments',
    prompt: 'Show my appointments',
    kind: 'appointments' as const,
  },
  {
    id: 'e2e75-still-show-subscriptions',
    prompt: 'Show my subscriptions',
    kind: 'subscriptions' as const,
  },
] as const;
