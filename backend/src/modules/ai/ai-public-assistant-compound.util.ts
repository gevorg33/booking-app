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

  if (LIST_PROVIDERS_CUE.test(text) && CHECK_AVAILABILITY_CUE.test(text)) {
    return 'list_providers_check_availability';
  }
  if (DISCOVER_PACKAGES_CUE.test(text) && RECOMMEND_SPECIALISTS_CUE.test(text)) {
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
