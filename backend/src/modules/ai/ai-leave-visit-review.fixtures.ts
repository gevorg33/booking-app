export type LeaveVisitReviewPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'leave_visit_review';
  rescueReason: 'leave_visit_review';
  serviceName?: string;
  rating?: number;
};

export const CUSTOMER_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES = `- leave_visit_review: MUTATE — logged-in customer rates or opens the post-visit review flow for their own completed appointment. Triggers: rate my last visit, leave a review for today's haircut, give 5 stars for my massage, submit feedback for my appointment. Set rating 1–5 when stated; set bookingId when known; otherwise serviceName and/or date to pick the visit. Uses POST /me/bookings/:id/review or opens PostVisitReviewPrompt on Account. NOT explain_post_visit_review_prompt (why popup shows), NOT report_booking_problem (complaint/charge issue), NOT rebook_last_appointment, NOT list_my_appointments, NOT contact_support unless review blocked.`;

export const LEAVE_VISIT_REVIEW_PROMPTS: readonly LeaveVisitReviewPromptFixture[] =
  [
    {
      id: 'rate-last-visit-customer',
      prompt: 'Rate my last visit',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'leave-review-todays-haircut-customer',
      prompt: "Leave a review for today's haircut",
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'haircut',
    },
    {
      id: 'give-five-stars-customer',
      prompt: 'Give 5 stars for my last appointment',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      rating: 5,
    },
    {
      id: 'submit-review-massage-customer',
      prompt: 'Submit a review for my massage',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'massage',
    },
    {
      id: 'rate-my-facial-customer',
      prompt: 'Rate my facial visit',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'facial',
    },
    {
      id: 'leave-feedback-appointment-customer',
      prompt: 'Leave feedback for my appointment',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'four-stars-haircut-customer',
      prompt: '4 stars for my haircut today',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      rating: 4,
      serviceName: 'haircut',
    },
    {
      id: 'review-last-visit-customer',
      prompt: 'Review my last visit',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'rate-visit-five-customer',
      prompt: 'I want to rate my visit 5 out of 5',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      rating: 5,
    },
    {
      id: 'post-review-salon-customer',
      prompt: 'Post a review for my salon visit',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
    {
      id: 'star-rating-manicure-customer',
      prompt: 'Leave a star rating for my manicure',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
      serviceName: 'manicure',
    },
    {
      id: 'rate-completed-booking-customer',
      prompt: 'Rate my completed booking',
      surface: 'customer',
      expectedAction: 'leave_visit_review',
      rescueReason: 'leave_visit_review',
    },
  ];

export const LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-rebook',
    prompt: 'Rate my last visit',
    misclassifiedAction: 'rebook_last_appointment',
    expectedAction: 'leave_visit_review' as const,
  },
  {
    id: 'misclassified-list-appointments',
    prompt: "Leave a review for today's haircut",
    misclassifiedAction: 'list_my_appointments',
    expectedAction: 'leave_visit_review' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Give 5 stars for my last appointment',
    misclassifiedAction: 'unknown',
    expectedAction: 'leave_visit_review' as const,
  },
];

export const LEAVE_VISIT_REVIEW_BOUNDARY_PROMPTS = [
  {
    id: 'explain-review-popup',
    prompt: 'Why am I seeing a review popup?',
    surface: 'customer' as const,
  },
  {
    id: 'report-problem',
    prompt: 'Something went wrong with my visit',
    surface: 'customer' as const,
  },
  {
    id: 'rebook-not-review',
    prompt: 'Rebook my last visit',
    surface: 'customer' as const,
  },
];
