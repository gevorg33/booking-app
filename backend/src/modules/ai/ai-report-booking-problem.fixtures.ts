export type ReportBookingProblemAspect =
  | 'visit_issue'
  | 'billing_issue'
  | 'general';

export type ReportBookingProblemPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'report_booking_problem';
  rescueReason: 'report_booking_problem';
  aspect?: ReportBookingProblemAspect;
  serviceName?: string;
};

export const CUSTOMER_REPORT_BOOKING_PROBLEM_CLASSIFIER_RULES = `- report_booking_problem: MUTATE — logged-in customer reports a problem with their own booking/visit (visit went wrong, bad experience, double charge, billing issue, wrong appointment time, file a complaint). Triggers: something went wrong with my visit/booking, I was charged twice, report a booking problem, report a problem with my appointment, file a complaint about my appointment, please report it to support. Set bookingId when known; otherwise serviceName and/or date. Uses POST /me/support/ticket (Zendesk) when profile email exists, otherwise web support handoff. NOT leave_visit_review (rate/review), NOT explain_post_visit_review_prompt (popup explain), NOT contact_support (generic salon help without booking/visit issue), NOT confirm_my_booking_details (summary readout — never steal report/complaint phrasing), NOT cancel_my_booking.`;

export const REPORT_BOOKING_PROBLEM_PROMPTS: readonly ReportBookingProblemPromptFixture[] =
  [
    {
      id: 'something-wrong-visit-customer',
      prompt: 'Something went wrong with my visit',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'charged-twice-customer',
      prompt: 'I was charged twice',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
    },
    {
      id: 'report-problem-appointment-customer',
      prompt: 'Report a problem with my appointment',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
    },
    {
      id: 'bad-experience-haircut-customer',
      prompt: 'Bad experience at my haircut yesterday',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
      serviceName: 'haircut',
    },
    {
      id: 'wrong-charge-massage-customer',
      prompt: 'Wrong charge on my massage booking',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
      serviceName: 'massage',
    },
    {
      id: 'issue-with-visit-customer',
      prompt: 'I have an issue with my visit',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'double-billed-customer',
      prompt: 'I got double billed for my booking',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
    },
    {
      id: 'complaint-about-visit-customer',
      prompt: 'I want to complain about my last visit',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'support-ticket-booking-customer',
      prompt: 'Open a support ticket for my booking',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
    },
    {
      id: 'problem-after-appointment-customer',
      prompt: 'There was a problem after my appointment',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
    {
      id: 'refund-issue-customer',
      prompt: 'Billing issue — I need a refund for my visit',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'billing_issue',
    },
    {
      id: 'could-be-better-customer',
      prompt: 'My visit could be better — please tell the salon',
      surface: 'customer',
      expectedAction: 'report_booking_problem',
      rescueReason: 'report_booking_problem',
      aspect: 'visit_issue',
    },
  ];

export const REPORT_BOOKING_PROBLEM_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-contact-support',
    prompt: 'Something went wrong with my visit',
    misclassifiedAction: 'contact_support',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'misclassified-leave-review',
    prompt: 'I was charged twice',
    misclassifiedAction: 'leave_visit_review',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Report a problem with my appointment',
    misclassifiedAction: 'unknown',
    expectedAction: 'report_booking_problem' as const,
  },
] as const;

/** e2e-bug.236 — natural report/complaint phrasing stolen by confirm_my_booking_details. */
export const E2E236_REPORT_VS_CONFIRM_SCENARIOS = [
  {
    id: 'e2e236-report-a-booking-problem-wrong-time',
    prompt: 'report a booking problem — wrong time on my appointment',
    surface: 'customer' as const,
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'e2e236-something-went-wrong-booking-report-support',
    prompt: 'something went wrong with my booking please report it to support',
    surface: 'customer' as const,
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'e2e236-file-a-complaint-appointment',
    prompt: 'file a complaint about my appointment',
    surface: 'customer' as const,
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'e2e236-report-booking-problem-time-wrong-public',
    prompt: 'report a booking problem — my appointment time was wrong',
    surface: 'public' as const,
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'e2e236-exact-report-booking-problem-control',
    prompt: 'report booking problem',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'report_booking_problem' as const,
  },
  {
    id: 'e2e236-confirm-details-control-stays',
    prompt: 'confirm my booking details',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'confirm_my_booking_details' as const,
    expectReport: false,
  },
] as const;

export const REPORT_BOOKING_PROBLEM_BOUNDARY_PROMPTS = [
  {
    id: 'leave-review',
    prompt: 'Rate my last visit',
    surface: 'customer' as const,
  },
  {
    id: 'explain-review-popup',
    prompt: 'Why am I seeing a review popup?',
    surface: 'customer' as const,
  },
  {
    id: 'generic-contact-support',
    prompt: 'Contact support',
    surface: 'customer' as const,
  },
];
