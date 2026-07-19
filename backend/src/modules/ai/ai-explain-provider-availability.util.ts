import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { isFindSoonestAppointmentPrompt } from './ai-find-soonest-appointment.util.js';
import { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS } from './ai-explain-provider-availability-multilingual.fixtures.js';
import {
  EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS,
  type ExplainProviderAvailabilityPromptFixture,
  type ProviderAvailabilityAspect,
} from './ai-explain-provider-availability.fixtures.js';

export { EXPLAIN_PROVIDER_AVAILABILITY_CLASSIFIER_RULES } from './ai-explain-provider-availability.fixtures.js';
export { EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_CLASSIFIER_RULES } from './ai-explain-provider-availability-multilingual.fixtures.js';

export const EXPLAIN_PROVIDER_AVAILABILITY_INTENTS = [
  'explain_provider_availability',
] as const;

export type ExplainProviderAvailabilityIntent =
  (typeof EXPLAIN_PROVIDER_AVAILABILITY_INTENTS)[number];

const BOOK_VERB = /\b(book|schedule|reserve|grab)\b/i;

const SOONEST_BLOCK =
  /\b(soonest|earliest|nearest|first\s+available|asap|as\s+soon\s+as\s+possible)\b/i;

const RANK_BLOCK =
  /\b(?:best|top\s+rated|highest\s+rated|recommend)\s+(?:stylist|specialist|provider|therapist)\b|\bwho\s+is\s+the\s+best\b/i;

const DAY_CUE = new RegExp(
  String.raw`\b(?:tomorrow|tonight|today|this\s+week|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b`,
  'iu',
);

const NAMED_SCHEDULE_PATTERNS: ReadonlyArray<RegExp> = [
  // e2e-bug.93 — "When is Mariam available this week?"
  /\bwhen\s+(?:is|are)\s+([A-Za-z][\w.'-]{1,40})\s+available\b/i,
  /\b(?:is|are)\s+([A-Za-z][\w.'-]{1,40})\s+available\b/i,
  /\b([A-Za-z][\w.'-]{1,40})(?:'s|’s)?\s+availability\b/i,
  /\b(?:is|are)\s+([A-Za-z][\w.'-]{1,30})\s+(?:working|in|on\s+duty|scheduled)\b/i,
  /\b(?:does|do)\s+([A-Za-z][\w.'-]{1,30})\s+work\b/i,
  /(?:արդյո՞ք|արդյոք)\s+([A-Za-z][\w.'-]{1,30})-?ն?\s+աշխատում/i,
  /([A-Za-z][\w.'-]{1,30})-?ն?\s+աշխատու՞մ/i,
  /работает\s+ли\s+([A-Za-z][\w.'-]{1,30})/iu,
];

const TEAM_OPENINGS_PATTERNS: ReadonlyArray<RegExp> = [
  /\bwho\s+has\s+openings?\b/i,
  /\b(?:who|which)\s+(?:stylist|specialist|provider|therapist|staff|master)s?\s+(?:has|have|is|are)\s+(?:openings?|available|working|free)\b/i,
  /\bwho\s+is\s+working\b/i,
  /\bwhich\s+providers?\s+have\s+openings?\b/i,
  /ով\s+ունի\s+ազատ/i,
  /у\s+кого\s+есть\s+окн/i,
  /кто\s+работает/i,
];

const PICK_PROVIDER_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\s+with\s+.+?\s+for\b|\b(?:pick|choose|select)\s+[A-Za-z].+?\s+for\b|\b(?:same|usual)\s+(?:stylist|specialist|provider)\b`,
  'iu',
);

const SPECIALTY_READ_BLOCK = new RegExp(
  String.raw`\b(?:tell\s+me\s+about|who\s+specializes?|specialty)\b`,
  'iu',
);

const PLAIN_AVAILABILITY_BLOCK = new RegExp(
  String.raw`\b(?:free\s+slots?|check\s+availability|availability\s+for)\b`,
  'iu',
);

function cleanCapturedPhrase(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ն$/u, '')
    .replace(/-ի$/u, '')
    .trim();
}

function matchExplainProviderAvailabilityScenario(
  prompt: string,
): ExplainProviderAvailabilityPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PROVIDER_AVAILABILITY_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PROVIDER_AVAILABILITY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractProviderNameForAvailabilityPrompt(
  prompt: string,
): string | null {
  for (const pattern of NAMED_SCHEDULE_PATTERNS) {
    const match = prompt.match(pattern);
    const captured = match?.[1]?.trim();
    if (!captured) continue;
    const cleaned = cleanCapturedPhrase(captured);
    if (cleaned.length >= 2) return cleaned;
  }
  return null;
}

export function inferProviderAvailabilityAspect(
  prompt: string,
): ProviderAvailabilityAspect {
  if (TEAM_OPENINGS_PATTERNS.some((pattern) => pattern.test(prompt))) {
    return 'team_openings';
  }
  if (extractProviderNameForAvailabilityPrompt(prompt)) {
    return 'named_schedule';
  }
  return 'team_openings';
}

export function hasProviderAvailabilityDayCue(prompt: string): boolean {
  return DAY_CUE.test(prompt);
}

export function isExplainProviderAvailabilityIntent(
  action: string,
): action is ExplainProviderAvailabilityIntent {
  return (EXPLAIN_PROVIDER_AVAILABILITY_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isExplainProviderAvailabilityPrompt(prompt: string): boolean {
  if (matchExplainProviderAvailabilityScenario(prompt)) return true;
  if (BOOK_VERB.test(prompt)) return false;
  if (isFindSoonestAppointmentPrompt(prompt)) return false;
  if (SOONEST_BLOCK.test(prompt)) return false;
  if (PICK_PROVIDER_BLOCK.test(prompt)) return false;
  if (RANK_BLOCK.test(prompt)) return false;
  if (PLAIN_AVAILABILITY_BLOCK.test(prompt)) return false;
  if (SPECIALTY_READ_BLOCK.test(prompt)) return false;

  const namedSchedule = NAMED_SCHEDULE_PATTERNS.some((pattern) =>
    pattern.test(prompt),
  );
  const teamOpenings = TEAM_OPENINGS_PATTERNS.some((pattern) =>
    pattern.test(prompt),
  );

  if (!namedSchedule && !teamOpenings) return false;
  if (!hasProviderAvailabilityDayCue(prompt) && !teamOpenings) return false;

  if (
    namedSchedule &&
    /\b(?:tell\s+me\s+about|specialty|specializes?)\b/i.test(prompt)
  ) {
    return false;
  }

  return true;
}

export function parseExplainProviderAvailabilityFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  aspect: ProviderAvailabilityAspect;
  employeeName?: string;
} | null {
  if (!isExplainProviderAvailabilityPrompt(prompt)) return null;

  const scenario = matchExplainProviderAvailabilityScenario(prompt);
  const aspectFromParams =
    params.aspect === 'named_schedule' || params.aspect === 'team_openings'
      ? params.aspect
      : undefined;
  const aspect =
    aspectFromParams ??
    scenario?.aspect ??
    inferProviderAvailabilityAspect(prompt);

  if (aspect === 'team_openings') {
    return { aspect };
  }

  const employeeName =
    (params.employeeName as string | undefined) ??
    scenario?.employeeName ??
    extractProviderNameForAvailabilityPrompt(prompt);

  return {
    aspect,
    ...(employeeName ? { employeeName } : {}),
  };
}

export function enrichExplainProviderAvailabilityParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const parsed = parseExplainProviderAvailabilityFromPrompt(prompt, params);
  if (!parsed) return params;

  const shared = buildSharedBookingContextFromPrompt(prompt, timeZone);
  if (parsed.aspect === 'team_openings') {
    return {
      ...params,
      ...shared,
      aspect: parsed.aspect,
      allProviders: true,
      employeeName: null,
    };
  }

  return {
    ...params,
    ...shared,
    aspect: parsed.aspect,
    allProviders: false,
    ...(parsed.employeeName ? { employeeName: parsed.employeeName } : {}),
  };
}

export function rescueExplainProviderAvailabilityIntent(
  prompt: string,
  action: string,
): { action: ExplainProviderAvailabilityIntent; rescueReason: string } | null {
  if (isExplainProviderAvailabilityIntent(action)) return null;
  if (!parseExplainProviderAvailabilityFromPrompt(prompt)) return null;
  return {
    action: 'explain_provider_availability',
    rescueReason: 'explain_provider_availability',
  };
}

export function detectExplainProviderAvailabilityAction(
  prompt: string,
): ExplainProviderAvailabilityIntent | null {
  return (
    rescueExplainProviderAvailabilityIntent(prompt, 'unknown')?.action ?? null
  );
}
