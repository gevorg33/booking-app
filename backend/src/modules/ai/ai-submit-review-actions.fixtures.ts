export type SubmitReviewActionsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'submit_provider_review' | 'submit_review_with_token';
  rescueReason: string;
  providerName?: string;
  rating?: number;
};

export const SUBMIT_PROVIDER_REVIEW_CLASSIFIER_RULES = `- submit_provider_review: MUTATE — leave a star rating (1-5) and optional comment for a named (or currently viewed) provider, outside of a specific booking's review flow. Triggers: "Give Anna 5 stars", "Rate James 4/5, great service", "I want to review this stylist". Set providerName when named (or rely on session employeeId), rating (1-5), comment when given. NOT list_provider_reviews (read reviews, no submission), NOT submit_my_booking_review / leave_visit_review (reviews a specific completed booking), NOT submit_review_with_token (anonymous email-link flow with a booking token, no session).`;

export const SUBMIT_REVIEW_WITH_TOKEN_CLASSIFIER_RULES = `- submit_review_with_token: MUTATE — guest submits a star rating for a completed visit using the bookingId + token from a "leave a review" email link, with no signed-in session. Triggers: "Rate my visit 5 stars" (from the review-link page), "Leave a review for booking [token link]". Requires bookingId and token (carried from the email link context, not typed by the user); set rating (1-5) and comment when given. NOT submit_my_booking_review / leave_visit_review (signed-in customer app flow, no token), NOT submit_provider_review (not tied to one specific booking).`;

export const SUBMIT_REVIEW_ACTIONS_PROMPTS: readonly SubmitReviewActionsPromptFixture[] =
  [
    {
      id: 'give-anna-5-stars-customer',
      prompt: 'Give Anna 5 stars, she was amazing',
      surface: 'customer',
      expectedAction: 'submit_provider_review',
      rescueReason: 'submit_provider_review',
      providerName: 'Anna',
      rating: 5,
    },
    {
      id: 'rate-james-public',
      prompt: 'Rate James 4 out of 5, great service',
      surface: 'public',
      expectedAction: 'submit_provider_review',
      rescueReason: 'submit_provider_review',
      providerName: 'James',
      rating: 4,
    },
    {
      id: 'rate-visit-from-email-link',
      prompt: 'Rate my visit 5 stars',
      surface: 'customer',
      expectedAction: 'submit_review_with_token',
      rescueReason: 'submit_review_with_token',
      rating: 5,
    },
  ];
