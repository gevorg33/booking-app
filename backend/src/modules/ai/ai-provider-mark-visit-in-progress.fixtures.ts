/** ai-cmd-provider-5.16.2 — dedicated alias for update_bookings(status=in_progress). */

export const PROVIDER_MARK_VISIT_IN_PROGRESS_CLASSIFIER_RULES = `- mark_visit_in_progress: MUTATE — provider mobile only: dedicated alias of update_bookings(status=in_progress) — starts the visit now. Requires bookingId (session) and/or customerName. Triggers: begin Jane's color, start appointment now, start the service, begin this visit, mark Sam's appointment as started. NOT mark_visit_complete (finishes the visit), NOT check_in_client (arrival, before the service starts).`;

export const PROVIDER_MARK_VISIT_IN_PROGRESS_PROMPT_SCENARIOS = [
  { id: 'mark-visit-in-progress-begin-color-en', prompt: "Begin Jane's color", surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-start-appointment-en', prompt: 'Start appointment now', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-start-service-en', prompt: 'Start service', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-begin-visit-en', prompt: 'Begin the visit', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-mark-en', prompt: 'Mark in progress', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-start-sams-en', prompt: "Start Sam's appointment", surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-mark-sams-started-en', prompt: "Mark Sam's appointment as started", surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-begin-haircut-en', prompt: "Begin Emma's haircut now", surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-hy', prompt: 'Սկսիր սպասարկումը', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
  { id: 'mark-visit-in-progress-ru', prompt: 'Начни обслуживание', surface: 'provider' as const, expectedAction: 'mark_visit_in_progress' },
] as const;
