/**
 * e2e-bug.100 — public_assistant_compound registry examplePrompts must
 * deterministically decompose into 2+ public steps (not steal to single intents).
 */
export type PublicAssistantCompoundShape =
  | 'list_providers_check_availability'
  | 'discover_packages_recommend_specialists'
  | 'book_appointment_business_info';

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
