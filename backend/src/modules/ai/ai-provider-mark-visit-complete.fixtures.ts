/** ai-cmd-provider-5.2.7 — provider mobile dedicated "mark visit complete" shortcut, disambiguated from mark_paid. */

export const PROVIDER_MARK_VISIT_COMPLETE_CLASSIFIER_RULES = `- mark_visit_complete: MUTATE — provider mobile only: dedicated shortcut for marking an appointment's visit status as completed (same booking resolution as update_bookings, status=completed, no payment change). Triggers: mark done, finish this appointment, wrap up this visit, done with this client, mark this visit complete. NOT mark_paid (payment status, not visit status), NOT update_bookings when the request also specifies a different status (no-show/in-progress) or a payment change.`;

export const PROVIDER_MARK_VISIT_COMPLETE_PROMPT_SCENARIOS = [
  {
    id: 'mark-visit-complete-mark-done-en',
    prompt: 'Mark done',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-finish-appointment-en',
    prompt: 'Finish this appointment',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-wrap-up-visit-en',
    prompt: 'Wrap up this visit',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-done-with-client-en',
    prompt: "I'm done with this client",
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-mark-visit-en',
    prompt: 'Mark this visit as complete',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-mark-appointment-en',
    prompt: 'Mark the appointment as completed',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-done-with-jane-en',
    prompt: "Done with Jane's appointment",
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-finish-up-en',
    prompt: 'Finish up this appointment',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-all-done-en',
    prompt: "We're all done here, mark it complete",
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-wrap-visit-sam-en',
    prompt: "Wrap up Sam's visit",
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
    paramsPartial: { status: 'completed' },
  },
  {
    id: 'mark-visit-complete-hy',
    prompt: 'Նշիր որպես ավարտված',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-finish-hy',
    prompt: 'Ավարտիր այս այցելությունը',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-ru',
    prompt: 'Отметь как завершено',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
  {
    id: 'mark-visit-complete-finish-ru',
    prompt: 'Заверши этот визит',
    surface: 'provider' as const,
    expectedAction: 'mark_visit_complete',
  },
] as const;
