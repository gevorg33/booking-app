/** Dashboard classifier rules for post-checkout recommendation performance (ai-cmd-rec-9). */
export const RECOMMENDATION_PERFORMANCE_CLASSIFIER_RULES = `- summarize_recommendation_performance: READ — summarize checkout recommendation performance from product_recommendation.shown and product_recommendation.clicked events: overall CTR (click-through rate), CTR by product, CTR by booked service, and count of bookings with recommendation cards shown. Optional daysAhead period filter and surface (web_checkout vs consumer_app). NOT explain_recommendation_analytics (raw impression/click counts), NOT explain_recommendation_setup (link configuration), NOT explain_checkout_recommendations (customer success-screen cards), and NOT configure_recommendation_product or link_recommended_products (mutate).
- Examples:
  - "Summarize recommendation performance" → summarize_recommendation_performance
  - "What's the checkout recommendation CTR?" → summarize_recommendation_performance, aspect=ctr
  - "CTR by product for post-checkout recommendations" → summarize_recommendation_performance, aspect=byProduct
  - "CTR by service for checkout recommendations" → summarize_recommendation_performance, aspect=byService
  - "How many bookings had recommendations shown?" → summarize_recommendation_performance, aspect=bookings
  - "Recommendation click-through rate last 30 days" → summarize_recommendation_performance, aspect=ctr, daysAhead=30
  - "Bookings with checkout recommendations shown last 7 days" → summarize_recommendation_performance, aspect=bookings, daysAhead=7`;

export const SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS = [
  {
    id: 'summarize-performance',
    prompt: 'Summarize recommendation performance',
    aspect: 'all' as const,
  },
  {
    id: 'checkout-ctr',
    prompt: "What's the checkout recommendation CTR?",
    aspect: 'ctr' as const,
  },
  {
    id: 'ctr-last-30-days',
    prompt: 'Recommendation click-through rate last 30 days',
    aspect: 'ctr' as const,
    daysAhead: 30,
  },
  {
    id: 'ctr-by-product',
    prompt: 'CTR by product for post-checkout recommendations',
    aspect: 'byProduct' as const,
  },
  {
    id: 'product-ctr-breakdown',
    prompt: 'Show recommendation CTR broken down by product',
    aspect: 'byProduct' as const,
  },
  {
    id: 'ctr-by-service',
    prompt: 'CTR by service for checkout recommendations',
    aspect: 'byService' as const,
  },
  {
    id: 'best-service-ctr',
    prompt: 'Which services have the best recommendation click-through?',
    aspect: 'byService' as const,
  },
  {
    id: 'bookings-with-shown',
    prompt: 'How many bookings had recommendations shown?',
    aspect: 'bookings' as const,
  },
  {
    id: 'bookings-shown-7-days',
    prompt: 'Bookings with checkout recommendations shown last 7 days',
    aspect: 'bookings' as const,
    daysAhead: 7,
  },
  {
    id: 'post-checkout-performance',
    prompt: 'Summarize post-checkout recommendation performance',
    aspect: 'all' as const,
  },
  {
    id: 'consumer-app-ctr',
    prompt: 'Consumer app recommendation CTR last month',
    aspect: 'ctr' as const,
    surface: 'consumer_app' as const,
    daysAhead: 30,
  },
  {
    id: 'overall-ctr-bookings',
    prompt:
      'Overall recommendation click-through and bookings with cards shown',
    aspect: 'all' as const,
  },
] as const;
