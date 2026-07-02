export type ExplainMultiServiceCartFocus = 'overview' | 'contents' | 'duration';

export type ExplainMultiServiceCartPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_multi_service_cart';
  rescueReason: 'explain_multi_service_cart';
  focus?: ExplainMultiServiceCartFocus;
};

export const CUSTOMER_EXPLAIN_MULTI_SERVICE_CART_CLASSIFIER_RULES = `- explain_multi_service_cart: READ — signed-in customer multi-service cart summary on consumer app. Explains which services are in cartServiceIds, each line duration, turnover buffer, and total visit time (enriched show_cart_total_duration). Triggers: what's in my cart, how long is my spa day, what treatments did I pick, show my multi-service cart. Requires cartServiceIds from session. NOT add_services_to_cart / remove_service_from_cart (mutate), NOT check_multi_service_availability (find slots), NOT show_cart_total_duration (duration-only minutes ask), NOT book_multi_service (mutate book).`;

export const EXPLAIN_MULTI_SERVICE_CART_PROMPTS: readonly ExplainMultiServiceCartPromptFixture[] =
  [
    {
      id: 'spa-day-duration-customer',
      prompt: 'How long is my spa day?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'duration',
    },
    {
      id: 'whats-in-cart-customer',
      prompt: "What's in my cart?",
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'show-multi-service-cart-customer',
      prompt: 'Show my multi-service cart',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'overview',
    },
    {
      id: 'treatments-picked-customer',
      prompt: 'What treatments did I pick?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'services-in-basket-customer',
      prompt: 'What services are in my basket?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'explain-cart-customer',
      prompt: 'Explain my cart',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'overview',
    },
    {
      id: 'how-long-all-services-customer',
      prompt: 'How long will all these services take?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'duration',
    },
    {
      id: 'whats-selected-visit-customer',
      prompt: "What's selected for my visit?",
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'spa-day-cart-contents-customer',
      prompt: "Show what's in my spa day cart",
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'overview',
    },
    {
      id: 'list-cart-services-customer',
      prompt: 'List my cart services',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'what-added-to-cart-customer',
      prompt: 'What did I add to my cart?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'contents',
    },
    {
      id: 'multi-service-visit-time-customer',
      prompt: 'How much time is my multi-service visit?',
      surface: 'customer',
      expectedAction: 'explain_multi_service_cart',
      rescueReason: 'explain_multi_service_cart',
      focus: 'duration',
    },
  ];

export const EXPLAIN_MULTI_SERVICE_CART_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-show-cart-duration',
    prompt: "What's in my cart?",
    misclassifiedAction: 'show_cart_total_duration',
    expectedAction: 'explain_multi_service_cart' as const,
  },
  {
    id: 'misclassified-unknown',
    prompt: 'How long is my spa day?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_multi_service_cart' as const,
  },
  {
    id: 'misclassified-add-to-cart',
    prompt: 'What treatments did I pick?',
    misclassifiedAction: 'add_services_to_cart',
    expectedAction: 'explain_multi_service_cart' as const,
  },
  {
    id: 'misclassified-check-availability',
    prompt: 'Explain my cart',
    misclassifiedAction: 'check_multi_service_availability',
    expectedAction: 'explain_multi_service_cart' as const,
  },
] as const;
