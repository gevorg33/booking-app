/**
 * e2e-bug.94 — "soonest / next available appointment" read prompts must not
 * collapse into how_to_download_app or clinic explain_result_status; mutate
 * "book … earliest slot" stays book_nearest_slot.
 */
export const E2E94_SOONEST_APPOINTMENT_SCENARIOS = [
  {
    id: 'e2e94-soonest-get-appointment',
    prompt: "what's the soonest I can get an appointment?",
    surface: 'public' as const,
    misclassifiedAction: 'how_to_download_app',
    expectedAction: 'find_soonest_appointment',
    expectServiceName: false,
  },
  {
    id: 'e2e94-next-available-opening',
    prompt: "when's your next available opening?",
    surface: 'public' as const,
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'find_soonest_appointment',
    expectServiceName: false,
  },
  {
    id: 'e2e94-soonest-unknown',
    prompt: "what's the soonest I can get an appointment?",
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'find_soonest_appointment',
    expectServiceName: false,
  },
  {
    id: 'e2e94-next-available-unknown',
    prompt: "when's your next available opening?",
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'find_soonest_appointment',
    expectServiceName: false,
  },
] as const;

export const E2E94_BOOK_NEAREST_MUTATE_SCENARIOS = [
  {
    id: 'e2e94-book-earliest-slot',
    prompt: 'book me the earliest possible slot',
    surface: 'public' as const,
    expectedAction: 'book_nearest_slot',
  },
] as const;
