/** Dashboard classifier rules for post-checkout recommendation analytics (ai-cmd-rec-8). */
export const RECOMMENDATION_ANALYTICS_CLASSIFIER_RULES = `- explain_recommendation_analytics: READ — explain checkout recommendation event analytics from product_recommendation.shown (impressions) and product_recommendation.clicked (shop-link clicks): totals, top products, and surface breakdown (web_checkout public booking vs consumer_app). Optional daysAhead period filter. NOT explain_recommendation_setup (link configuration), NOT summarize_recommendation_performance (CTR/period performance summary), NOT explain_checkout_recommendations (customer success-screen cards), and NOT configure_recommendation_product or link_recommended_products (mutate).
- Examples:
  - "Explain recommendation analytics" → explain_recommendation_analytics
  - "How many checkout recommendation impressions do we have?" → explain_recommendation_analytics, aspect=impressions
  - "Show product_recommendation.shown and clicked counts" → explain_recommendation_analytics
  - "What are the top recommended products by clicks?" → explain_recommendation_analytics, aspect=topProducts
  - "Break down recommendation clicks by surface" → explain_recommendation_analytics, aspect=surfaces
  - "Web checkout vs consumer app recommendation stats" → explain_recommendation_analytics, aspect=surfaces
  - "How many product_recommendation.shown events on public booking?" → explain_recommendation_analytics, aspect=impressions, surface=web_checkout`;

export const EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS = [
  {
    id: 'explain-analytics',
    prompt: 'Explain recommendation analytics',
    aspect: 'all' as const,
  },
  {
    id: 'impression-count',
    prompt: 'How many checkout recommendation impressions do we have?',
    aspect: 'impressions' as const,
  },
  {
    id: 'shown-clicked-counts',
    prompt: 'Show product_recommendation.shown and clicked counts',
    aspect: 'all' as const,
  },
  {
    id: 'top-by-clicks',
    prompt: 'What are the top recommended products by clicks?',
    aspect: 'topProducts' as const,
  },
  {
    id: 'top-by-impressions',
    prompt: 'Which products get the most recommendation impressions?',
    aspect: 'topProducts' as const,
  },
  {
    id: 'clicks-by-surface',
    prompt: 'Break down recommendation clicks by surface',
    aspect: 'surfaces' as const,
  },
  {
    id: 'web-vs-consumer-stats',
    prompt: 'Web checkout vs consumer app recommendation stats',
    aspect: 'surfaces' as const,
  },
  {
    id: 'web-shown-events',
    prompt:
      'How many product_recommendation.shown events on public booking checkout?',
    aspect: 'impressions' as const,
    surface: 'web_checkout' as const,
  },
  {
    id: 'consumer-click-counts',
    prompt: 'Consumer app recommendation click counts',
    aspect: 'clicks' as const,
    surface: 'consumer_app' as const,
  },
  {
    id: 'checkout-recommendation-events',
    prompt: 'Explain post-checkout recommendation event analytics',
    aspect: 'all' as const,
  },
  {
    id: 'click-totals-last-month',
    prompt: 'How many recommendation shop-link clicks last 30 days?',
    aspect: 'clicks' as const,
    daysAhead: 30,
  },
  {
    id: 'impression-surface-split',
    prompt:
      'Show checkout recommendation impressions split between web and consumer app',
    aspect: 'surfaces' as const,
  },
] as const;
