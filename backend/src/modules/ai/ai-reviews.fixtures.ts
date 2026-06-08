/** Dashboard + public review intents (parity-2 / parity-2.1). */
export const REVIEWS_CLASSIFIER_RULES = `- list_reviews: READ — dashboard manager+ reviews inbox: recent customer ratings/comments, optionally filtered by employeeName. Triggers: list/show/recent reviews|reviews inbox|customer feedback. NOT summarize_customers (CRM aggregate).
- submit_review: MUTATE — public/customer leave a review after a visit (rating 1–5, optional comment, bookingId + token from review link). Triggers: submit/leave/post/write + review|rate my visit. Requires bookingId, token, rating unless clarifying. NOT list_reviews.`;

export const REVIEWS_SCENARIOS = [
  {
    id: 'list-reviews-inbox',
    prompt: 'Show recent reviews in the inbox',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'list-reviews-for-provider',
    prompt: 'List reviews for Maria',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
    employeeName: 'Maria',
  },
  {
    id: 'open-reviews-inbox',
    prompt: 'Open the reviews inbox',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'show-customer-feedback',
    prompt: 'Show recent customer reviews and feedback',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'latest-reviews',
    prompt: 'What are the latest reviews?',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'recent-ratings',
    prompt: 'List recent review ratings we received',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'reviews-for-stylist',
    prompt: 'Show reviews for stylist Anna',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
    employeeName: 'Anna',
  },
  {
    id: 'inbox-reviews',
    prompt: 'Pull up reviews inbox for today',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'list-all-reviews',
    prompt: 'List all recent customer reviews',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'show-reviews-page',
    prompt: 'Show me the reviews page',
    surface: 'dashboard' as const,
    expectedAction: 'list_reviews' as const,
  },
  {
    id: 'submit-review-public',
    prompt: 'Leave a 5 star review for my visit',
    surface: 'public' as const,
    expectedAction: 'submit_review' as const,
    rating: 5,
  },
  {
    id: 'submit-review-customer',
    prompt: 'Submit a review with a great comment',
    surface: 'customer' as const,
    expectedAction: 'submit_review' as const,
  },
] as const;
