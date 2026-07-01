/** Customer/public classifier rules for post-checkout success product cards (ai-cmd-rec-5). */
export const CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES = `- explain_checkout_recommendations: READ — explain "You might also like" product cards on the booking confirmation / checkout success screen (public web + consumer app rec-1.6). Covers which products appear for the just-booked service, why they were chosen (service-linked then category fallback), optional shop external links, and configured max card count. Triggers on the success/confirmation screen after booking: you might also like, recommended products after booking, product cards on success, why am I seeing these products, what does the shop link do. Uses session bookingId/serviceId when available. NOT explain_consumer_checkout_success (consumer app success screen overview, actions, section visibility), NOT dismiss_recommendations (hide/close product cards), NOT explain_recommendation_setup (dashboard admin link configuration), NOT suggest_retail_upsell (provider chair-side upsell), NOT configure_recommendation_product (admin mutate), and NOT list_products (retail inventory).
- Examples:
  - "What are these You might also like products on the confirmation screen?" → explain_checkout_recommendations, aspect=products
  - "Why am I seeing shampoo recommendations after I booked?" → explain_checkout_recommendations, aspect=whyShown
  - "What does the shop link do on these product cards?" → explain_checkout_recommendations, aspect=shopLink
  - "Explain the recommended products on the booking success page" → explain_checkout_recommendations
  - "Why are there product suggestions after checkout?" → explain_checkout_recommendations, aspect=whyShown
  - "What products show up after I confirm my booking in the consumer app?" → explain_checkout_recommendations, aspect=products, surface=customer
  - "How many products can appear on the success screen?" → explain_checkout_recommendations, aspect=maxCount
  - "Are these recommendations from my booked haircut service?" → explain_checkout_recommendations, aspect=whyShown, serviceName=haircut`;

export const EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS = [
  {
    id: 'public-you-might-also-like',
    prompt:
      'What are these You might also like products on the confirmation screen?',
    aspect: 'products' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-why-after-booked',
    prompt: 'Why am I seeing shampoo recommendations after I booked?',
    aspect: 'whyShown' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-shop-link',
    prompt: 'What does the shop link do on these product cards?',
    aspect: 'shopLink' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-success-page-products',
    prompt: 'Explain the recommended products on the booking success page',
    aspect: 'all' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-after-checkout-suggestions',
    prompt: 'Why are there product suggestions after checkout?',
    aspect: 'whyShown' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-confirmed-appointment-products',
    prompt: 'What are the products shown after my appointment is confirmed?',
    aspect: 'products' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-how-chosen',
    prompt: 'How were these post-booking product recommendations chosen?',
    aspect: 'whyShown' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-success-screen-explain',
    prompt: 'Can you explain You might also like on this success screen?',
    aspect: 'all' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-just-booked-cards',
    prompt: 'I just booked — what are these product cards?',
    aspect: 'products' as const,
    surface: 'public' as const,
  },
  {
    id: 'public-after-haircut-mask',
    prompt: 'Why is Repair Mask recommended here after my haircut?',
    aspect: 'whyShown' as const,
    serviceName: 'haircut',
    surface: 'public' as const,
  },
  {
    id: 'customer-app-success-products',
    prompt:
      'What are the You might also like products on the consumer app success screen?',
    aspect: 'products' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-app-after-booking',
    prompt: 'Why am I seeing product recommendations after booking in the app?',
    aspect: 'whyShown' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-shop-links',
    prompt: 'Explain the shop links on the recommended products',
    aspect: 'shopLink' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-after-confirm',
    prompt: 'What products show up after I confirm my booking?',
    aspect: 'products' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-shampoo-after-haircut',
    prompt: 'Why does the app show shampoo after my haircut booking?',
    aspect: 'whyShown' as const,
    serviceName: 'haircut',
    surface: 'customer' as const,
  },
  {
    id: 'customer-you-might-also-like-meaning',
    prompt: 'What does You might also like mean on checkout success?',
    aspect: 'all' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-max-count',
    prompt: 'How many products can appear on the success screen?',
    aspect: 'maxCount' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-from-booked-service',
    prompt: 'Are these product recommendations from my booked service?',
    aspect: 'whyShown' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-no-products',
    prompt: "Why don't I see any You might also like products?",
    aspect: 'whyShown' as const,
    surface: 'customer' as const,
  },
  {
    id: 'customer-external-link-card',
    prompt: 'What is the external link on the recommendation card?',
    aspect: 'shopLink' as const,
    surface: 'customer' as const,
  },
  {
    id: 'public-shop-recommended-serum',
    prompt: 'How do I shop the recommended serum on the success screen?',
    aspect: 'shopLink' as const,
    surface: 'public' as const,
  },
  {
    id: 'customer-shop-recommended-serum',
    prompt: 'How do I buy the recommended serum after booking in the app?',
    aspect: 'shopLink' as const,
    surface: 'customer' as const,
  },
] as const;
