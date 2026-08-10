/**
 * e2e-bug.133 — tour capacity-gated booking must not route to clinic
 * explain_result_status ("Lab result status help is only available for clinic…").
 */
export const E2E133_TOUR_VS_CLINIC_SCENARIOS = [
  {
    id: 'sunset-coastal-drive-5-guests',
    prompt:
      'Sunset Coastal Drive for 5 guests — reserve when seats are available',
    expectedAction: 'compound_intent' as const,
    expectedRescueReason: 'tour_group_checkout_compound' as const,
    expectedServiceName: 'Sunset Coastal Drive',
    expectedPaxCount: 5,
    misclassifiedAction: 'explain_result_status' as const,
    surface: 'public' as const,
  },
  {
    id: 'sunset-coastal-drive-customer',
    prompt:
      'Sunset Coastal Drive for 5 guests — reserve when seats are available',
    expectedAction: 'compound_intent' as const,
    expectedRescueReason: 'tour_group_checkout_compound' as const,
    expectedServiceName: 'Sunset Coastal Drive',
    expectedPaxCount: 5,
    misclassifiedAction: 'explain_result_status' as const,
    surface: 'customer' as const,
  },
  {
    id: 'coastal-drive-unknown',
    prompt: 'Coastal Drive for 4 people — book when seats are available',
    expectedAction: 'compound_intent' as const,
    expectedRescueReason: 'tour_group_checkout_compound' as const,
    expectedServiceName: 'Coastal Drive',
    expectedPaxCount: 4,
    misclassifiedAction: 'unknown' as const,
    surface: 'public' as const,
  },
  {
    id: 'sunset-hike-fixture-parity',
    prompt: 'Sunset hike for 5 guests — reserve when seats are available',
    expectedAction: 'compound_intent' as const,
    expectedRescueReason: 'tour_group_checkout_compound' as const,
    expectedServiceName: 'Sunset hike',
    expectedPaxCount: 5,
    misclassifiedAction: 'explain_result_status' as const,
    surface: 'public' as const,
  },
] as const;

export const E2E133_CLINIC_WHEN_AVAILABLE_STILL_MATCH = [
  {
    id: 'when-lab-results-available',
    prompt: 'When will my lab results be available?',
  },
  {
    id: 'when-results-ready',
    prompt: 'When will my test results be ready?',
  },
] as const;
