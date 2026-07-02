export type DismissRecommendationsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'dismiss_recommendations';
  rescueReason: 'dismiss_recommendations';
  bookingId?: string;
  serviceId?: string;
};

export const CUSTOMER_DISMISS_RECOMMENDATIONS_CLASSIFIER_RULES = `- dismiss_recommendations: MUTATE navigate — customer hides the "You might also like" product cards on the booking success / confirmation screen for the current visit (client state only; does not cancel the booking). Triggers: hide|dismiss|close + recommendations|You might also like|product cards; stop showing product cards; turn off recommendations. Returns clientAction dismissConsumerCheckoutRecommendations and sessionContext checkoutRecommendationsDismissed=true. Customer/consumer app only. NOT explain_checkout_recommendations (which products / why shown), NOT explain_consumer_checkout_success (READ what dismiss does or screen overview), NOT cancel_my_booking (cancel appointment), NOT remove_service_from_cart.
- Examples:
  - "Hide You might also like" → dismiss_recommendations
  - "Dismiss recommendations" → dismiss_recommendations
  - "Stop showing product cards" → dismiss_recommendations
  - "Close the recommendations section on success" → dismiss_recommendations
  - "Turn off product recommendations after booking" → dismiss_recommendations`;

export const DISMISS_RECOMMENDATIONS_PROMPTS: readonly DismissRecommendationsPromptFixture[] =
  [
    {
      id: 'hide-you-might-also-like',
      prompt: 'Hide You might also like',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'dismiss-recommendations-bare',
      prompt: 'Dismiss recommendations',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'stop-showing-product-cards',
      prompt: 'Stop showing product cards',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'close-recommendations-section',
      prompt: 'Close the recommendations section',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'hide-product-cards-success',
      prompt: 'Hide product cards on my success screen',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'dont-show-recommendations',
      prompt: "Don't show recommendations after booking",
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'turn-off-recommendations',
      prompt: 'Turn off product recommendations',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'remove-you-might-also-like',
      prompt: 'Remove the You might also like section',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'get-rid-product-cards',
      prompt: 'Get rid of these product cards',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'hide-recommendations-success-screen',
      prompt: 'Hide recommendations on my booking success screen',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'close-you-might-also-like',
      prompt: 'Close You might also like',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'stop-you-might-also-like',
      prompt: 'Stop showing You might also like',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
    },
    {
      id: 'hide-recommendations-with-booking',
      prompt: 'Hide recommendations for booking bk-abc123',
      surface: 'customer',
      expectedAction: 'dismiss_recommendations',
      rescueReason: 'dismiss_recommendations',
      bookingId: 'bk-abc123',
    },
  ];

export const DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS = [
  {
    id: 'checkout-recommendations-to-dismiss',
    prompt: 'Hide You might also like',
    misclassifiedAction: 'explain_checkout_recommendations',
    expectedAction: 'dismiss_recommendations' as const,
    rescueReason: 'dismiss_recommendations' as const,
  },
  {
    id: 'checkout-success-to-dismiss',
    prompt: 'Dismiss recommendations',
    misclassifiedAction: 'explain_consumer_checkout_success',
    expectedAction: 'dismiss_recommendations' as const,
    rescueReason: 'dismiss_recommendations' as const,
  },
  {
    id: 'unknown-to-dismiss',
    prompt: 'Stop showing product cards',
    misclassifiedAction: 'unknown',
    expectedAction: 'dismiss_recommendations' as const,
    rescueReason: 'dismiss_recommendations' as const,
  },
] as const;
