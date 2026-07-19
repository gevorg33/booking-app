import {
  LIST_PROVIDER_REVIEWS_PROMPTS,
  type ListProviderReviewsPromptFixture,
} from './ai-list-provider-reviews.fixtures.js';

export const LIST_PROVIDER_REVIEWS_INTENTS = ['list_provider_reviews'] as const;

export type ListProviderReviewsIntent =
  (typeof LIST_PROVIDER_REVIEWS_INTENTS)[number];

const SUBMIT_REVIEW_BLOCK = new RegExp(
  String.raw`\b(?:give|rate|leave|submit|write)\b.{0,24}\b(?:star|rating|review)\b|\b\d\s*/\s*5\b|\b\d\s+stars?\b`,
  'iu',
);

const REVIEWS_READ_CUE = new RegExp(
  String.raw`\b(?:reviews?|ratings?|what\s+do\s+(?:people|customers|clients|reviewers)\s+say|how\s+many\s+reviews?)\b`,
  'iu',
);

const PROVIDER_SCOPE_CUE = new RegExp(
  String.raw`\b(?:providers?|stylists?|specialists?|therapists?|team|about\s+[A-Z][a-z]+|for\s+[A-Z][a-z]+|this\s+(?:stylist|provider|specialist)|your\s+providers?)\b`,
  'iu',
);

const NAMED_PROVIDER_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:about|for)\s+([A-Za-z][\w.'-]{1,40})\b/i,
  /\breviews?\s+(?:for|on|about)\s+([A-Za-z][\w.'-]{1,40})\b/i,
  /\bhow\s+many\s+reviews?\s+does\s+([A-Za-z][\w.'-]{1,40})\s+have\b/i,
];

function matchListProviderReviewsScenario(
  prompt: string,
): ListProviderReviewsPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of LIST_PROVIDER_REVIEWS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isListProviderReviewsIntent(
  action: string,
): action is ListProviderReviewsIntent {
  return (LIST_PROVIDER_REVIEWS_INTENTS as readonly string[]).includes(action);
}

export function extractProviderNameForReviewsPrompt(
  prompt: string,
): string | null {
  for (const pattern of NAMED_PROVIDER_PATTERNS) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.trim().replace(/[?.!,]+$/g, '');
    if (!name || name.length < 2) continue;
    if (
      /\b(?:your|our|the|this|providers?|stylists?|specialists?|people|customers?|clients?)\b/i.test(
        name,
      )
    ) {
      continue;
    }
    return name;
  }
  return null;
}

export function isListProviderReviewsPrompt(prompt: string): boolean {
  if (matchListProviderReviewsScenario(prompt)) return true;
  if (SUBMIT_REVIEW_BLOCK.test(prompt)) return false;
  if (!REVIEWS_READ_CUE.test(prompt)) return false;
  if (!PROVIDER_SCOPE_CUE.test(prompt) && !extractProviderNameForReviewsPrompt(prompt)) {
    return false;
  }
  return true;
}

export function enrichListProviderReviewsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const scenario = matchListProviderReviewsScenario(prompt);
  const providerName =
    (params.providerName as string | undefined)?.trim() ||
    scenario?.providerName ||
    extractProviderNameForReviewsPrompt(prompt) ||
    undefined;
  return {
    ...params,
    ...(providerName ? { providerName } : {}),
  };
}

export function rescueListProviderReviewsIntent(
  prompt: string,
  action: string,
): { action: ListProviderReviewsIntent; rescueReason: string } | null {
  if (isListProviderReviewsIntent(action)) return null;
  if (!isListProviderReviewsPrompt(prompt)) return null;
  return {
    action: 'list_provider_reviews',
    rescueReason: 'provider_reviews',
  };
}

export function detectListProviderReviewsAction(
  prompt: string,
): ListProviderReviewsIntent | null {
  return rescueListProviderReviewsIntent(prompt, 'unknown')?.action ?? null;
}
