/** ai-cmd-provider-5.16.5 / 5.16.6 — static educational explainers for booking status badges and the floor status strip. */

export const PROVIDER_VISIT_STATUS_EXPLAINERS_CLASSIFIER_RULES = `- explain_booking_status_badge: READ — provider mobile only: explains what a booking status badge means (pending, confirmed, in progress, completed, no-show) shown on BookingDetailModal. Triggers: what does pending mean, why in progress, what does the confirmed badge mean, explain booking statuses. NOT update_bookings (changes status), NOT explain_floor_status (the check-in floor strip, not a single booking's badge).
- explain_floor_status: READ — provider mobile only: explains the check-in floor strip states (waiting/checked-in vs in service vs done) shown alongside team_floor_status. Triggers: waiting vs in service, what's checked in, explain the floor status, what does the floor strip show. NOT team_floor_status (live data read), NOT explain_booking_status_badge (single booking's status badge, not the floor strip).`;

export const PROVIDER_EXPLAIN_BOOKING_STATUS_BADGE_PROMPT_SCENARIOS = [
  { id: 'explain-status-badge-what-pending-en', prompt: 'What does pending mean?', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-why-in-progress-en', prompt: 'Why in progress?', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-what-confirmed-en', prompt: 'What does the confirmed badge mean?', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-explain-statuses-en', prompt: 'Explain booking statuses', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-what-no-show-en', prompt: 'What does no-show mean?', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-hy', prompt: 'Ի՞նչ է նշանակում pending կարգավիճակը', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
  { id: 'explain-status-badge-ru', prompt: 'Почему запись pending?', surface: 'provider' as const, expectedAction: 'explain_booking_status_badge' },
] as const;

export const PROVIDER_EXPLAIN_FLOOR_STATUS_PROMPT_SCENARIOS = [
  { id: 'explain-floor-status-waiting-vs-en', prompt: 'Waiting vs in service?', surface: 'provider' as const, expectedAction: 'explain_floor_status' },
  { id: 'explain-floor-status-whats-checked-in-en', prompt: "What's checked in?", surface: 'provider' as const, expectedAction: 'explain_floor_status' },
  { id: 'explain-floor-status-explain-en', prompt: 'Explain the floor status', surface: 'provider' as const, expectedAction: 'explain_floor_status' },
  { id: 'explain-floor-status-what-strip-en', prompt: 'What does the floor strip show?', surface: 'provider' as const, expectedAction: 'explain_floor_status' },
  { id: 'explain-floor-status-hy', prompt: 'Ի՞նչ է նշանակում floor status-ը', surface: 'provider' as const, expectedAction: 'explain_floor_status' },
  { id: 'explain-floor-status-ru', prompt: 'Что показывает floor status?', surface: 'provider' as const, expectedAction: 'explain_floor_status' },
] as const;
