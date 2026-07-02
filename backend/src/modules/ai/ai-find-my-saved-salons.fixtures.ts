export type FindMySavedSalonsAspect = 'list' | 'where' | 'all';

export type FindMySavedSalonsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'find_my_saved_salons';
  rescueReason: 'find_my_saved_salons';
  aspect?: FindMySavedSalonsAspect;
};

export const CUSTOMER_FIND_MY_SAVED_SALONS_CLASSIFIER_RULES = `- find_my_saved_salons: READ — consumer mobile: list recently visited or pinned salons from client recentSalons context, or explain where saved salons appear (home quick return, tenant switcher). Triggers: "Show my saved salons", "Recent salons I visited", "Where are my saved places?". Set aspect when clear (list|where|all). NOT switch_salon_tenant (jump to a named salon), NOT list_providers (staff at current salon), NOT switch_to_consumer_app, NOT refer_a_friend.`;

export const FIND_MY_SAVED_SALONS_PROMPTS: readonly FindMySavedSalonsPromptFixture[] =
  [
    {
      id: 'saved-salons-customer',
      prompt: 'Show my saved salons',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'recent-salons-customer',
      prompt: 'Recent salons I visited',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'salons-i-visited-customer',
      prompt: 'Show salons I visited',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'my-saved-places-customer',
      prompt: 'What are my saved places?',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'where-saved-salons-customer',
      prompt: 'Where are my saved salons?',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'where',
    },
    {
      id: 'pinned-salons-customer',
      prompt: 'List pinned salons on this device',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'remembered-salons-customer',
      prompt: 'Which salons does the app remember?',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'all',
    },
    {
      id: 'quick-return-salons-customer',
      prompt: 'Show places I booked before',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'tenant-switcher-help-customer',
      prompt: 'How do I switch between salons I visited?',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'where',
    },
    {
      id: 'saved-businesses-customer',
      prompt: 'My saved businesses',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'recent-tenants-customer',
      prompt: 'Recent tenants on my phone',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
    {
      id: 'visited-salons-list-customer',
      prompt: 'List every salon I have visited in the app',
      surface: 'customer',
      expectedAction: 'find_my_saved_salons',
      rescueReason: 'find_my_saved_salons',
      aspect: 'list',
    },
  ];

export const FIND_MY_SAVED_SALONS_RESCUE_SCENARIOS = [
  {
    id: 'unknown-saved-salons',
    prompt: 'Show my saved salons',
    misclassifiedAction: 'unknown',
    expectedAction: 'find_my_saved_salons' as const,
  },
  {
    id: 'list-providers-to-saved',
    prompt: 'Recent salons I visited',
    misclassifiedAction: 'list_providers',
    expectedAction: 'find_my_saved_salons' as const,
  },
] as const;
