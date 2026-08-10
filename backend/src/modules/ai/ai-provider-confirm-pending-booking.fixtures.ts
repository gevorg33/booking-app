/** ai-cmd-provider-5.16.4 — confirm pending booking(s): bulk or single. */

export const PROVIDER_CONFIRM_PENDING_BOOKING_CLASSIFIER_RULES = `- confirm_pending_booking: MUTATE — provider mobile only: confirm one or all pending appointments (bulk when "all"/"today's"/no name given, single when a customerName is given). Filters to currently-pending bookings only. Triggers: confirm all pending today, accept Maria's booking, confirm Jane's appointment, approve all pending appointments. NOT confirm_booking_from_push (push-notification-originated confirm), NOT update_bookings (generic status branch, would touch any non-cancelled match not just pending).`;

export const PROVIDER_CONFIRM_PENDING_BOOKING_PROMPT_SCENARIOS = [
  {
    id: 'confirm-pending-all-today-en',
    prompt: 'Confirm all pending today',
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-accept-marias-en',
    prompt: "Accept Maria's booking",
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-janes-appointment-en',
    prompt: "Confirm Jane's appointment",
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-approve-all-en',
    prompt: 'Approve all pending appointments',
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-accept-en',
    prompt: "Accept Sam's pending appointment",
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-confirm-pending-bookings-en',
    prompt: 'Confirm my pending bookings',
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-hy',
    prompt: 'Հաստատիր բոլոր սպասող ամրագրումները',
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
  {
    id: 'confirm-pending-ru',
    prompt: 'Подтверди все ожидающие записи',
    surface: 'provider' as const,
    expectedAction: 'confirm_pending_booking',
  },
] as const;
