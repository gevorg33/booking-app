import { isAnyProviderBookingPrompt } from './any-provider-booking.semantic.util.js';
import { isFlexibleAvailabilityAnyProviderPrompt } from './ai-flexible-availability.util.js';
import { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS } from './ai-explain-any-provider-option-multilingual.fixtures.js';
import {
  EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS,
  type AnyProviderOptionAspect,
  type ExplainAnyProviderOptionPromptFixture,
} from './ai-explain-any-provider-option.fixtures.js';

export { EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-any-provider-option-multilingual.fixtures.js';

export const ANY_PROVIDER_OPTION_INTENTS = [
  'explain_any_provider_option',
] as const;

export type AnyProviderOptionIntent =
  (typeof ANY_PROVIDER_OPTION_INTENTS)[number];

export interface ParsedExplainAnyProviderOption {
  aspect: AnyProviderOptionAspect;
}

const ANY_OPTION_TOPIC = new RegExp(
  String.raw`\b(?:any\s+(?:stylist|specialist|provider|staff|therapist)|any\s+available\s+specialist|don't\s+(?:pick|choose)\s+(?:a\s+)?(?:stylist|specialist|provider)|without\s+(?:picking|choosing)\s+(?:a\s+)?(?:stylist|specialist)|any\s+provider\s+option|any\s+specialist\s+option|specialist\s+picker|any\s+provider\s+works|don't\s+care\s+who)\b|(?:ցանկացած\s+մասնագետ|այն\s+մասնագետ)|(?:любой\s+специалист|любого\s+специалиста|вариант\s+люб)`,
  'iu',
);

const READ_CUE = new RegExp(
  String.raw`\b(?:what\s+(?:does|is|happens)|will\s+someone|who\s+gets|how\s+do\s+i|explain|show\s+me|mean|assigned|happen|see\s+which|where\s+is)\b|(?:ինչ\s+է|ինչպես|ով\s+կկց|բացատր)|(?:что\s+значит|кто\s+будет|как\s+выбрать|объясни)`,
  'iu',
);

/** e2e-bug.92 — casual indifference ("I don't care who… works fine"). */
const INDIFFERENCE_CUE = new RegExp(
  String.raw`\b(?:don't\s+care\s+who|any\s+(?:provider|stylist|specialist)\s+works|any\s+(?:provider|stylist|specialist)\s+(?:is\s+)?fine|works\s+fine|whoever)\b`,
  'iu',
);

const BOOKING_MUTATE_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve|grab|check)\b.{0,40}\b(?:any\s+(?:stylist|specialist|provider)|who(?:ever)?\s+is\s+free|first\s+available)\b|\b(?:any\s+(?:stylist|specialist|provider)).{0,40}\b(?:book|schedule|reserve|tomorrow|tonight|friday|monday|\d{1,2}[:/])\b`,
  'iu',
);

const RECOMMEND_BLOCK = new RegExp(
  String.raw`\b(?:who\s+is\s+best|recommend|top\s+rated|who\s+should\s+i\s+see|specializes?\s+in)\b`,
  'iu',
);

const ROSTER_BLOCK = new RegExp(
  String.raw`\b(?:list\s+(?:all\s+)?providers|who\s+works\s+here|show\s+(?:the\s+)?team)\b`,
  'iu',
);

function matchExplainAnyProviderOptionScenario(
  prompt: string,
): ExplainAnyProviderOptionPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_ANY_PROVIDER_OPTION_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_ANY_PROVIDER_OPTION_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferAnyProviderOptionAspect(
  prompt: string,
): AnyProviderOptionAspect {
  const picker =
    /\b(?:how\s+do\s+i\s+pick|how\s+to\s+select|where\s+is|specialist\s+picker|select\s+any|pick\s+any)\b/i.test(
      prompt,
    ) || /(?:ինչպես\s+ընտր|որտեղ\s+է)/iu.test(prompt);
  const assignment =
    /\b(?:will\s+someone|who\s+gets|assigned|don't\s+(?:pick|choose)|without\s+(?:picking|choosing)|after\s+booking|see\s+which\s+stylist|don't\s+care\s+who|any\s+(?:provider|stylist|specialist)\s+works|works\s+fine|whoever)\b/i.test(
      prompt,
    ) || /(?:ով\s+կկց|կնշանակ|назнач)/iu.test(prompt);
  const meaning =
    /\b(?:what\s+(?:does|is)|what\s+happens|mean|option)\b/i.test(prompt) ||
    /(?:ինչ\s+է\s+նշանակ|что\s+значит)/iu.test(prompt);

  const topics = [picker, assignment, meaning].filter(Boolean).length;
  if (topics > 1) return 'all';
  if (picker) return 'picker';
  if (assignment) return 'assignment';
  if (meaning) return 'what_it_means';
  return 'all';
}

export function isAnyProviderOptionIntent(
  action: string,
): action is AnyProviderOptionIntent {
  return (ANY_PROVIDER_OPTION_INTENTS as readonly string[]).includes(action);
}

export function isExplainAnyProviderOptionPrompt(prompt: string): boolean {
  if (matchExplainAnyProviderOptionScenario(prompt)) return true;
  if (BOOKING_MUTATE_BLOCK.test(prompt)) return false;
  if (isAnyProviderBookingPrompt(prompt)) return false;
  // e2e-bug.92 — indifference ("don't care who / works fine") is explain, not flexible book.
  if (
    isFlexibleAvailabilityAnyProviderPrompt(prompt) &&
    !INDIFFERENCE_CUE.test(prompt)
  ) {
    return false;
  }
  if (RECOMMEND_BLOCK.test(prompt)) return false;
  if (ROSTER_BLOCK.test(prompt)) return false;
  if (!ANY_OPTION_TOPIC.test(prompt)) return false;
  // e2e-bug.92 — indifference phrasing does not need explain/what-does cues.
  if (!READ_CUE.test(prompt) && !INDIFFERENCE_CUE.test(prompt)) return false;
  return true;
}

export function parseExplainAnyProviderOptionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainAnyProviderOption | null {
  if (!isExplainAnyProviderOptionPrompt(prompt)) return null;

  const scenario = matchExplainAnyProviderOptionScenario(prompt);
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    ['what_it_means', 'assignment', 'picker', 'all'].includes(params.aspect)
      ? (params.aspect as AnyProviderOptionAspect)
      : undefined;

  return {
    aspect:
      aspectFromParams ??
      scenario?.aspect ??
      inferAnyProviderOptionAspect(prompt),
  };
}

export function rescueExplainAnyProviderOptionIntent(
  prompt: string,
  action: string,
): { action: AnyProviderOptionIntent; rescueReason: string } | null {
  if (isAnyProviderOptionIntent(action)) return null;
  if (!parseExplainAnyProviderOptionFromPrompt(prompt)) return null;
  return {
    action: 'explain_any_provider_option',
    rescueReason: 'any_provider_option',
  };
}

export function detectExplainAnyProviderOptionAction(
  prompt: string,
): AnyProviderOptionIntent | null {
  return (
    rescueExplainAnyProviderOptionIntent(prompt, 'unknown')?.action ?? null
  );
}
