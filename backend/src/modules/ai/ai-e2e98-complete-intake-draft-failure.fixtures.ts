/**
 * e2e-bug.98 — ensureCustomerDraft failures must surface as success:false,
 * never a navigate-only false-positive "Completed" compound summary.
 */
export const E2E98_COMPLETE_INTAKE_DRAFT_FAILURE_SCENARIOS = [
  {
    id: 'e2e98-no-published-questionnaire',
    prompt: 'Fill out my pre-visit intake and then book my lab test',
    thrownMessage:
      'No published intake questionnaire is configured for this clinic',
  },
  {
    id: 'e2e98-not-lab-test-service',
    prompt: 'Fill intake and book blood draw',
    thrownMessage: 'Pre-visit intake is only available for lab test bookings',
  },
] as const;

export type E2e98CompleteIntakeDraftFailureScenario =
  (typeof E2E98_COMPLETE_INTAKE_DRAFT_FAILURE_SCENARIOS)[number];
