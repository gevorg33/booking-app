import {
  DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS,
  type DismissRecommendationsMultilingualScenario,
} from './ai-dismiss-recommendations-multilingual.fixtures.js';
import {
  DISMISS_RECOMMENDATIONS_PROMPTS,
  type DismissRecommendationsPromptFixture,
} from './ai-dismiss-recommendations.fixtures.js';

export const DISMISS_RECOMMENDATIONS_INTENTS = [
  'dismiss_recommendations',
] as const;

export type DismissRecommendationsIntent =
  (typeof DISMISS_RECOMMENDATIONS_INTENTS)[number];

export {
  CUSTOMER_DISMISS_RECOMMENDATIONS_CLASSIFIER_RULES,
  DISMISS_RECOMMENDATIONS_PROMPTS,
  DISMISS_RECOMMENDATIONS_RESCUE_SCENARIOS,
} from './ai-dismiss-recommendations.fixtures.js';
export { DISMISS_RECOMMENDATIONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-dismiss-recommendations-multilingual.fixtures.js';

export interface ParsedDismissRecommendations {
  bookingId?: string;
  serviceId?: string;
}

function hasReadDismissCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|does|do|is|are|can|tell|explain|show|describe|mean|meaning|walk|happen)\b/i.test(
      prompt,
    ) ||
    /(ինչ|ինչպես|բացատր|պատմ|նկարագր|что|как|почему|можно|расскаж|объясн|зачем)/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim())
  );
}

function hasRecommendationsDismissTopic(prompt: string): boolean {
  return (
    /\b(?:recommendations?|you might also like|product cards?|suggested products?|recommended products?)\b/i.test(
      prompt,
    ) ||
    /(ապրանքի\s+քարտ|առաջարկություն|you might also like|рекомендац|товарн)/i.test(
      prompt,
    )
  );
}

function isBookingCancelPrompt(prompt: string): boolean {
  if (!hasRecommendationsDismissTopic(prompt)) {
    return (
      /\b(?:cancel|delete|dismiss)\b.+\b(?:my|the|this)\s+(?:booking|appointment)\b/i.test(
        prompt,
      ) ||
      /\b(?:cancel|delete)\s+(?:my|the|this)\s+(?:booking|appointment)\b/i.test(
        prompt,
      )
    );
  }
  return false;
}

function isDismissImperative(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (
    /^(?:dismiss|hide|close)\s+(?:the\s+)?(?:recommendations?|you might also like|product cards?)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  if (
    /\b(?:stop|don't|do not|no more)\s+(?:showing|show)\b/i.test(prompt) &&
    hasRecommendationsDismissTopic(prompt)
  ) {
    return true;
  }
  if (/\bturn off\b.+\b(?:recommendations?|product cards?)\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(?:remove|get rid of)\b.+\b(?:product cards?|recommendations?|you might also like)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /(թաքց|փակ|չցուցադր)/iu.test(prompt) &&
    hasRecommendationsDismissTopic(prompt)
  ) {
    return true;
  }
  if (
    /(скро|убер|не\s+показыв)/iu.test(prompt) &&
    hasRecommendationsDismissTopic(prompt)
  ) {
    return true;
  }
  return false;
}

function matchDismissRecommendationsScenario(
  prompt: string,
):
  | DismissRecommendationsPromptFixture
  | DismissRecommendationsMultilingualScenario
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of DISMISS_RECOMMENDATIONS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of DISMISS_RECOMMENDATIONS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bfor\s+booking\s+([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

export function isDismissRecommendationsIntent(
  action: string,
): action is DismissRecommendationsIntent {
  return (DISMISS_RECOMMENDATIONS_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isDismissRecommendationsPrompt(prompt: string): boolean {
  if (matchDismissRecommendationsScenario(prompt)) return true;
  if (isBookingCancelPrompt(prompt)) return false;
  if (isDismissImperative(prompt)) return true;
  if (hasReadDismissCue(prompt)) return false;
  return false;
}

export function parseDismissRecommendationsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedDismissRecommendations | null {
  const scenario = matchDismissRecommendationsScenario(prompt);
  if (scenario) {
    const bookingId =
      ('bookingId' in scenario ? scenario.bookingId : undefined) ??
      (typeof params.bookingId === 'string'
        ? params.bookingId.trim()
        : undefined);
    const serviceId =
      ('serviceId' in scenario ? scenario.serviceId : undefined) ??
      (typeof params.serviceId === 'string'
        ? params.serviceId.trim()
        : undefined);
    return { bookingId, serviceId };
  }

  if (!isDismissRecommendationsPrompt(prompt)) return null;

  const bookingId =
    (typeof params.bookingId === 'string'
      ? params.bookingId.trim()
      : undefined) ?? extractBookingIdFromPrompt(prompt);
  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;

  return { bookingId, serviceId };
}

export function enrichDismissRecommendationsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseDismissRecommendationsFromPrompt(prompt, params);
  if (!parsed) return params;
  const next = { ...params };
  if (parsed.bookingId) next.bookingId = parsed.bookingId;
  if (parsed.serviceId) next.serviceId = parsed.serviceId;
  return next;
}

export function buildDismissRecommendationsSummary(): string {
  return 'Hiding the "You might also like" product recommendations for this booking success screen. Your appointment is still confirmed.';
}

export function rescueDismissRecommendationsIntent(
  prompt: string,
  action: string,
): { action: DismissRecommendationsIntent; rescueReason: string } | null {
  if (isDismissRecommendationsIntent(action)) return null;
  if (!parseDismissRecommendationsFromPrompt(prompt)) return null;
  return {
    action: 'dismiss_recommendations',
    rescueReason: 'dismiss_recommendations',
  };
}
