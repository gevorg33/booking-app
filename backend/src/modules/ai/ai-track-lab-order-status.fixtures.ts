export type TrackLabOrderStatusPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'track_lab_order_status';
  rescueReason: 'track_lab_order';
  testName?: string;
};

export const CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES = `- track_lab_order_status: READ — clinic only, logged-in customer: track whether lab results/orders are ready yet (released vs still processing). Triggers: are my results ready, track my lab order, lab order status, where is my blood work, has my lab come back, is my CBC ready yet. Optional testName when a specific panel/test is named. Summarize ready (Released) vs in-progress statuses from the customer's account. Requires sign-in. NOT list_my_test_results (show/list/open/browse My Results without readiness focus), NOT explain_result_status (what does pending/released mean, why not showing FAQ), NOT notify_when_results_ready (text/notify me when ready — read explain), NOT list_my_lab_booking_requests (book collection appointments), NOT notify_patient_result_ready (staff). Customer app only — NOT public booking page.`;

export const TRACK_LAB_ORDER_STATUS_PROMPTS: readonly TrackLabOrderStatusPromptFixture[] =
  [
    {
      id: 'are-my-results-ready',
      prompt: 'Are my results ready?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'any-results-ready',
      prompt: 'Are any of my test results ready?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'my-cbc-ready',
      prompt: 'Do I have any CBC results ready?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
      testName: 'CBC',
    },
    {
      id: 'track-lab-order',
      prompt: 'Track my lab order',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'lab-order-status',
      prompt: 'Lab order status',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'status-of-lab-order',
      prompt: 'What is the status of my lab order?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'where-blood-work',
      prompt: 'Where is my blood work?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'has-lab-come-back',
      prompt: 'Has my lab work come back yet?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'is-lab-done',
      prompt: 'Is my lab test done?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'check-if-ready',
      prompt: 'Check if my test results are ready',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'lipid-ready',
      prompt: 'Is my lipid panel ready yet?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
      testName: 'lipid panel',
    },
    {
      id: 'any-available',
      prompt: 'Do I have test results available?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
    },
    {
      id: 'where-cbc-result',
      prompt: 'Where is my CBC result?',
      surface: 'customer',
      expectedAction: 'track_lab_order_status',
      rescueReason: 'track_lab_order',
      testName: 'CBC',
    },
  ];

export const TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS = [
  {
    id: 'appointments-to-track-ready',
    prompt: 'Are my results ready?',
    misclassifiedAction: 'my_appointments',
    expectedAction: 'track_lab_order_status' as const,
  },
  {
    id: 'list-to-track-order-status',
    prompt: 'Track my lab order',
    misclassifiedAction: 'list_my_test_results',
    expectedAction: 'track_lab_order_status' as const,
  },
  {
    id: 'explain-to-track-ready',
    prompt: 'Are any of my test results ready?',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'track_lab_order_status' as const,
  },
  {
    id: 'lab-booking-to-track',
    prompt: 'Where is my blood work?',
    misclassifiedAction: 'list_my_lab_booking_requests',
    expectedAction: 'track_lab_order_status' as const,
  },
] as const;
