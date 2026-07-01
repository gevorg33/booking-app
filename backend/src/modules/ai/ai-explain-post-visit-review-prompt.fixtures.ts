export type ExplainPostVisitReviewPromptAspect =
  | 'why_popup'
  | 'skip_dismiss'
  | 'how_it_works'
  | 'store_review'
  | 'unhappy_path';

export type ExplainPostVisitReviewPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_post_visit_review_prompt';
  rescueReason: 'post_visit_review_prompt';
  aspect?: ExplainPostVisitReviewPromptAspect;
};

export const CUSTOMER_EXPLAIN_POST_VISIT_REVIEW_PROMPT_CLASSIFIER_RULES = `- explain_post_visit_review_prompt: READ — signed-in customer asks about the post-visit review popup on Account (PostVisitReviewPrompt): why it appears, how to skip/dismiss, satisfaction → star rating → optional App Store review flow, or the unhappy/support path. Triggers: why am I seeing a review popup, can I skip the rating, dismiss the review prompt, how does visit rating work. NOT leave_visit_review (actually rate/submit), NOT report_booking_problem (complaint/charge issue), NOT explain_share_reward, NOT contact_support unless only asking for human help.`;

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_PROMPTS: readonly ExplainPostVisitReviewPromptFixture[] =
  [
    {
      id: 'why-review-popup-customer',
      prompt: 'Why am I seeing a review popup?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'why_popup',
    },
    {
      id: 'skip-rating-customer',
      prompt: 'Can I skip the rating?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'why-asking-rate-customer',
      prompt: 'Why is the app asking me to rate my visit?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'why_popup',
    },
    {
      id: 'dismiss-review-prompt-customer',
      prompt: 'How do I dismiss the review prompt?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'satisfaction-survey-customer',
      prompt: 'What is this satisfaction survey?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'how_it_works',
    },
    {
      id: 'must-leave-review-customer',
      prompt: 'Do I have to leave a review?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'close-post-visit-review-customer',
      prompt: 'Can I close the post-visit review?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'review-notification-customer',
      prompt: 'Why did I get a review notification?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'why_popup',
    },
    {
      id: 'ask-again-if-skip-customer',
      prompt: 'Will you ask me again if I skip?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'not-now-review-customer',
      prompt: 'What happens when I tap Not now on the review?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'skip_dismiss',
    },
    {
      id: 'explain-popup-customer',
      prompt: 'Explain the post-visit review popup',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'how_it_works',
    },
    {
      id: 'rating-flow-customer',
      prompt: 'How does the visit rating flow work?',
      surface: 'customer',
      expectedAction: 'explain_post_visit_review_prompt',
      rescueReason: 'post_visit_review_prompt',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-leave-review',
    prompt: 'Why am I seeing a review popup?',
    misclassifiedAction: 'leave_visit_review',
    expectedAction: 'explain_post_visit_review_prompt' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'Can I skip the rating?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_post_visit_review_prompt' as const,
  },
  {
    id: 'misclassified-contact-support',
    prompt: 'How do I dismiss the review prompt?',
    misclassifiedAction: 'contact_support',
    expectedAction: 'explain_post_visit_review_prompt' as const,
  },
] as const;

export const EXPLAIN_POST_VISIT_REVIEW_PROMPT_BOUNDARY_PROMPTS = [
  {
    id: 'leave-review-mutate',
    prompt: 'Rate my last visit',
    surface: 'customer' as const,
  },
  {
    id: 'leave-review-haircut',
    prompt: "Leave a review for today's haircut",
    surface: 'customer' as const,
  },
  {
    id: 'report-problem',
    prompt: 'Something went wrong with my visit',
    surface: 'customer' as const,
  },
];
