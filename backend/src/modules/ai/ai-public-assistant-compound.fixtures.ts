/**
 * e2e-bug.100 — public_assistant_compound registry examplePrompts must
 * deterministically decompose into 2+ public steps (not steal to single intents).
 * e2e-bug.196 — also covers previously-dead PUBLIC_ONLY compound steps.
 */
export type PublicAssistantCompoundShape =
  | 'list_providers_check_availability'
  | 'discover_packages_recommend_specialists'
  | 'book_appointment_business_info'
  | 'find_services_under_budget_list_providers'
  | 'find_evening_weekend_slots_list_providers'
  | 'list_providers_booking_help'
  | 'list_services_preview_multi_service_cart'
  | 'list_providers_list_public_promotions'
  | 'list_providers_list_provider_reviews'
  | 'list_services_suggest_package_block';

export type PublicAssistantCompoundFixture = {
  id: string;
  prompt: string;
  surface: 'public';
  shape: PublicAssistantCompoundShape;
  orderedActions: readonly string[];
  /** Single-intent steal observed before the fix (when applicable). */
  misclassifiedAction?: string;
};

export const PUBLIC_ASSISTANT_COMPOUND_RECIPE_ID = 'public_assistant_compound';

export const PUBLIC_ASSISTANT_COMPOUND_PROMPTS: PublicAssistantCompoundFixture[] =
  [
    {
      id: 'e2e100-list-providers-check-availability',
      prompt: 'List providers and check availability',
      surface: 'public',
      shape: 'list_providers_check_availability',
      orderedActions: ['list_providers', 'check_availability'],
      misclassifiedAction: 'check_providers_for_service',
    },
    {
      id: 'e2e100-discover-packages-recommend-specialists',
      prompt: 'Discover packages and recommend specialists',
      surface: 'public',
      shape: 'discover_packages_recommend_specialists',
      orderedActions: ['discover_packages', 'recommend_specialists'],
      misclassifiedAction: 'discover_packages',
    },
    {
      id: 'e2e100-book-appointment-business-info',
      prompt: 'Book appointment and show business info',
      surface: 'public',
      shape: 'book_appointment_business_info',
      orderedActions: ['book_appointment', 'business_info'],
    },
    {
      id: 'e2e100-show-providers-then-check-availability',
      prompt: 'Show providers and then check availability',
      surface: 'public',
      shape: 'list_providers_check_availability',
      orderedActions: ['list_providers', 'check_availability'],
    },
    {
      id: 'e2e100-browse-packages-and-recommend-specialists',
      prompt: 'Browse packages and recommend specialists',
      surface: 'public',
      shape: 'discover_packages_recommend_specialists',
      orderedActions: ['discover_packages', 'recommend_specialists'],
    },
    {
      id: 'e2e100-book-an-appointment-and-salon-info',
      prompt: 'Book an appointment and show salon info',
      surface: 'public',
      shape: 'book_appointment_business_info',
      orderedActions: ['book_appointment', 'business_info'],
    },
    // e2e-bug.196 — previously dead PUBLIC_ONLY compound steps
    {
      id: 'e2e196-find-services-under-budget-list-providers',
      prompt: 'Find services under $50 and list providers',
      surface: 'public',
      shape: 'find_services_under_budget_list_providers',
      orderedActions: ['find_services_under_budget', 'list_providers'],
    },
    {
      id: 'e2e196-find-evening-weekend-slots-list-providers',
      prompt: 'Find evening weekend slots and list providers',
      surface: 'public',
      shape: 'find_evening_weekend_slots_list_providers',
      orderedActions: ['find_evening_weekend_slots', 'list_providers'],
    },
    {
      id: 'e2e196-list-providers-booking-help',
      prompt: 'List providers and walk me through booking',
      surface: 'public',
      shape: 'list_providers_booking_help',
      orderedActions: ['list_providers', 'booking_help'],
    },
    {
      id: 'e2e196-list-services-preview-multi-service-cart',
      prompt: 'List services and preview multi service cart',
      surface: 'public',
      shape: 'list_services_preview_multi_service_cart',
      orderedActions: ['list_services', 'preview_multi_service_cart'],
    },
    {
      id: 'e2e196-list-providers-list-public-promotions',
      prompt: 'List providers and list public promotions',
      surface: 'public',
      shape: 'list_providers_list_public_promotions',
      orderedActions: ['list_providers', 'list_public_promotions'],
    },
    {
      id: 'e2e196-list-providers-list-provider-reviews',
      prompt: 'List providers and list provider reviews',
      surface: 'public',
      shape: 'list_providers_list_provider_reviews',
      orderedActions: ['list_providers', 'list_provider_reviews'],
    },
    {
      id: 'e2e196-list-services-suggest-package-block',
      prompt: 'List services and suggest package block',
      surface: 'public',
      shape: 'list_services_suggest_package_block',
      orderedActions: ['list_services', 'suggest_package_block'],
    },
  ];

export const PUBLIC_ASSISTANT_COMPOUND_NEGATIVE_PROMPTS = [
  {
    id: 'e2e100-neg-list-providers-alone',
    prompt: 'List providers',
  },
  {
    id: 'e2e100-neg-check-availability-alone',
    prompt: 'Check availability for massage',
  },
  {
    id: 'e2e100-neg-discover-packages-alone',
    prompt: 'Discover packages',
  },
  {
    id: 'e2e100-neg-book-appointment-alone',
    prompt: 'Book appointment tomorrow',
  },
] as const;
