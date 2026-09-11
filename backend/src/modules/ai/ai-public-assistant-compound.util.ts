import {
  PUBLIC_ASSISTANT_COMPOUND_PROMPTS,
  PUBLIC_ASSISTANT_COMPOUND_RECIPE_ID,
  type PublicAssistantCompoundFixture,
  type PublicAssistantCompoundShape,
} from './ai-public-assistant-compound.fixtures.js';

export { PUBLIC_ASSISTANT_COMPOUND_RECIPE_ID };

export type PublicAssistantCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

const LIST_PROVIDERS_CUE =
  /\b(?:list|show)\s+(?:(?:the|all|our)\s+)?providers?\b/i;
const CHECK_AVAILABILITY_CUE =
  /\bcheck\s+(?:the\s+)?availability\b|\band\s+check\s+availability\b/i;
const DISCOVER_PACKAGES_CUE =
  /\b(?:discover|browse|show|find|list)\s+(?:(?:the|all|our)\s+)?packages?\b/i;
const RECOMMEND_SPECIALISTS_CUE =
  /\brecommend\s+(?:(?:a|some|the)\s+)?specialists?\b/i;
const BOOK_APPOINTMENT_CUE = /\bbook\s+(?:an?\s+)?appointment\b/i;
const BUSINESS_INFO_CUE =
  /\b(?:show\s+)?(?:business|salon)\s+info(?:rmation)?\b/i;
const FIND_UNDER_BUDGET_CUE =
  /\bfind\s+services\s+under\s+\$?\d+|\bservices\s+under\s+\$?\d+/i;
const FIND_EVENING_WEEKEND_CUE =
  /\bfind\s+evening\s+weekend\s+slots?\b|\bevening\s+(?:and\s+)?weekend\s+slots?\b/i;
const BOOKING_HELP_CUE =
  /\bwalk\s+me\s+through\s+booking\b|\bbooking\s+help\b|\bhow\s+do\s+i\s+book\b/i;
const LIST_SERVICES_CUE =
  /\b(?:list|show)\s+(?:(?:the|all|our|me)\s+)?services?\b/i;
const PREVIEW_CART_CUE =
  /\bpreview\s+(?:(?:a|the|my)\s+)?multi[\s-]?service\s+cart\b/i;
const LIST_PROMOTIONS_CUE =
  /\blist\s+(?:(?:the|all|our)\s+)?(?:public\s+)?promotions?\b/i;
const LIST_REVIEWS_CUE =
  /\blist\s+(?:(?:the|all|our)\s+)?provider\s+reviews?\b/i;
const SUGGEST_PACKAGE_BLOCK_CUE = /\bsuggest\s+(?:a\s+)?package\s+block\b/i;
const COMPOUND_GLUE = /\band\b|\bthen\b|;/;

const SHAPE_ACTIONS: Record<
  PublicAssistantCompoundShape,
  readonly [string, string]
> = {
  list_providers_check_availability: ['list_providers', 'check_availability'],
  discover_packages_recommend_specialists: [
    'discover_packages',
    'recommend_specialists',
  ],
  book_appointment_business_info: ['book_appointment', 'business_info'],
  find_services_under_budget_list_providers: [
    'find_services_under_budget',
    'list_providers',
  ],
  find_evening_weekend_slots_list_providers: [
    'find_evening_weekend_slots',
    'list_providers',
  ],
  list_providers_booking_help: ['list_providers', 'booking_help'],
  list_services_preview_multi_service_cart: [
    'list_services',
    'preview_multi_service_cart',
  ],
  list_providers_list_public_promotions: [
    'list_providers',
    'list_public_promotions',
  ],
  list_providers_list_provider_reviews: [
    'list_providers',
    'list_provider_reviews',
  ],
  list_services_suggest_package_block: [
    'list_services',
    'suggest_package_block',
  ],
};

function matchPublicAssistantCompoundScenario(
  prompt: string,
): PublicAssistantCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of PUBLIC_ASSISTANT_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function detectPublicAssistantCompoundShape(
  prompt: string,
): PublicAssistantCompoundShape | null {
  const scenario = matchPublicAssistantCompoundScenario(prompt);
  if (scenario) return scenario.shape;

  const text = prompt.trim();
  if (text.length < 16 || !COMPOUND_GLUE.test(text)) return null;

  if (FIND_UNDER_BUDGET_CUE.test(text) && LIST_PROVIDERS_CUE.test(text)) {
    return 'find_services_under_budget_list_providers';
  }
  if (FIND_EVENING_WEEKEND_CUE.test(text) && LIST_PROVIDERS_CUE.test(text)) {
    return 'find_evening_weekend_slots_list_providers';
  }
  if (LIST_PROVIDERS_CUE.test(text) && BOOKING_HELP_CUE.test(text)) {
    return 'list_providers_booking_help';
  }
  if (LIST_SERVICES_CUE.test(text) && PREVIEW_CART_CUE.test(text)) {
    return 'list_services_preview_multi_service_cart';
  }
  if (LIST_PROVIDERS_CUE.test(text) && LIST_PROMOTIONS_CUE.test(text)) {
    return 'list_providers_list_public_promotions';
  }
  if (LIST_PROVIDERS_CUE.test(text) && LIST_REVIEWS_CUE.test(text)) {
    return 'list_providers_list_provider_reviews';
  }
  if (LIST_SERVICES_CUE.test(text) && SUGGEST_PACKAGE_BLOCK_CUE.test(text)) {
    return 'list_services_suggest_package_block';
  }
  if (LIST_PROVIDERS_CUE.test(text) && CHECK_AVAILABILITY_CUE.test(text)) {
    return 'list_providers_check_availability';
  }
  if (
    DISCOVER_PACKAGES_CUE.test(text) &&
    RECOMMEND_SPECIALISTS_CUE.test(text)
  ) {
    return 'discover_packages_recommend_specialists';
  }
  if (BOOK_APPOINTMENT_CUE.test(text) && BUSINESS_INFO_CUE.test(text)) {
    return 'book_appointment_business_info';
  }
  return null;
}

export function isPublicAssistantCompoundPrompt(prompt: string): boolean {
  return detectPublicAssistantCompoundShape(prompt) !== null;
}

export function decomposePublicAssistantCompoundPrompt(
  prompt: string,
): PublicAssistantCompoundStep[] {
  const shape = detectPublicAssistantCompoundShape(prompt);
  if (!shape) return [];

  const [first, second] = SHAPE_ACTIONS[shape];
  const segment = prompt.trim();
  return [
    { action: first, params: {}, segment },
    { action: second, params: {}, segment },
  ];
}

export function rescuePublicAssistantCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isPublicAssistantCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'public_assistant_compound',
  };
}
