/**
 * e2e-bug.264 — mark_multi_service_step_done must resolve customerName
 * when bookingId/session booking is absent.
 */

export type E2e264ExtractCase = {
  id: string;
  prompt: string;
  params?: Record<string, unknown>;
  expectedCustomerName: string | null;
};

export const E2E264_EXTRACT_CASES: readonly E2e264ExtractCase[] = [
  {
    id: 'e2e264-extract-for-spa-day-qa',
    prompt: 'Finish step 1 for Spa Day QA',
    expectedCustomerName: 'Spa Day QA',
  },
  {
    id: 'e2e264-extract-for-jane',
    prompt: 'Complete blowdry leg for Jane',
    expectedCustomerName: 'Jane',
  },
  {
    id: 'e2e264-extract-params-win',
    prompt: 'Finish step 1',
    params: { customerName: 'Maria Lopez' },
    expectedCustomerName: 'Maria Lopez',
  },
  {
    id: 'e2e264-extract-no-name',
    prompt: 'Finish step 1 of spa day',
    expectedCustomerName: null,
  },
  {
    id: 'e2e264-extract-possessive',
    prompt: "Finish step 2 for Sam's visit",
    expectedCustomerName: 'Sam',
  },
];

export const E2E264_LIVE_SCENARIOS = [
  {
    id: 'e2e264-live-customerName-step1-no-bookingId',
    prompt: 'Finish step 1 for Spa Day QA',
    expectAction: 'mark_multi_service_step_done',
    expectLeg1Completed: true,
  },
  {
    id: 'e2e264-live-customerName-leg-service',
    prompt: 'Complete hairdrying leg for Spa Day QA',
    expectAction: 'mark_multi_service_step_done',
    expectLeg1Completed: true,
  },
  {
    id: 'e2e264-live-no-name-still-clarify',
    prompt: 'Finish step 1 of spa day',
    expectAction: 'mark_multi_service_step_done',
    expectClarifyOpenBooking: true,
  },
  {
    id: 'e2e264-live-unknown-customer-clarify',
    prompt: 'Finish step 1 for Nobody Matching',
    expectAction: 'mark_multi_service_step_done',
    expectClarify: true,
  },
  {
    id: 'e2e264-live-session-bookingId-still-works',
    prompt: 'Finish step 1',
    expectAction: 'mark_multi_service_step_done',
    useSessionBookingId: true,
    expectLeg1Completed: true,
  },
  {
    id: 'e2e264-live-two-groups-same-name-clarify',
    prompt: 'Finish step 1 for Twin Group QA',
    expectAction: 'mark_multi_service_step_done',
    expectClarifyMultiGroup: true,
  },
] as const;
