import {
  LIST_PROVIDERS_PROMPTS,
  type ListProvidersPromptFixture,
} from './ai-list-providers.fixtures.js';

export const LIST_PROVIDERS_INTENTS = ['list_providers'] as const;

export type ListProvidersIntent = (typeof LIST_PROVIDERS_INTENTS)[number];

export {
  LIST_PROVIDERS_CLASSIFIER_RULES,
  LIST_PROVIDERS_PROMPTS,
  LIST_PROVIDERS_RESCUE_SCENARIOS,
  LIST_PROVIDERS_NEGATIVE_PROMPTS,
} from './ai-list-providers.fixtures.js';

/** Roster / team listing — not availability for a service. */
const ROSTER_CUE = new RegExp(
  String.raw`\b(?:` +
    String.raw`who\s+are\s+(?:your|our|the)\s+(?:providers?|specialists?|stylists?|therapists?|staff|team|employees?)` +
    String.raw`(?:\s*/\s*(?:providers?|specialists?|stylists?|staff|team))?` +
    String.raw`|who\s+works\s+here` +
    String.raw`|(?:list|show|see)\s+(?:(?:me|us)\s+)?(?:(?:all|your|our|the)\s+)?(?:providers?|specialists?|stylists?|therapists?|staff|team|employees?)` +
    String.raw`|show\s+me\s+your\s+team` +
    String.raw`|what\s+(?:providers?|specialists?|stylists?|therapists?)\s+do\s+you\s+have` +
    String.raw`)\b`,
  'iu',
);

/** Availability / rank / book cues — not plain roster. */
const NOT_ROSTER_CUE = new RegExp(
  String.raw`\b(?:` +
    String.raw`available|availability|avail|free|open|slots?|times?|` +
    String.raw`recommend|best|top|highest|rated|reviews?|` +
    String.raw`book|schedule|reserve|` +
    String.raw`check\s+(?:who|providers?|availability)|` +
    String.raw`who\s+(?:is|are)\s+(?:free|available)|` +
    String.raw`who\s+can\b` +
    String.raw`)\b`,
  'iu',
);

/** "providers for {service}" is check_providers_for_service, not roster. */
const SERVICE_SCOPED_ROSTER = new RegExp(
  String.raw`\b(?:providers?|specialists?|stylists?|therapists?|staff)\s+for\b`,
  'iu',
);

function matchListProvidersScenario(
  prompt: string,
): ListProvidersPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of LIST_PROVIDERS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isListProvidersIntent(
  action: string,
): action is ListProvidersIntent {
  return (LIST_PROVIDERS_INTENTS as readonly string[]).includes(action);
}

export function isListProvidersPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchListProvidersScenario(text)) return true;
  if (NOT_ROSTER_CUE.test(text)) return false;
  if (SERVICE_SCOPED_ROSTER.test(text)) return false;
  return ROSTER_CUE.test(text);
}

export function rescueListProvidersIntent(
  prompt: string,
  action: string,
): { action: ListProvidersIntent; rescueReason: string } | null {
  if (isListProvidersIntent(action)) return null;
  if (!isListProvidersPrompt(prompt)) return null;
  return {
    action: 'list_providers',
    rescueReason: 'list_providers_roster',
  };
}

export function detectListProvidersAction(
  prompt: string,
): ListProvidersIntent | null {
  return rescueListProvidersIntent(prompt, 'unknown')?.action ?? null;
}
