export type ListProviderReviewsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'list_provider_reviews';
  rescueReason: 'provider_reviews';
  providerName?: string;
};

export const LIST_PROVIDER_REVIEWS_CLASSIFIER_RULES = `- list_provider_reviews: READ — show the review list/history for one named (or currently viewed) provider, before booking. Triggers: "What do people say about Anna?", "Show reviews for James", "Read reviews for this stylist", "How many reviews does Maria have?". Set providerName when a person is named, or rely on employeeId from session for the currently viewed provider. NOT explain_provider_specialty (chat answer about who fits a topic), NOT explain_professional_profile (profile page navigation, services/bio), NOT recommend_specialists (ranked picks across providers).
- Examples:
  - "What do people say about Anna?" → list_provider_reviews, providerName=Anna
  - "Show reviews for James" → list_provider_reviews, providerName=James
  - "How many reviews does this stylist have?" → list_provider_reviews (use session employeeId)`;

export const LIST_PROVIDER_REVIEWS_PROMPTS: readonly ListProviderReviewsPromptFixture[] =
  [
    {
      id: 'reviews-for-anna-public',
      prompt: 'What do people say about Anna?',
      surface: 'public',
      expectedAction: 'list_provider_reviews',
      rescueReason: 'provider_reviews',
      providerName: 'Anna',
    },
    {
      id: 'show-reviews-james-public',
      prompt: 'Show reviews for James',
      surface: 'public',
      expectedAction: 'list_provider_reviews',
      rescueReason: 'provider_reviews',
      providerName: 'James',
    },
    {
      id: 'how-many-reviews-maria-customer',
      prompt: 'How many reviews does Maria have?',
      surface: 'customer',
      expectedAction: 'list_provider_reviews',
      rescueReason: 'provider_reviews',
      providerName: 'Maria',
    },
    {
      id: 'read-reviews-stylist-customer',
      prompt: 'Read reviews for this stylist',
      surface: 'customer',
      expectedAction: 'list_provider_reviews',
      rescueReason: 'provider_reviews',
    },
  ];
