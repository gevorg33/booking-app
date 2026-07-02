/** Customer/public classifier rules for Any stylist / any provider picker (ai-cmd-customer-4.11.1). */
export const EXPLAIN_ANY_PROVIDER_OPTION_CLASSIFIER_RULES = `- explain_any_provider_option: READ — explain the "Any available specialist" / "Any stylist" option in checkout and slot booking: you skip naming a stylist, and the salon assigns whoever is free for your service and time. Triggers: "What does Any stylist mean?", "Will someone be assigned?", "What happens if I don't pick a stylist?", "Explain any provider option on this page". Set aspect to what_it_means|assignment|picker|all when clear. NOT book_appointment|create_booking (mutate booking with allProviders), NOT check_availability (search openings), NOT recommend_specialists (ranked picks), NOT explain_provider_specialty (named provider bio/specialty), NOT list_providers (roster only), and NOT explain_professional_profile (profile page).
- Examples:
  - "What does Any stylist mean?" → explain_any_provider_option, aspect=what_it_means
  - "Will someone be assigned if I leave Any specialist selected?" → explain_any_provider_option, aspect=assignment
  - "How do I pick any provider on the booking page?" → explain_any_provider_option, aspect=picker
  - "What happens if I don't choose a stylist?" → explain_any_provider_option, aspect=assignment
  - "Explain the any provider option here" → explain_any_provider_option, aspect=all
  - "Что значит любой специалист при записи?" → explain_any_provider_option, aspect=what_it_means
  - "Ցանկացած մասնագետը ինչ է նշանակում" → explain_any_provider_option, aspect=what_it_means`;

export type AnyProviderOptionAspect =
  | 'what_it_means'
  | 'assignment'
  | 'picker'
  | 'all';

export type ExplainAnyProviderOptionPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_any_provider_option';
  aspect: AnyProviderOptionAspect;
  rescueReason: 'any_provider_option';
};

export const EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS: readonly ExplainAnyProviderOptionPromptFixture[] =
  [
    {
      id: 'what-does-any-stylist-mean-customer',
      prompt: 'What does Any stylist mean?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'will-someone-be-assigned-customer',
      prompt: 'Will someone be assigned if I leave Any specialist selected?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'dont-pick-stylist-customer',
      prompt: "What happens if I don't choose a stylist?",
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'how-pick-any-provider-customer',
      prompt: 'How do I pick any provider when booking?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'any-available-specialist-meaning-customer',
      prompt: 'What does any available specialist mean on checkout?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'who-gets-assigned-customer',
      prompt: 'Who gets assigned when I book with any stylist?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'specialist-picker-any-customer',
      prompt: 'Where is the any stylist option in the specialist picker?',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'explain-any-provider-checkout-customer',
      prompt: 'Explain the any provider option on checkout',
      surface: 'customer',
      expectedAction: 'explain_any_provider_option',
      aspect: 'all',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'what-does-any-stylist-mean-public',
      prompt: 'What does Any stylist mean?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'will-someone-be-assigned-public',
      prompt: 'Will someone be assigned?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'dont-pick-stylist-public',
      prompt: "What happens if I don't pick a stylist on this booking page?",
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'how-pick-any-provider-public',
      prompt: 'How do I pick any provider on this booking page?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'any-specialist-toggle-public',
      prompt: 'What is the any specialist option here?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'what_it_means',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'assigned-at-confirmation-public',
      prompt: 'Do I see which stylist I got after booking with any provider?',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'assignment',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'picker-steps-public',
      prompt: 'Show me how to select Any available specialist',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'picker',
      rescueReason: 'any_provider_option',
    },
    {
      id: 'explain-any-provider-page-public',
      prompt: 'Explain the any provider option on this page',
      surface: 'public',
      expectedAction: 'explain_any_provider_option',
      aspect: 'all',
      rescueReason: 'any_provider_option',
    },
  ];

export const EXPLAIN_ANY_PROVIDER_OPTION_RESCUE_SCENARIOS = [
  {
    id: 'book-to-any-option',
    prompt: 'What does Any stylist mean?',
    surface: 'customer' as const,
    misclassifiedAction: 'book_appointment',
  },
  {
    id: 'availability-to-any-option',
    prompt: 'Will someone be assigned?',
    surface: 'public' as const,
    misclassifiedAction: 'check_availability',
  },
  {
    id: 'specialty-to-any-option',
    prompt: 'What does any available specialist mean on checkout?',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_provider_specialty',
  },
  {
    id: 'unknown-to-any-option-public',
    prompt: 'What does Any stylist mean?',
    surface: 'public' as const,
    misclassifiedAction: 'unknown',
  },
] as const;
